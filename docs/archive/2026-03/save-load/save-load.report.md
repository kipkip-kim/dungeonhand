# save-load Feature Completion Report

> **Summary**: 모바일 중간이탈 대응 localStorage 저장/불러오기 기능 완성
>
> **Project**: Dungeon Hand v3
> **Owner**: 게임팀
> **Duration**: Session 44 (2026-03-09)
> **Status**: Completed

---

## Executive Summary

### Overview

| Item | Details |
|------|---------|
| **Feature** | 저장/불러오기 시스템 (메타 데이터 + 런 진행) |
| **Start Date** | 2026-03-09 |
| **Completion Date** | 2026-03-09 |
| **Duration** | 1 session |
| **Owner** | 게임팀 |

### Results Summary

| Metric | Value |
|--------|-------|
| **Match Rate** | 91% (up from 85%) |
| **Files Modified** | 4 |
| **Functions Added** | 8 |
| **Iterations** | 1 |
| **Design Doc** | Skipped (small feature, plan sufficient) |

### 1.3 Value Delivered

| Perspective | Content |
|-------------|---------|
| **Problem** | 모바일 브라우저에서 중간이탈 시 진행 상태 전부 소실. 메타 포인트(스킬 트리) 투자 내역도 세션 종료 시 초기화됨. |
| **Solution** | localStorage 기반 자동저장(캠프/상점 진입 시) + 이어하기 버튼. saveMeta override 파라미터로 React 비동기 문제 해결. |
| **Function/UX Effect** | 브라우저 탭 닫아도 메타 유지, 캠프/상점에서 자동저장된 런 복원 가능. 메뉴 "이어하기" 버튼으로 마지막 저장점 복원. |
| **Core Value** | 모바일 유저 진행 보호 → 플레이 지속율 향상. 스킬 트리 투자 손실 방지로 장기 플레이 심리 개선. |

---

## PDCA Cycle Summary

### Plan

**Document**: [save-load.plan.md](../01-plan/features/save-load.plan.md)

**Goal**: localStorage 기반 메타 데이터(스킬 트리) 영구 저장 + 런 진행 자동저장/복원

**Key Decisions**:
- 메타는 항상 저장, 런은 안전 시점(캠프/상점/스킬 구매/런 종료)에만 저장
- 수동 저장 버튼 불필요 (자동저장으로 모든 시점 커버)
- 마을은 런 외부이므로 마을 진입 시 저장 제외
- saveMeta override 파라미터로 React setState 비동기 문제 우회

### Design

**Document**: None (작은 기능, 플랜만으로 충분)

### Do

**Implementation Scope** (4개 파일):

1. **DungeonHand_v3.jsx** (메인 로직)
   - `saveMeta(override)` — 메타 데이터 저장 (override 파라미터로 즉시 반영)
   - `saveRun()` — 런 데이터 저장 (classId, floor, battleNum, deck, relics, 등)
   - `clearRunSave()` — 런 저장 데이터 삭제 (승리/패배 후)
   - `loadMeta()` — useState 초기값으로 메타 데이터 로드
   - `loadRun()` — 런 데이터 복원 + 화면 라우팅 (battleNum 기반)
   - `loadRunData()` — 저장된 런 데이터 반환 (utils 호출)
   - `hasSavedRun()` — 저장된 런 존재 여부 확인
   - 자동저장 트리거 5곳: campfire 진입(line 977), shop 진입(line 1047), victory/defeat(line 1245-1247)

2. **utils.js** (유틸)
   - `setNextId(deck, maxCardId)` — 카드 ID 충돌 방지

3. **screens/SmallScreens.jsx** (UI)
   - MenuScreen: "이어하기" 버튼 + 새 게임 확인 팝업
   - 저장된 런 존재 시 조건부 렌더링

4. **screens/VillageScreen.jsx** (UI)
   - 스킬 구매/궁극기 해금/스킬 초기화 시 `saveMeta(override)` 즉시 호출 (3곳)

**Actual Duration**: 1 session

### Check

**Analysis Document**: [save-load.analysis.md](../03-analysis/save-load.analysis.md)

**Gap Analysis v1 → v2**:
- v1: 85% (5개 갭 발견)
- v2: 91% (1개 갭 수정, 4개 의도적 미구현/설계 변경)

**Key Improvements**:
1. saveMeta override 파라미터 도입 — 스킬 구매 직후 즉시 저장
2. loadRun 화면 라우팅 — battleNum 기반 campfire/shop/battle 자동 분기
3. maxCardId 필드 추가 — 카드 ID 충돌 방지

---

## Results

### Completed Items

- ✅ localStorage 구조 설계 (dh_meta, dh_run, v 필드)
- ✅ 메타 데이터 영구 저장 (metaPoints, upgradeLevels, resetCount)
- ✅ 런 진행 자동저장 (campfire/shop 진입, 스킬 구매, 런 종료)
- ✅ 런 데이터 복원 및 화면 라우팅 (loadRun)
- ✅ 메뉴 UI "이어하기" 버튼 + 새 게임 확인 팝업
- ✅ 카드 ID 충돌 방지 (setNextId + maxCardId)
- ✅ JSON 직렬화 시 함수 필드 손실 방지 (ID 기반 복원)
- ✅ VillageScreen에서 스킬 변경 직후 즉시 저장

### Deferred/Won't Fix Items

| Item | Reason | Impact |
|------|--------|--------|
| 수동 저장 버튼 | 자동저장(캠프/상점/스킬 구매/런 종료)이 모든 안전 시점 커버 | Low |
| 스키마 마이그레이션 분기 | v1이므로 현재 불필요, v2 도입 시 구현 | Low |
| 마을 진입 시 saveRun | 마을은 런 외부이므로 불필요 (메타만 저장) | Low |

---

## Lessons Learned

### What Went Well

- **설계 선택의 우수성**: saveMeta override 파라미터로 React setState 비동기 문제를 우아하게 해결
- **자동저장 커버리지**: 수동 저장 버튼 없이도 모든 안전 시점에서 자동 저장 (캠프, 상점, 스킬 구매, 런 종료)
- **Gap 분석의 정확성**: v1 분석에서 정확히 5개 갭을 식별, 모두 해결 또는 의도적으로 결정
- **Plan 문서의 충분성**: 작은 기능이므로 Design 문서 스킵 가능, Plan만으로 구현 방향 명확

### Areas for Improvement

- **스키마 버전 관리**: 별도 localStorage 키 대신 각 객체 내 v 필드로 변경. 더 유연하지만 마이그레이션 로직 추가 필요
- **함수 네이밍**: Plan에서 `saveGame()` → 구현에서 `saveRun()`으로 변경. 더 명확하지만 사전 조율 권장
- **loadRun 로직 복잡도**: battleNum 기반 화면 라우팅이 묵시적. 주석 추가 필요

### To Apply Next Time

- React setState 비동기 문제는 override 파라미터 패턴 활용 추천
- 자동저장 기능은 모든 상태 변경 지점 검토 후 설계 (수동 버튼 불필요성 사전 판단)
- localStorage 스키마 진화 계획: v1에서 각 객체에 v 필드 내장하여 v2 마이그레이션 기반 마련
- 작은 기능(~500줄)은 Design 문서 스킵 가능, Plan 충분도 검토

---

## Next Steps

1. **Plan 문서 업데이트**: 실제 구현에 맞게 6개 항목 동기화 (match rate 100% 달성)
   - 마을 진입 시 저장 제거
   - saveMeta(override) 시그니처 반영
   - 함수명 saveGame → saveRun
   - dh_version 키 → v 필드 변경

2. **선택적 개선**: v2 스키마 도입 계획 시 마이그레이션 로직 추가
   - loadMeta()/loadRunData()에 버전 분기 추가
   - 호환성 테스트 (v1 → v2)

3. **QA 검증**:
   - 모바일 탭 닫기/복구 사이클 테스트
   - 메타/런 데이터 영속성 확인
   - 카드 ID 충돌 테스트 (여러 번 저장/복원)

4. **성능 모니터링**:
   - localStorage 사용량 추적 (예상 ~5KB)
   - 복원 시간 측정 (초기 로드, 이어하기 클릭)

---

## Implementation Summary

### Code Quality Metrics

| Metric | Value |
|--------|-------|
| **Total Functions Added** | 8 |
| **Files Modified** | 4 |
| **Lines Added (approx)** | ~250 |
| **Test Coverage** | Manual (자동 저장/복원 사이클) |
| **Error Handling** | try-catch quota exceeded 처리 포함 |

### Key Implementation Details

**saveMeta(override) 패턴**:
```javascript
saveMeta(override = {}) {
  const data = {
    metaPoints: override.metaPoints ?? metaPoints,
    upgradeLevels: override.upgradeLevels ?? upgradeLevels,
    resetCount: override.resetCount ?? resetCount,
    v: SAVE_VERSION
  };
  localStorage.setItem("dh_meta", JSON.stringify(data));
}
```

**loadRun 화면 라우팅**:
- bn === 3: campfire 화면으로 복원
- bn >= 5: 상점 재생성
- 그 외: 전투 시작

**카드 ID 충돌 방지**:
- 저장 시: maxCardId 기록
- 복원 시: setNextId(deck, maxCardId) 호출 → 새 카드 ID 범위 조정

---

## Design vs Implementation Alignment

### Match Rate Summary

| Category | Plan | Implementation | Match | Weight | Weighted |
|----------|:----:|:---------------:|:-----:|:------:|:--------:|
| 저장 대상 분류 | 2.1-2.3 | 95% match | ✅ | 25% | 23.75 |
| 저장 시점 | 6 triggers | 5 구현 + 1 의도적 미 | ✅ | 25% | 23.00 |
| 불러오기 | 4 시점 | 4 구현 | ✅ | 20% | 20.00 |
| localStorage 키 | dh_* 설계 | v 필드 내장 | ⚠️ | 10% | 6.70 |
| 리스크 대응 | 4개 | 3개 구현 | ✅ | 10% | 7.50 |
| 완료 기준 | 5개 | 5개 달성 | ✅ | 10% | 10.00 |
| **Overall** | | | | **100%** | **91%** |

**Intentional Differences** (not counted as gaps):
- saveGame → saveRun: 더 명확한 함수명
- 수동 저장 미구현: 자동저장으로 충분
- 마을 저장 미구현: 마을은 런 외부

**Functional Gap**: 0 (all core features implemented)

---

## Related Documents

- **Plan**: [save-load.plan.md](../01-plan/features/save-load.plan.md)
- **Analysis**: [save-load.analysis.md](../03-analysis/save-load.analysis.md)
- **Implementation Files**:
  - C:\projects\dh\DungeonHand_v3.jsx (lines 43-54, 138-144, 159-198, 977, 1047, 1245-1247)
  - C:\projects\dh\utils.js (setNextId 함수)
  - C:\projects\dh\screens\SmallScreens.jsx (MenuScreen, lines 71, 89-100)
  - C:\projects\dh\screens\VillageScreen.jsx (saveMeta 호출 3곳)

---

## Approval & Sign-off

| Role | Status | Date |
|------|:------:|------|
| **Implementation** | ✅ Complete | 2026-03-09 |
| **Analysis** | ✅ 91% Match | 2026-03-09 |
| **QA Review** | ⏳ Pending | - |
| **PM Sign-off** | ⏳ Pending | - |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-09 | Initial completion report (91% match rate) | report-generator |
