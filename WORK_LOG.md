# WORK_LOG

## 현재 게임 스펙 스냅샷
> 갱신: 2026-03-04

### 유물 (10종)
| 이름 | 효과 | 티어 |
|------|------|------|
| 낡은 숫돌 | 카드당 공격력 +1 | 1 |
| 가죽 장갑 | 버리기 횟수 +1 | 1 |
| 도박사의 주사위 | 전투 시작 시 50% 배율+1 / 50% 배율-0.5 | 1 |
| 가시 갑옷 | 피격 시 적에게 2 반사 | 1 |
| 루비 반지 | 🔺카드 공격력 x2 | 2 |
| 연쇄의 고리 | 스트레이트 배율 +2 | 2 |
| 감정사의 눈 | 등급4↑ 카드 1장당 배율 +2 | 2 |
| 전쟁의 서 | 매 전투 첫 제출 시 한도 +1 | 3 |
| 영웅의 증표 | SF 배율 x2 | 3 |
| 무한의 덱 | 매 턴 드로우 +1 | 3 |

### 몬스터 HP
| 이름 | HP | ATK | 특수 |
|------|-----|-----|------|
| 고블린 | 36 | 6 | - |
| 고블린 궁수 | 50 | 8 | - |
| 고블린 대장 | 72 | 9 | 미니보스 |
| 고블린 킹 | 94 | 11 | 보스 |
| 해골 병사 | 59 | 7 | - |
| 뱀파이어 | 72 | 9 | - |
| 망령 기사 | 91 | 10 | 미니보스 |
| 리치 | 124 | 12 | 보스 |
| 골렘 | 72 | 8 | 빙결1 |
| 마녀 | 85 | 10 | 빙결2 |
| 불꽃 정령 | 104 | 11 | 미니보스, 빙결1 |
| 대마법사 | 143 | 13 | 보스, 빙결2, 분열 |
| 그림자 포식자 | 78 | 9 | - |
| 심연의 눈 | 98 | 11 | 침식1 |
| 공허의 사도 | 124 | 12 | 미니보스, 침식2 |
| 심연의 군주 | 176 | 15 | 보스, 침식2 |
| 드래곤 알지기 | 117 | 12 | - |
| 드래곤 새끼 | 143 | 14 | 화상1 |
| 드래곤 근위병 | 182 | 16 | 미니보스, 화상1 |
| 드래곤 로드 | 260 | 20 | 보스, 화상2 |

### 메타 업그레이드 (7종)
| 이름 | 효과 | 비용 | 최대 |
|------|------|------|------|
| 생명력 | HP +5 | 3 | 2 |
| 강화 | 시작 시 중립카드 등급+1 | 4 | 1 |
| 은신 | 기본 회피 +5% | 3 | 2 |
| 노련한 상인 | 상점 가격 20% 할인 | 6 | 1 |
| 약탈 | 전투 승리 골드 +3 | 6 | 2 |
| 각성 | 시작 시 패시브 스택 1 | 10 | 1 |
| 집념 | HP 0 시 1회 부활 | 12 | 1 |

### 카드 효과
| 이름 | 효과 | 비고 |
|------|------|------|
| 보루 🛡️ | 방어막 +(등급) | 시작덱 |
| 집중타 🎯 | 다음턴 제출+1 | 시작덱 |
| 변환 🃏 | 조건부 와일드 | 시작덱 |
| 기세 ⚡ | 배율 +0.5 | 시작덱 |
| 회수 🔁 | 버린카드 (등급)장 복구 | 보상전용 |
| 투기 🎰 | 50% 배율+1 / 50% 배율-0.5 | 보상전용 |
| 맹독 ☠️ | 등급만큼 매턴 독 | 키워드 |
| 연쇄 ⛓️ | 제출 시 드로우+1 | 키워드 |
| 성장 🌱 | 제출마다 등급+1 (캡5) | 키워드 |
| 공명 🔔 | 같은 문양 2장+ 배율+0.5 | 키워드 |

### 경제 수치
| 항목 | 값 |
|------|-----|
| 일반 전투 골드 | 6 + rand(0~7) + 약탈 |
| 미니보스 골드 | 10 + rand(0~7) + 약탈 |
| 보스 골드 | 15 + rand(0~7) + 약탈 |
| 카드 가격 | 등급×3 + 공용×2 + 키워드×5 |
| 유물 가격 | T1: 30 / T2: 50 / T3: 75 |
| 회복 비용 | 10 (2회 제한) |
| 제거 비용 | 10 (2회 제한) |
| 노련한 상인 할인 | 20% (모든 상점 가격) |

### 핵심 밸런스
| 항목 | 값 |
|------|-----|
| MAX_HP | 70 (+5/레벨) |
| HAND_SIZE | 5 |
| MAX_HAND | 7 |
| BASE_SUBMIT | 3 |
| RELIC_SLOTS | 3 |
| 성장 캡 | 5 |
| 족보 배율 | 하이카드1 / 원페어2 / 투페어3 / 트리플4 / S3 4 / 플러시5 / S4 6 / 풀하우스6 / S5 8 / 포카8 / SF 12 |

---

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

---

## 세션 5 (2026-03-04) — 정적 분석 버그 수정

### 완료
- [x] BUG 1: HP 초기화 불일치 수정 — startRun `maxHp = 40` → `70` (MAX_HP와 일치)
- [x] BUG 2: 회수 메시지 정합성 수정 — submitCards의 예측 메시지 삭제, enemyTurn에서 실제 `reclaimedCards.length` 기반 메시지 표시
- [x] encounterOut CSS dead code 삭제 (미사용 @keyframes)
- [x] 기습 사망 방어 코딩: laterTimers 배열로 Phase 4/5 setTimeout 추적, 사망 시 clearTimeout으로 취소

### 수정하지 않은 항목
- tenacityUsed 스테일 클로저: 실질적 영향 없음 (첫 전투 기습 사망 불가능)
- gambit 복수 장 처리: 현재 밸런스상 적절
- showPassive 큐 시스템: 규모가 크고 기존 코드 전체에 동일 문제 존재

## 세션 6 (2026-03-04) — 변환(wild) 카드 버그 수정

### 완료
- [x] detectHand suits 매핑에서 wild 카드 예외처리: `c.common.fx === "wild"`이면 `getEffectiveSuit()` 호출 (기존: 모든 공용카드 "none")
- [x] checkStraightFlush에서 wild 공용카드 포함: 필터 조건에 `(c.isCommon && c.common.fx === "wild")` 추가

### 검증
- 빌드 성공 확인
- 변환카드가 같은 문양 직업카드 2장 이상과 함께 제출 시 플러시/SF 판정에 기여
- 같은 문양 2장 미만 시 wild 비활성 (기본 suitId 반환)
- 다른 공용카드 5종(보루, 집중타, 기세, 회수, 투기) 동작 영향 없음

## 세션 7 (2026-03-04) — 유물/메타 밸런스 조정

### 완료
- [x] 수정 1: 전투의 서(book1) 삭제 — RELICS에서 제거
- [x] 수정 2: 전쟁의 서(book2) 너프 — "매 전투 첫 제출 시 한도 +1" (book2Used state로 1회 제한)
- [x] 수정 3: submit 메타 → 노련한 상인 (상점 전 가격 20% 할인, cost 6, max 1)
- [x] 수정 4: sharp 메타 max 2→1
- [x] 수정 5: 유물 상점 가격 인상 (25/40/60 → 30/50/75)

### 세부 변경
- RELICS에서 book1 항목 삭제
- book2: eff.type "submit"→"submitOnce", book2Used state 추가, beginBattle/도망 시 리셋, submitCards에서 setBook2Used(true)
- submitLimit 계산: relics.reduce(submit) 삭제, book2Bonus로 대체
- BASE_SUBMIT: `3 + upgradeLevels.submit` → `3` (고정)
- UPGRADES: submit → merchant (id/name/icon/desc/cost/max 전체 변경)
- upgradeLevels 초기값: submit → merchant
- 상점: discount 변수 도입, 카드/유물/회복/제거 4곳에 Math.floor(price * discount) 적용
- sharp max: 2→1
- 유물 가격: tier 1: 30, tier 2: 50, tier 3: 75

## 세션 8 (2026-03-04) — 유물 인벤토리 슬롯 제한

### 완료
- [x] 수정 1: state 추가 (discardedRelicIds, pendingRelic, pendingRelicCost, relicSwapContext) + RELIC_SLOTS=3 상수 + startRun 초기화
- [x] 수정 2: 보스 보상/상점 유물 필터에 discardedRelicIds 제외 조건 추가
- [x] 수정 3: pickRelic — 슬롯 < 3이면 바로 장착, 꽉 차면 교체 UI 진입
- [x] 수정 4: buyRelic — 슬롯 < 3이면 바로 장착+골드 차감, 꽉 차면 교체 UI 진입(골드 보류)
- [x] 수정 5: swapRelic/discardPendingRelic/resolveRelicSwap 함수 + 교체 오버레이 UI

### 정적 분석 버그 수정
- [x] startRun에서 relicSwapContext 미초기화 → setRelicSwapContext(null) 추가
- [x] buyRelic 골드 선차감 문제 → 교체 확정 시(swapRelic)에만 골드 차감, 버리기 시 골드 미차감

### 세부 변경
- pendingRelic 오버레이: 새 유물 표시 + 기존 유물 3개 나열 (탭=교체) + 버리기 버튼
- 교체된/버려진 유물은 discardedRelicIds에 추가 → 이후 보스보상/상점에서 재등장 불가
- resolveRelicSwap: boss context면 openShop 호출, shop context면 상점 유지
- shop 교체: swapRelic에서 골드 차감 + sfx.gold(), discardPendingRelic에서는 골드 미차감

## 세션 9 (2026-03-04) — 최대 손패 7장 제한

### 완료
- [x] 수정 1: MAX_HAND = 7 상수 추가 (HAND_SIZE 바로 아래)
- [x] 수정 2: submitCards() 드로우 캡 — needed를 MAX_HAND - remain.length 이하로 제한
- [x] 수정 3: 화상 메커닉 하드코딩 `< 7` → `< MAX_HAND` 상수 참조

## 세션 10 (2026-03-04) — 화상 카드 MAX_HAND 초과 버그 수정

### 완료
- [x] 화상(burn) 카드 주입 시 MAX_HAND 초과 버그 수정 — `Math.min(burnCount, MAX_HAND - allNewHand.length)`로 실제 주입 수 제한

## 세션 11 (2026-03-04) — 아키텍처 진단

### 완료
- [x] 아키텍처 진단 수행 — 코드 수정 없음, 문서화만 진행
- [x] CLAUDE.md에 기능 추가 체크리스트 추가 (카드/유물/몬스터/직업)
- [x] CLAUDE.md에 아키텍처 참고 섹션 추가 (구조 요약, 확장 난이도, 리팩터링 기준)
- [x] qa-reviewer.md 에이전트 정의 파일 커밋

### 진단 결과 요약
- **현재 구조로 계획된 기능 추가에 큰 장애 없음**
- 데이터 기반 설계(배열/객체)로 카드/유물/몬스터 추가 용이
- 직업 추가 시에만 classId 분기 리팩터링 필요 (6곳+)
- 4,000줄 초과 시 파일 분할 검토
- 매직넘버/setTimeout 체인은 현재 관리 가능 수준

### 다음 세션 TODO (세션 12)
- [ ] 메타 업그레이드(inventory): 유물 슬롯 +1 (max 2, 최대 5칸)
- [ ] 상시 유물 슬롯 UI: 전투 화면 등에 현재 유물 표시 (N/MAX_SLOTS)
