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
- [ ] #14 몬스터 기습 (일반10%, 미니보스20%, 보스30%)
- [ ] #15 보스/미니보스 대사 (BOSS_DIALOGUES)
