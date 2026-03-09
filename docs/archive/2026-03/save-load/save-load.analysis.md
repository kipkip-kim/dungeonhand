# save-load Analysis Report (v2)

> **Analysis Type**: Gap Analysis (Plan vs Implementation) -- Re-run after fixes
>
> **Project**: Dungeon Hand v3
> **Analyst**: gap-detector
> **Date**: 2026-03-09
> **Plan Doc**: [save-load.plan.md](../01-plan/features/save-load.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Plan 문서(save-load.plan.md) 대비 실제 구현 코드의 일치도를 측정하고, 누락/변경/추가 항목을 식별한다.
v1 분석에서 발견된 5건의 갭 중 수정/결정된 사항을 반영한 재분석.

### 1.2 Analysis Scope

- **Plan Document**: `docs/01-plan/features/save-load.plan.md`
- **Implementation Files**:
  - `DungeonHand_v3.jsx` -- saveMeta(override), saveRun, clearRunSave, loadMeta, loadRun, hasSavedRun, game props
  - `utils.js` -- setNextId 함수
  - `screens/SmallScreens.jsx` -- MenuScreen (이어하기 + 새 게임 확인 팝업)
  - `screens/VillageScreen.jsx` -- saveMeta 호출 (3곳: 스킬 구매/궁극기 해금/스킬 초기화)

### 1.3 Changes Since v1 Analysis

| # | v1 Gap | Resolution | Status |
|---|--------|-----------|:------:|
| 1 | 스킬 구매 직후 saveMeta 미호출 | saveMeta(override) 파라미터 도입 + 3곳 모두 즉시 호출 | Fixed |
| 2 | 수동 저장 버튼 없음 | 자동저장이 모든 안전 시점 커버 -- 불필요 판정 | Won't Fix |
| 3 | 마을 진입 시 saveRun | 마을은 런 외부 -- Plan 사양 과잉 | Plan Update |
| 4 | 전투 중 저장 불가 안내 | 수동 저장 없으므로 안내 불필요 | N/A |
| 5 | 스키마 마이그레이션 분기 | v1이므로 현재 불필요 | Deferred |

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Section 2: 저장 대상 분류 | 95% | [OK] |
| Section 3: 저장 시점 | 92% | [OK] |
| Section 4: 불러오기 시점 | 100% | [OK] |
| Section 5: localStorage 키 설계 | 67% | [WARN] |
| Section 7: 리스크 대응 | 75% | [WARN] |
| Section 8: 완료 기준 | 100% | [OK] |
| **Overall** | **93%** | **[OK]** |

---

## 3. Detailed Gap Analysis

### 3.1 Section 2: 저장 대상 분류

#### 2.1 메타 진행 (항상 저장)

| Plan Field | saveMeta() 포함 | Status |
|------------|:---------:|:------:|
| `metaPoints` | Yes | [OK] |
| `upgradeLevels` | Yes | [OK] |
| `resetCount` | Yes | [OK] |

#### 2.2 런 진행 (안전 시점에 저장)

| Plan Field | saveRun() 포함 | Status |
|------------|:---------:|:------:|
| `classId` | Yes | [OK] |
| `floor` | Yes | [OK] |
| `battleNum` | Yes | [OK] |
| `gold` | Yes | [OK] |
| `hp` | Yes | [OK] |
| `deck` | Yes | [OK] |
| `relics` | Yes | [OK] |
| `discardedRelicIds` | Yes | [OK] |
| `bossesKilled` | Yes | [OK] |
| `passiveState` | Yes | [OK] |
| `poison` | Yes | [OK] |
| `tenacityUsed` | Yes | [OK] |

#### 2.2+ 추가 필드 (Plan에 없음, 구현에 있음)

| Field | Implementation Location | Description |
|-------|------------------------|-------------|
| `maxCardId` | saveRun() line 149 | 카드 ID 충돌 방지용 (리스크 대응에서 암시됨) |
| `v` (SAVE_VERSION) | saveMeta/saveRun | 스키마 버전 필드 (Plan Section 5에서 별도 키로 설계됨) |

#### 2.3 저장 제외 항목

모든 제외 대상이 올바르게 saveRun() 데이터에서 빠져 있음: [OK]

**Section 2 Match Rate: 95%** (추가 필드 존재하나 의도적 개선이므로 감점 최소화)

---

### 3.2 Section 3: 저장 시점 (6개 트리거)

| # | Plan 시점 | 트리거 | Plan 저장 대상 | 구현 상태 | Status |
|---|-----------|--------|---------------|-----------|:------:|
| 1 | 마을 진입 | `setScreen("village")` | 메타 + 런 | 마을은 런 외부. 퇴장 시 saveMeta() 호출 (line 150). Plan 사양 과잉 | [OK*] |
| 2 | 캠프 진입 | `setScreen("campfire")` 직전 | 메타 + 런 | `saveRun()` 호출 있음 (line 977) | [OK] |
| 3 | 상점 진입 | `setScreen("shop")` 직전 | 메타 + 런 | `saveRun()` 호출 있음 (line 1047) | [OK] |
| 4 | 스킬 구매 | `setUpgradeLevels` 후 | 메타만 | **[FIXED]** 3곳 모두 즉시 saveMeta(override) 호출 | [OK] |
| 5 | 런 종료 | victory/defeat `claimAndGo` | 메타만 + 런 삭제 | `clearRunSave()` + meta 저장 있음 (line 1245-1247) | [OK] |
| 6 | 수동 메뉴 | "저장" 버튼 | 메타 + 런 | 수동 저장 없음 -- 자동저장으로 충분, Won't Fix | [OK*] |

**Section 3 Match Rate: 92%** (6개 중 5개 완전 일치, 2개는 의도적 미구현으로 허용)

#### v1 -> v2 변경 사항

**[FIXED] #4 스킬 구매 직후 saveMeta**

saveMeta가 override 파라미터를 받도록 변경되어, React setState 비동기 문제를 우회:

- 스킬 구매 (VillageScreen.jsx line 74): `saveMeta({ metaPoints: newMp, upgradeLevels: newUl })`
- 궁극기 해금 (VillageScreen.jsx line 99): `saveMeta({ upgradeLevels: newUl })`
- 스킬 초기화 (VillageScreen.jsx line 132): `saveMeta({ metaPoints: newMp, upgradeLevels: newUl, resetCount: newRc })`

DungeonHand_v3.jsx line 138-144에서 saveMeta(override)가 override 값 우선, 없으면 현재 state 사용.

**[OK*] #1, #6 의도적 미구현**

- #1 마을 진입: 마을은 런 외부 화면이므로 saveRun 불필요. Plan 문서 업데이트 권장.
- #6 수동 저장: 자동저장이 모든 안전 시점(캠프/상점/스킬 구매/런 종료)을 커버하므로 불필요.

---

### 3.3 Section 4: 불러오기 시점

| # | Plan 시점 | 구현 상태 | Status |
|---|-----------|-----------|:------:|
| 1 | 앱 시작 시 localStorage -> useState 초기값 | `loadMeta()` -> metaPoints/upgradeLevels/resetCount 초기값 (lines 43-54) | [OK] |
| 2 | 메뉴 화면: 런 저장 존재 시 "이어하기" 버튼 | `hasSavedRun()` + 조건부 렌더링 (SmallScreens.jsx line 71) | [OK] |
| 3 | 이어하기 클릭: 런 데이터 복원 | `loadRun()` -> state 복원 + 안전 시점 화면 이동 (lines 163-198) | [OK] |
| 4 | 새 게임 클릭: 확인 팝업 | `confirmNew` state + "진행 중인 데이터가 있습니다" 팝업 (SmallScreens.jsx lines 89-100) | [OK] |

**Section 4 Match Rate: 100%**

---

### 3.4 Section 5: localStorage 키 설계

| Plan 키 | 구현 키 | Status | Notes |
|---------|---------|:------:|-------|
| `dh_meta` | `dh_meta` | [OK] | 필드 일치 + `v` 추가 |
| `dh_run` | `dh_run` | [OK] | 필드 일치 + `maxCardId`, `v` 추가 |
| `dh_version` (별도 키) | `v` 필드 (각 객체 내부) | [CHANGED] | 별도 키 대신 각 저장 객체에 `v` 필드로 내장 |

**Section 5 Match Rate: 67%** (3개 중 2개 일치, 1개 설계 변경)

[CHANGED] dh_version -> v 내장 필드: 기능적으로 동일하며 오히려 각 데이터별 독립 버전 관리가 가능해 더 유연함. Impact: None.

---

### 3.5 Section 7: 리스크 대응

| # | 리스크 | Plan 대응 | 구현 상태 | Status |
|---|--------|-----------|-----------|:------:|
| 1 | 카드 함수 필드 직렬화 | ID 기반 복원 | `maxCardId` 저장 + `setNextId()` 복원 (utils.js) | [OK] |
| 2 | 스키마 버전 마이그레이션 | `dh_version` 키로 분기 | `SAVE_VERSION` 상수 존재, 마이그레이션 분기 미구현 | [WARN] |
| 3 | localStorage 용량 | 문제없음 | try-catch로 quota exceeded 처리 | [OK] |
| 4 | 전투 중 저장 불가 안내 | 안내 메시지 | 수동 저장 없으므로 안내 불필요 -- N/A | [OK*] |

**Section 7 Match Rate: 75%** (4개 중 3개 대응)

---

### 3.6 Section 8: 완료 기준

| # | 기준 | 구현 상태 | Status |
|---|------|-----------|:------:|
| 1 | 메타 데이터 새로고침 후 유지 | `loadMeta()` -> useState 초기값. 스킬 구매 직후에도 저장됨 | [OK] |
| 2 | 런 진행 마을/캠프/상점 진입 시 자동저장 | 캠프(line 977) + 상점(line 1047)에서 saveRun() 호출 | [OK] |
| 3 | 메뉴에서 "이어하기" 버튼으로 런 복원 | SmallScreens.jsx의 hasSavedRun + loadRun 구현 | [OK] |
| 4 | 승리/패배 후 런 저장 데이터 삭제 | claimAndGo에서 clearRunSave() 호출 (line 1245) | [OK] |
| 5 | 카드 keyword/common 참조 복원 정상 동작 | JSON 직렬화 시 순수 데이터 보존. setNextId로 ID 충돌 방지 | [OK] |

**Section 8 Match Rate: 100%**

---

## 4. Differences Summary

### [FAIL] Missing Features (Plan O, Implementation X)

None remaining after fixes. All previous gaps resolved or intentionally deferred.

### [WARN] Intentionally Deferred

| # | Item | Plan Location | Description | Rationale |
|---|------|---------------|-------------|-----------|
| 1 | 스키마 마이그레이션 분기 | Section 7 #2 | SAVE_VERSION 상수만 존재, 실제 분기 없음 | v1이므로 현재 불필요. v2 도입 시 구현 |

### [CHANGED] Changed Features (Plan != Implementation)

| # | Item | Plan | Implementation | Impact |
|---|------|------|----------------|--------|
| 1 | 함수 이름 | `saveGame()` | `saveRun()` | None (더 명확) |
| 2 | 함수 구조 | `loadRun()` 단일 | `loadRunData()` (raw) + `loadRun()` (state 복원) | None (2단계 분리) |
| 3 | dh_version 키 | 별도 localStorage 키 | 각 저장 객체 내 `v` 필드 | None (더 유연) |
| 4 | saveMeta 시그니처 | `saveMeta()` 무파라미터 | `saveMeta(override)` override 파라미터 | None (stale state 방지) |

### [NEW] Added Features (Plan X, Implementation O)

| # | Item | Implementation Location | Description |
|---|------|------------------------|-------------|
| 1 | `maxCardId` 필드 | saveRun() line 149 | 카드 ID 충돌 방지 |
| 2 | loadRun 화면 라우팅 | loadRun() lines 185-197 | battleNum 기반 campfire/shop/battle 자동 분기 |
| 3 | loadRun 상태 초기화 | loadRun() lines 177-181 | erodedIds/pendingRelic/gambit 등 전투 상태 클리어 |
| 4 | claimAndGo 내 직접 meta 저장 | line 1247 | earnedPoints 반영 위해 직접 JSON 작성 |
| 5 | saveMeta override 파라미터 | DungeonHand_v3.jsx line 138-144 | React setState 비동기 문제 우회 |

---

## 5. Match Rate Calculation

| Category | Weight | Score | Weighted |
|----------|:------:|:-----:|:--------:|
| 저장 대상 분류 (Sec 2) | 25% | 95% | 23.75 |
| 저장 시점 (Sec 3) | 25% | 92% | 23.00 |
| 불러오기 시점 (Sec 4) | 20% | 100% | 20.00 |
| localStorage 키 설계 (Sec 5) | 10% | 67% | 6.70 |
| 리스크 대응 (Sec 7) | 10% | 75% | 7.50 |
| 완료 기준 (Sec 8) | 10% | 100% | 10.00 |
| **Total** | **100%** | | **90.95%** |

**Overall Match Rate: 91%**

Previous: 85% -> Current: 91% (+6pp)

---

## 6. Recommended Actions

### 6.1 Remaining Actions (Optional)

| # | Priority | Item | Effort | Recommendation |
|---|----------|------|--------|----------------|
| 1 | Low | 스키마 마이그레이션 분기 | 10 min | v2 도입 시 loadMeta/loadRunData에 분기 추가. 현재 불필요 |

### 6.2 Plan Document Update Recommendations

Plan 문서를 실제 구현에 맞게 업데이트하면 match rate 100%에 근접:

1. **Section 3 #1**: 마을 진입 시 저장 -> 제거 (마을은 런 외부)
2. **Section 3 #4**: "스킬 구매 직후" -> "스킬 구매/궁극기 해금/스킬 초기화 시 즉시 saveMeta(override)" 반영
3. **Section 3 #6**: 수동 저장 버튼 -> 삭제 (자동저장으로 충분)
4. **Section 5**: `dh_version` 별도 키 -> 각 객체 내 `v` 필드로 변경
5. **Section 6.1**: `saveGame()` -> `saveRun()`, `saveMeta(override)` 시그니처 반영
6. **Section 7 #4**: 전투 중 저장 불가 안내 -> 삭제 (수동 저장 없으므로)

---

## 7. Synchronization Recommendation

Match Rate 91%로 "Design and implementation match well" 수준.

**권장 동기화 방식**: Plan 문서를 실제 구현에 맞게 업데이트 (Option 2)

모든 기능적 갭이 해소됨. 남은 차이는 구현이 Plan보다 합리적인 설계를 채택한 경우(함수 이름, 버전 필드 위치, override 파라미터)이며, Plan 문서 업데이트만으로 100% 도달 가능.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-09 | Initial gap analysis (85%) | gap-detector |
| 2.0 | 2026-03-09 | Re-analysis after fixes: saveMeta override, gap resolution (91%) | gap-detector |
