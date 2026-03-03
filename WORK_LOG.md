# WORK_LOG

## 세션 1 (2026-03-04) — 밸런스 완성

### 완료
- [x] #9 메타 업그레이드 가격 표시: 고급 블록 `⭐{u.cost}` → `⭐{actualCost}` 교체 (line 1754)
- [x] #11 몬스터 HP x1.3: 20종 전체 적용 (lines 104-127)
- [x] #10 전투화면 overflow: battle 래퍼에 `Object.assign({}, wrapStyle, { height:"100vh", minHeight:"auto", overflow:"hidden" })` 적용 (line 2123)

### 다음 세션 TODO (세션 2)
- [x] #7 회수(reclaim) 카드 효과 구현 + fxMap
- [x] #8 투기(gambit) 카드 효과 구현 + fxMap

## 세션 2 (2026-03-04) — 신규 카드 효과

### 완료
- [x] 시작 덱(COMMONS)에서 reclaim/gambit 제거 (이전 세션)
- [x] REWARD_COMMONS 배열 추가: 보상 전용 카드 풀 (reclaim + gambit 포함)
- [x] generateRewardCards + 상점에서 REWARD_COMMONS 사용하도록 변경
- [x] fxMap에 reclaim/gambit 설명 추가
- [x] #7 회수(reclaim): 제출 시 버린 카드 더미에서 (등급+성장보너스)장을 드로우 더미 최상단에 복귀
- [x] #8 투기(gambit): 제출 시 50% 배율+1.0 / 50% 배율-0.5, 패시브 메시지 표시

### 다음 세션 TODO (세션 3)
- [x] #14 몬스터 기습 (일반10%, 미니보스20%, 보스30%)
- [x] #15 보스/미니보스 대사 (BOSS_DIALOGUES)

## 세션 3 (2026-03-04) — 전투 연출

### 완료
- [x] #14 몬스터 기습: beginBattle 초기 핸드 드로우 후 확률 판정 (일반10%/미니보스20%/보스30%), 기습 시 선제 공격 + 집념 연동
- [x] #15 보스/미니보스 대사: BOSS_DIALOGUES 데이터 (10 몬스터 × 2 대사), bossDialogue state, 전투 시작 시 말풍선 UI, 대사 → 핸드 드로우 → 기습 시퀀스

### 다음 세션 TODO (세션 4)
- [x] #16 보스 인카운터 효과 (풀스크린 오버레이)
- [x] #17 전투 시작 시퀀스 정리 (encounter→dialogue→ambush→dice→draw)

## 세션 4 (2026-03-04) — 인카운터 시퀀스

### 완료
- [x] #16 보스 인카운터 오버레이: encounterOverlay state, encounterIn/encounterOut CSS, 풀스크린 radial gradient + 이모지 + 이름 + 타입 표시, 1800ms 후 자동 사라짐
- [x] #17 전투 시작 시퀀스 정리: beginBattle 리팩터링, running delay `t`로 5단계 시퀀스 구현
  - Phase 1: Encounter overlay (boss/miniboss, 2000ms)
  - Phase 2: Dialogue (boss/miniboss, 1300ms)
  - Phase 3: Ambush check (일반10%/미니보스20%/보스30%, 1000ms)
  - Phase 4: Dice (gamble relic, 1000ms)
  - Phase 5: Draw cards (HAND_SIZE × 150ms)

### 모든 세션 완료!
