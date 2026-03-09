# Plan: 저장/불러오기 기능

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 모바일 브라우저에서 중간이탈 시 진행 상태 전부 소실. 메타 포인트(스킬 트리)도 세션 종료 시 초기화 |
| **Solution** | localStorage 기반 자동저장 + 수동 저장/불러오기. 메타 진행은 항상 저장, 런 진행은 안전한 시점에만 저장 |
| **Function UX Effect** | 브라우저 탭 닫아도 이어하기 가능. 마을 진입 시 자동저장. 메뉴에서 "이어하기" 버튼 |
| **Core Value** | 모바일 유저의 진행 보호 → 플레이 지속율 향상 |

---

## 1. 배경 및 목적

- 현재 모든 게임 상태가 React useState로만 관리 → 새로고침/탭 닫기 시 전부 소실
- 모바일 환경에서 전화/알림으로 인한 중간이탈 빈번
- 메타 포인트(스킬 트리)는 런 간 유지되어야 하지만 현재 세션 한정

## 2. 저장 대상 분류

### 2.1 메타 진행 (항상 저장)
> 런과 무관하게 영구 보존되어야 하는 데이터

| state | 타입 | 설명 |
|-------|------|------|
| `metaPoints` | number | 메타 포인트 잔고 |
| `upgradeLevels` | object | 스킬 트리 투자 현황 (18노드 + 궁극기) |
| `resetCount` | number | 스킬 초기화 횟수 |

### 2.2 런 진행 (안전 시점에 저장)
> 현재 던전 런의 모든 상태. 전투 중 저장은 복원 복잡도가 높으므로 제외.

| state | 타입 | 설명 |
|-------|------|------|
| `classId` | string | 선택 직업 |
| `floor` | number | 현재 층 |
| `battleNum` | number | 현재 전투 번호 |
| `gold` | number | 골드 |
| `hp` | number | 현재 HP |
| `deck` | array | 전체 덱 (카드 객체 배열) |
| `relics` | array | 보유 유물 |
| `discardedRelicIds` | array | 버린 유물 ID |
| `bossesKilled` | array | 처치 보스 목록 |
| `passiveState` | object | 패시브 상태 (stacks 등) |
| `poison` | number | 독 스택 |
| `tenacityUsed` | boolean | 집념 사용 여부 |

### 2.3 저장 제외 (복원 불필요 / 불가)
> 전투 중 일시 상태, UI 상태, 애니메이션 상태

- `hand`, `drawPile`, `discardPile`, `selected` — 전투 중 상태
- `monster`, `splitMon` — 전투 중 상태
- `busy`, `monShake`, `playerShake`, `enemyAttacking` — 애니메이션
- `damageInfo`, `currentHand`, `enemyDmgShow` — UI 일시 표시
- `shopCards`, `shopRelic`, `rewardCards` — 화면 진입 시 재생성
- `overlay`, `deckView`, `campEvent` — UI 상태

## 3. 저장 시점

| 시점 | 트리거 | 저장 대상 |
|------|--------|-----------|
| **자동: 마을 진입** | `setScreen("village")` | 메타 + 런 |
| **자동: 캠프 진입** | `setScreen("campfire")` 직전 | 메타 + 런 |
| **자동: 상점 진입** | `setScreen("shop")` 직전 | 메타 + 런 |
| **자동: 스킬 구매** | `setUpgradeLevels` 후 | 메타만 |
| **자동: 런 종료** | victory/defeat `claimAndGo` | 메타만 (런 데이터 삭제) |
| **수동: 메뉴** | "저장" 버튼 | 메타 + 런 (있으면) |

## 4. 불러오기 시점

| 시점 | 동작 |
|------|------|
| **앱 시작** | localStorage에서 메타 데이터 로드 → `useState` 초기값으로 사용 |
| **메뉴 화면** | 런 저장 데이터 존재 시 "이어하기" 버튼 표시 |
| **이어하기 클릭** | 런 데이터 복원 → 마지막 안전 시점 화면으로 이동 |
| **새 게임 클릭** | 런 저장 존재 시 "진행 중인 데이터가 있습니다. 새 게임을 시작하시겠습니까?" 확인 팝업 → 확인 시 런 저장 삭제 + 새 런 시작 |

## 5. localStorage 키 설계

```
dh_meta    → { metaPoints, upgradeLevels, resetCount }
dh_run     → { classId, floor, battleNum, gold, hp, deck, relics, ... } | null
dh_version → 1  (스키마 버전, 마이그레이션용)
```

## 6. 구현 계획

### 6.1 저장 함수
```
saveGame() {
  meta → localStorage.setItem("dh_meta", JSON.stringify({...}))
  run  → localStorage.setItem("dh_run", JSON.stringify({...}))
}
saveMeta() {
  meta만 저장 (스킬 구매, 런 종료 시)
}
clearRunSave() {
  localStorage.removeItem("dh_run")  (승리/패배 후)
}
```

### 6.2 로드 함수
```
loadMeta() → useState 초기값으로 사용
loadRun()  → "이어하기" 클릭 시 state 복원
```

### 6.3 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `DungeonHand_v3.jsx` | saveGame/saveMeta/loadMeta/loadRun/clearRunSave 함수, useState 초기값 변경, 자동저장 트리거 5곳 |
| `screens/SmallScreens.jsx` | MenuScreen에 "이어하기" 버튼 추가, 저장 데이터 존재 여부 props |
| `screens/VillageScreen.jsx` | 스킬 구매 후 saveMeta 호출 (game.saveMeta props) |

### 6.4 구현 순서

1. **saveGame/saveMeta/clearRunSave 함수** 작성
2. **loadMeta** → useState 초기값 적용 (metaPoints, upgradeLevels, resetCount)
3. **자동저장 트리거** 5곳 삽입
4. **MenuScreen "이어하기"** 버튼 + loadRun 복원 로직
5. **검증**: 저장→새로고침→불러오기 사이클 테스트

## 7. 리스크

| 리스크 | 대응 |
|--------|------|
| 카드 객체의 함수 필드 (keyword 등) | JSON 직렬화 시 함수 소실 → ID 기반으로 복원 |
| 스키마 변경 시 호환성 | `dh_version` 키로 마이그레이션 분기 |
| localStorage 용량 (5MB) | 예상 데이터 ~5KB, 문제없음 |
| 전투 중 저장 불가 | "전투 중에는 저장되지 않습니다" 안내 |

## 8. 완료 기준

- [ ] 메타 데이터(스킬 트리/포인트) 새로고침 후 유지
- [ ] 런 진행 마을/캠프/상점 진입 시 자동저장
- [ ] 메뉴에서 "이어하기" 버튼으로 런 복원
- [ ] 승리/패배 후 런 저장 데이터 삭제
- [ ] 카드 keyword/common 참조 복원 정상 동작
