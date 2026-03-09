# WORK_LOG

## 현재 세션 계획
> 세션 46 (2026-03-10) — 지도 시스템 구현

### 세션 A: 데이터 레이어 ✅
- [x] NODE_TYPES, MAP_ROWS, MAP_EVENTS 상수 추가
- [x] MONSTERS 20→30종 확장 (층별 6마리, 고유 스킬: steal/rage/regen)
- [x] generateFloorMap() 맵 생성 함수 (utils.js)
- [x] floorMap state 추가

### 세션 B: 맵 화면 UI ✅
- [x] screens/MapScreen.jsx 생성 (MapScreen + EventScreen)
- [x] 7열 가로 노드 맵 + SVG 연결선
- [x] 이벤트 화면 6종 처리

### 세션 C: 플로우 연결 ✅
- [x] advanceBattle 제거 → goToMap/goNextFloor/selectNode 도입
- [x] 모든 화면 출구 → 맵으로 라우팅
- [x] 보스 승리 → 유물 보상 → goNextFloor (층 전환)
- [x] 저장/불러오기 floorMap 포함 (버전 2)
- [x] BattleScreen 전투 카운터 → 몬스터 타입 표시
- [x] BATTLE_TO_SLOT dead code 삭제 + beginBattle 간소화

### 세션 D: TODO
- [ ] 테스트 + 밸런스 조정
- [ ] CLAUDE.md 업데이트

### 이전 세션 (45)
- [x] scaleMonsterHp/Atk 이중 스케일링 제거
- [x] 밸런스 5건 조정

---

## 현재 게임 스펙 스냅샷
> 갱신: 2026-03-10 (세션46 지도 시스템 반영)

### 유물 (10종)
| 이름 | 효과 | 티어 |
|------|------|------|
| 낡은 숫돌 | 카드당 공격력 +1 | 1 |
| 가죽 장갑 | 버리기 횟수 +1 | 1 |
| 도박사의 주사위 | 전투 시작 시 50% 배율+1 / 50% 배율-0.3 | 1 |
| 가시 갑옷 | 피격 시 적에게 5 반사 | 1 |
| 루비 반지 | 🔺카드 공격력 x2 | 2 |
| 연쇄의 고리 | 스트레이트 배율 +3 | 2 |
| 감정사의 눈 | 등급5↑ 카드 1장당 배율 +2 | 2 |
| 전쟁의 서 | 매 전투 첫 제출 시 한도 +1 | 3 |
| 영웅의 증표 | SF 배율 x2 | 3 |
| 무한의 덱 | 매 턴 드로우 +1 | 3 |

### 몬스터 (30종, 층별 6마리 = 일반4 + 미니보스1 + 보스1)
| 이름 | HP | ATK | 특수 |
|------|-----|-----|------|
| 고블린 | 36 | 6 | - |
| 고블린 궁수 | 50 | 8 | - |
| 고블린 도둑 | 42 | 7 | 골드도둑5 |
| 고블린 주술사 | 38 | 5 | 침식1 |
| 고블린 대장 | 72 | 9 | 미니보스 |
| 고블린 킹 | 94 | 11 | 보스 |
| 해골 병사 | 59 | 7 | - |
| 뱀파이어 | 72 | 9 | - |
| 구울 | 63 | 8 | 재생4 |
| 레이스 | 52 | 9 | 골드도둑7 |
| 망령 기사 | 91 | 10 | 미니보스 |
| 리치 | 124 | 12 | 보스 |
| 골렘 | 72 | 8 | 빙결1 |
| 마녀 | 85 | 10 | 빙결2 |
| 가고일 | 88 | 7 | 격노2 |
| 원소술사 | 75 | 9 | 빙결1, 화상1 |
| 불꽃 정령 | 104 | 11 | 미니보스, 빙결1 |
| 대마법사 | 143 | 13 | 보스, 빙결2, 분열 |
| 그림자 포식자 | 78 | 9 | - |
| 심연의 눈 | 98 | 11 | 침식1 |
| 심연거미 | 85 | 10 | 빙결1, 골드도둑6 |
| 공허흡수자 | 92 | 11 | 침식1, 격노2 |
| 공허의 사도 | 124 | 12 | 미니보스, 침식2 |
| 심연의 군주 | 176 | 15 | 보스, 침식2 |
| 드래곤 알지기 | 117 | 12 | - |
| 드래곤 새끼 | 143 | 14 | 화상1 |
| 용암도마뱀 | 130 | 13 | 격노3, 화상1 |
| 드래곤 사제 | 125 | 11 | 재생10 |
| 드래곤 근위병 | 182 | 16 | 미니보스, 화상1 |
| 드래곤 로드 | 260 | 20 | 보스, 화상2 |

### 지도 시스템 (신규)
| 항목 | 값 |
|------|-----|
| 맵 구조 | 7행 (시작→전투/캠프/상점/이벤트×5→보스) |
| 행당 노드 | 2~3개 |
| 노드 타입 | 전투/정예/캠프/상점/이벤트/보스 |
| 몬스터 고유 스킬 | steal(골드도둑)/rage(격노)/regen(재생) |
| 이벤트 | 보물상자/기도제단/도박꾼/대장장이/저주샘/방랑자 |

### 스킬 트리 (4카테고리 18노드 + 궁극기 1)
| 카테고리 | 이름 | 효과 | 비용 | 최대 |
|----------|------|------|------|------|
| 공통 | 생명력 | HP +5 | 3 | 2 |
| 공통 | 강화 | 시작시 중립카드 등급+1 | 4 | 1 |
| 공통 | 상인 | 상점 20% 할인 | 6 | 1 |
| 공통 | 약탈 | 전투 골드 +2 | 6 | 2 |
| 공통 | 집념 | HP 0시 1회 부활 | 12 | 1 |
| 공통 | 유물슬롯 | 유물 슬롯 +1 | 8 | 2 |
| 습격 | 🔺수집 | 보상시 🔺카드 보장 | 4 | 1 |
| 습격 | 각성 | 시작시 그림자 x1 | 10 | 1 |
| 습격 | 은신 | 기본 회피 +7% | 3 | 2 |
| 습격 | 그림자폭발 | 스택배율 +0.5→+0.8 | 8 | 1 |
| 연계 | 🔷수집 | 보상시 🔷카드 보장 | 4 | 1 |
| 연계 | 손재주 | 시작 드로우 +1 | 5 | 1 |
| 연계 | 기민함 | 버리기 +1 | 4 | 1 |
| 연계 | 연쇄강화 | 🔷2장+ 드로우+2 | 7 | 1 |
| 급소 | ⭐수집 | 보상시 ⭐카드 보장 | 4 | 1 |
| 급소 | 급소숙련 | 치명타 +10% | 3 | 2 |
| 급소 | 속전속결 | 첫턴 치명타 2배 | 6 | 1 |
| 급소 | 치명타격 | 치명 x1.5→x2.0 | 8 | 1 |
| 궁극기 | 운명의 주사위 | 제출마다 1d6 배율 (x0.5/x1.5/x3) | 40 | 1 |

### 카드 효과
| 이름 | 효과 | 비고 |
|------|------|------|
| 집중타 🎯 | 다음턴 제출+1 | 시작덱 |
| 유리 🔮 | x1.5 배율, 제출 시 덱에서 소멸 | 시작덱 |
| 기세 ⚡ | 배율 +0.5 | 시작덱 |
| 회수 🔁 | 버린카드 (등급)장 복구 | 보상전용 |
| 투기 🎰 | 다음턴 3장 중 1장 선택 | 보상전용, 2층~ |
| 맹독 ☠️ | 등급만큼 매턴 독 | 키워드 |
| 연쇄 ⛓️ | 제출 시 드로우+1 | 키워드 |
| 성장 🌱 | 제출마다 등급+1 (캡5) | 키워드 |
| 공명 🔔 | 같은 문양 2장+ 배율+0.8 | 키워드 |

### 경제 수치
| 항목 | 값 |
|------|-----|
| 일반 전투 골드 | 4 + rand(0~4) + 약탈(+2/lv) |
| 미니보스 골드 | 7 + rand(0~4) + 약탈(+2/lv) |
| 보스 골드 | 10 + rand(0~4) + 약탈(+2/lv) |
| 카드 가격 | 등급×3 + 공용×2 + 키워드×5 |
| 유물 가격 | T1: 30 / T2: 50 / T3: 75 |
| 회복 비용 | 10 |
| 제거 비용 | 10 (2회 제한) |
| 노련한 상인 할인 | 20% (모든 상점 가격) |

### 핵심 밸런스
| 항목 | 값 |
|------|-----|
| MAX_HP | 70 (+5/레벨) |
| HAND_SIZE | 5 (+손재주) |
| MAX_HAND | 7 |
| BASE_SUBMIT | 3 |
| RELIC_SLOTS | 3 (+유물슬롯) |
| 성장 캡 | 5 |
| 족보 배율 | 하이카드1 / 원페어2 / 투페어3 / 트리플4 / S3 4 / 플러시5 / S4 6 / 풀하우스6 / S5 8 / 포카8 / SF 12 |

### 효과음 (파일 기반)
| 이름 | 파일 | 설명 |
|------|------|------|
| battle BGM | bgm/battle.ogg | 전투 루프 |
| campfire BGM | bgm/campfire.ogg | 캠프파이어 루프 |
| shop BGM | bgm/shop.ogg | 상점 루프 |
| click | sfx/click.ogg | 버튼 클릭 |
| card | sfx/card.ogg | 카드 선택/드로우 |
| hit | sfx/hit.ogg | 카드 제출 |
| dmg | sfx/dmg.ogg | 몬스터 피격 |
| enemy | sfx/enemy.ogg | 적 공격 |
| win | sfx/win.ogg | 승리 팡파레 |
| lose | sfx/lose.ogg | 패배 징글 |
| gold | sfx/gold.ogg | 골드 획득 |
| heal | sfx/heal.ogg | 회복 |

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
- [x] 직업 시스템 데이터 기반 리팩터링

## 세션 12 (2026-03-04) — 직업 시스템 데이터 기반 리팩터링

### 완료
- [x] 수정 1: CLASSES 재구조화 — warrior 삭제, ranger에 passive 훅 객체 추가 (init/cardBonus/calcBonus/applyMult/onSubmit/onHit/onEvade/onCamp/suitMessages/renderBadge)
- [x] 수정 1: fury/lastSuit/shadow useState 3개 → passiveState 단일 상태 + buildPState() 헬퍼
- [x] 수정 2: calcDamage 리팩터링 — classId 분기 삭제, passive.cardBonus/calcBonus/applyMult 훅 호출
- [x] 수정 2: submitCards 리팩터링 — warrior/ranger 패시브 분기 → passive.onSubmit, suitMessages 훅 호출
- [x] 수정 2: startRun 리팩터링 — 각성 초기화 → passive.init() 훅 호출
- [x] 수정 2: enemyTurn 리팩터링 — 회피/피격 시 shadow 분기 → passive.onEvade/onHit 훅 호출
- [x] 수정 2: campfire 리팩터링 — fairy 이벤트 → passive.onCamp 훅 호출
- [x] 수정 3: 메뉴 — CLASSES.length===1이면 startRun 직접 호출 (직업 선택 스킵)
- [x] 수정 3: classSelect — isLocked/rangerClass/passiveDesc/suitLines 하드코딩 → passive.desc/suitDescs 참조
- [x] 수정 3: 패시브 뱃지 — warrior/ranger 분기 → passive.renderBadge() 제네릭 뱃지
- [x] 수정 3: 캠프 요정 메시지 → passive.onCamp().msg
- [x] 기존 JSX 구문 오류 수정 (damageInfo ternary `)}}`→`)}`)
- [x] campfire 내 중복 classData 선언 제거

### 삭제된 코드
- CLASSES warrior 항목
- fury/lastSuit/shadow useState + setFury/setLastSuit/setShadow
- calcDamage classId 분기 6곳
- submitCards classId 분기 4곳
- startRun classId 분기 4곳
- enemyTurn shadow/setShadow 분기 2곳
- campfire classId 분기 2곳
- UI classId 분기 2곳 (패시브 뱃지)
- classSelect isLocked/rangerClass/passiveDesc/suitLines 하드코딩

### 검증
- grep "warrior" → 0 matches
- grep "fury\|lastSuit\|setFury\|setLastSuit\|setShadow" → 0 matches
- JSX 빌드 OK (acorn-jsx)
- 2926줄 → 2893줄 (33줄 감소)

### 다음 세션 TODO (세션 13)
- [ ] 메타 업그레이드(inventory): 유물 슬롯 +1 (max 2, 최대 5칸)
- [ ] 상시 유물 슬롯 UI: 전투 화면 등에 현재 유물 표시 (N/MAX_SLOTS)

## 세션 13A (2026-03-04) — 파일 분할 (세션 A: 데이터/유틸/컴포넌트)

### 완료
- [x] `audio.js` 추출 (87줄) — sfx 객체
- [x] `data.js` 추출 (195줄) — SUITS, CLASSES, COMMONS, REWARD_COMMONS, MONSTERS, CAMPFIRE_EVENTS, RELICS, FLOOR_NAMES, BOSS_DIALOGUES, KEYWORDS, UPGRADES, BOSS_POINTS
- [x] `utils.js` 추출 (247줄) — shuffle, pickN, makeCard, makeDeck, getCardName, getEffectiveSuit, detectHand, calcDamage
- [x] `styles.js` 추출 (31줄) — CSS 문자열
- [x] `components.jsx` 추출 (350줄) — CardView, HpBar, Btn, DeckViewer

### 줄 수 변화
- 분할 전: DungeonHand_v3.jsx 2,893줄 (단일 파일)
- 분할 후: DungeonHand_v3.jsx 1,998줄 + 5개 모듈 910줄 = 2,908줄 (import문 추가분)

### 검증
- `npm run build` 성공 (빌드 결과 동일: 213.28 kB)
- 기존 main.jsx import 경로 변경 없음

### 다음 세션 TODO (세션 B: 화면 분리)
- [ ] screens/CampfireScreen.jsx 추출
- [ ] screens/BattleScreen.jsx 추출
- [ ] screens/ShopScreen.jsx 추출
- [ ] screens/RewardScreen.jsx 추출
- [ ] screens/VillageScreen.jsx 추출

## 세션 14 (2026-03-04) — 카드 밸런스 조정

### 완료
- [x] 수정 1: 보루(fortress) 삭제 — COMMONS/fxMap/submitCards/enemyTurn/shield state/UI 뱃지 전체 제거
- [x] 수정 2: 변환→모방 이름/아이콘 변경 — icon 🃏→🪞, name 변환→모방, fxMap "조건부 와일드"→"문양 따라감"
- [x] 수정 3: 투기(gambit) 효과 변경 — 50% 배율→다음 턴 3장 중 1장 선택 메커닉 (gambitPendingRef + gambitChoices state + 선택 오버레이 UI + floor<2 제한)
- [x] 수정 4: 키워드 드랍 확률 절반 — 보상 0.6/0.3→0.3/0.15, 상점 0.5→0.25
- [x] 수정 5: 골드 수입 2/3 감소 — 15/10/6+rand(8)→10/7/4+rand(5)

### 세부 변경
- shield useState 삭제 (fortress 전용이었음, 유물 가시갑옷 thorns는 별도 로직으로 영향 없음)
- gambit: useRef로 gambitPendingRef 구현 (setTimeout 클로저 문제 방지)
- gambit: enemyTurn 드로우 완료 후 tempDraw/tempDisc에서 3장 추출 → gambitChoices 설정 → 선택 UI 표시
- gambit: pickGambitCard() — 1장 핸드에 추가, 나머지 2장 discardPile로
- gambit: floor<2이면 generateRewardCards/openShop에서 gambit 카드 제외
- startRun에서 gambitPendingRef.current/gambitChoices 초기화

### 다음 세션 TODO
- [ ] 메타 업그레이드(inventory): 유물 슬롯 +1 (max 2, 최대 5칸)
- [ ] 상시 유물 슬롯 UI: 전투 화면 등에 현재 유물 표시 (N/MAX_SLOTS)

## 세션 15 (2026-03-04) — 모방→유리 카드 효과 교체

### 완료
- [x] utils.js: getEffectiveSuit() wild 분기 전체 삭제 → `return card.suitId` 단순화
- [x] utils.js: detectHand() wild 예외처리 3곳 삭제 (suits 매핑, suitCards 필터, wildCount)
- [x] utils.js: checkStraightFlush() wild 포함 로직 삭제 → classCards only
- [x] utils.js: calcDamage() glass 배율 x1.5 추가 (focus 바로 뒤)
- [x] data.js: COMMONS wild→glass (🪞→🔮, 모방→유리) — 이전 커밋에서 완료
- [x] components.jsx: fxMap wild→glass ("문양 따라감"→"x1.5 소멸") — 이전 커밋에서 완료
- [x] DungeonHand_v3.jsx: submitCards에 glass 소멸 로직 (usedClean에서 분리 → setDeck에서 영구 제거)

### 검증
- 빌드 성공 (213.86 kB)
- grep "wild" → utils.js/data.js/components.jsx/DungeonHand_v3.jsx 0 matches

### 다음 세션 TODO
- [x] ~~메타 업그레이드 → 스킬 트리 개편 (세션 16A)~~

## 세션 16A (2026-03-04) — 메타 업그레이드 → 스킬 트리 데이터+UI

### 완료
- [x] data.js: UPGRADES(7종 flat) → SKILL_TREES(4카테고리×4~6노드=18종) + ULTIMATE_SKILL 교체
  - 공통(6): hp, sharp, merchant, loot, tenacity, inventory(신규)
  - 습격🔺(4): redCollect, awaken, stealth, shadowBurst
  - 연계🔷(4): blueCollect, deft, nimble, chainBoost
  - 급소⭐(4): yellowCollect, critMastery, quickStrike, critDamage
  - 궁극기: fatedDice (40⭐ 투자 시 해금)
- [x] data.js: RELICS 전 10종에 classId: null 추가
- [x] DungeonHand_v3.jsx: upgradeLevels 초기화 7키 → 21키 확장 + import 변경
- [x] DungeonHand_v3.jsx: 마을 화면 UI → 스킬 트리 UI 교체 (카테고리별 섹션 + 궁극기 해금)
- [x] DungeonHand_v3.jsx: 유물 필터링 2곳(보스보상/상점)에 classId 조건 추가

### 검증
- 빌드 성공 (215.28 kB)
- grep "UPGRADES" → DungeonHand_v3.jsx/data.js 0 matches (완전 교체)

### 다음 세션 TODO (세션 16B: 신규 스킬 효과 구현 5건)
- [x] ~~inventory: RELIC_SLOTS 계산에 upgradeLevels.inventory 반영~~
- [x] ~~문양수집 ×3: generateRewardCards에서 해당 문양 카드 1장 보장~~
- [x] ~~그림자폭발: passive.applyMult에서 shadowBurst 반영 (+0.5→+0.8)~~
- [x] ~~손재주/기민함: 드로우+1 / 버리기+1~~
- [x] ~~연쇄강화: 🔷 2장+ 제출시 extraDraw +2~~

## 세션 16B (2026-03-04) — 신규 스킬 효과 구현

### 완료
- [x] inventory: RELIC_SLOTS = 3 + upgradeLevels.inventory
- [x] 문양수집(red/blue/yellow): generateRewardCards에서 collect 스킬 보유 문양의 카드 보장
- [x] 그림자폭발: buildPState에 shadowBurst 추가, applyMult 0.5→0.8 분기, onSubmit/onEvade/renderBadge 메시지 동적화
- [x] 손재주(deft): HAND_SIZE = 5 + deft (시작 드로우 +1)
- [x] 기민함(nimble): setDiscards 2곳에 nimble 반영 (버리기 +1)
- [x] 연쇄강화(chainBoost): buildPState에 chainBoost 추가, calcBonus extraDraw 1→2 분기

### 검증
- 빌드 성공 (215.72 kB)

### 다음 세션 TODO (세션 16C: 치명타 스킬 + 궁극기 효과 4건)
- [x] ~~급소숙련(critMastery): calcDamage critChance에 +10% × level~~
- [x] ~~속전속결(quickStrike): 첫턴 치명타 확률 2배~~
- [x] ~~치명타격(critDamage): 치명배율 x1.5→x2.0~~
- [x] ~~운명의 주사위(fatedDice): calcDamage/submitCards에서 1d6 배율 적용 + 주사위 연출~~

## 세션 16C (2026-03-04) — 치명타 스킬 + 궁극기 효과

### 완료
- [x] buildPState 확장: critMastery/quickStrike/critDamage/fatedDice/roundNum 추가
- [x] 급소숙련: calcDamage에서 critChance += critMastery × 10 (max 90)
- [x] 속전속결: roundNum === 1이면 critChance × 2 (max 90)
- [x] 치명타격: 치명배율 1.5→2.0 분기 (pState.critDamage)
- [x] 운명의 주사위: calcDamage에서 1d6 배율 (1-2=x0.5, 3-4=x1.5, 5-6=x3.0) + return에 fatedRoll/fatedMult
- [x] submitCards 연출: 주사위 결과 showPassive + 치명타 메시지 동적화

### 검증
- 빌드 성공 (216.23 kB)

## 세션 16D (2026-03-04) — 스킬 초기화 버튼 + 카테고리 탭 UI

*(이전 커밋으로 완료됨)*

## 세션 17 (2026-03-04) — BGM 5종 + 효과음 확장

### 완료
- [x] audio.js: melodies 객체로 BGM 5종 관리 (battle/elite/boss/campfire/shop)
- [x] audio.js: bgmOn(type) 파라미터 추가, 각 타입별 멜로디/템포/파형/볼륨 설정
- [x] audio.js: monHit() 추가 (저음 펀치 + 임팩트 노이즈)
- [x] audio.js: playerHit() 추가 (고음→저음 하강 + 노이즈)
- [x] audio.js: win() 개선 (6음 팡파레 + 화음 마무리)
- [x] audio.js: lose() 개선 (6음 하강 + 불협화음 마무리)
- [x] DungeonHand_v3.jsx: beginBattle 내부에서 bn 기반 BGM 분기 (battle/elite/boss)
- [x] DungeonHand_v3.jsx: 캠프파이어 진입 시 campfire BGM
- [x] DungeonHand_v3.jsx: 상점 진입 시 shop BGM
- [x] DungeonHand_v3.jsx: sfx.dmg()→sfx.monHit(), sfx.enemy()→sfx.playerHit() 교체
- [x] DungeonHand_v3.jsx: leaveShop 승리 시 bgmOff 추가

### 검증
- 빌드 성공 (218.03 kB)

## 세션 18 (2026-03-05) — 운명의 주사위 연출 + 오디오 조정 + 버그 수정

### 완료
- [x] 운명의 주사위: showPassive 제거 → damageInfo 내 배지 UI로 교체 (결과별 색상)
- [x] 오디오 되돌리기: elite/boss BGM 제거 (battle 통일), monHit/playerHit 제거 (dmg/enemy 복귀), win/lose 단순 버전 복귀
- [x] nextId 버그 수정: 파일 분할 시 nextId 미export → getNextId() 함수 추가 (카드 보상 선택 불가 버그 해결)
- [x] 버튼 클릭음 추가: sfx.click() + Btn 컴포넌트 연동

### 검증
- 빌드 성공 (217.74 kB)

---

## 세션 19 (2026-03-05) — 오디오 시스템 마이그레이션

### 완료
- [x] public/audio/ 폴더 구조 생성 (bgm/ + sfx/)
- [x] audio.js 전면 리라이트: 오실레이터 합성음 → HTMLAudioElement (실제 파일)
  - SFX 9종 프리로드 (click/card/hit/dmg/enemy/win/lose/gold/heal)
  - BGM 3종 온디맨드 로드 + loop (battle/campfire/shop)
  - `import.meta.env.BASE_URL` 사용 (Vite base path `/dungeonhand/` 자동 대응)
  - iOS 오디오 잠금 해제 유지 (AudioContext silent buffer trick)
  - `.play().catch(()=>{})` 로 재생 실패 무음 처리
  - sfx API 인터페이스 100% 유지 (다른 파일 변경 없음)

### 오디오 파일 (OGG Vorbis, CC0)
```
public/audio/          총 1.54MB
  bgm/
    battle.ogg      (861KB) — 8-Bit Battle Loop by Wolfgang_
    campfire.ogg    (294KB) — NES Shooter "Map" by Juhani Junkala
    shop.ogg        (327KB) — NES Shooter "Mercury" by Juhani Junkala
  sfx/                (59KB total)
    click.ogg       (6.7KB) — Button sound
    card.ogg        (7.8KB) — Interaction sound
    hit.ogg         (4.7KB) — Sword melee
    dmg.ogg         (4.1KB) — Damage hit
    enemy.ogg       (4.4KB) — Impact
    win.ogg         (8.3KB) — Fanfare
    lose.ogg        (5.2KB) — Negative damage
    gold.ogg        (7.0KB) — Coin single
    heal.ogg        (11KB)  — Powerup
```

출처 (모두 CC0):
- BGM battle: [8-Bit Battle Loop](https://opengameart.org/content/8-bit-battle-loop) by Wolfgang_
- BGM campfire/shop: [NES Shooter Music](https://opengameart.org/content/nes-shooter-music-5-tracks-3-jingles) by Juhani Junkala
- SFX 9종: [512 Sound Effects 8-bit](https://opengameart.org/content/512-sound-effects-8-bit-style) by Juhani Junkala

### 검증
- 빌드 성공 (217.12 kB)
- dist/audio/ 폴더 12개 파일 정상 복사 확인

---

## 세션 21 (2026-03-05) — 화면별 파일 분리

### 완료
- [x] screens/SmallScreens.jsx 생성 (293줄) — menu, classSelect, reward, enhance, relicReward, victory, defeat, pendingRelic 8개 컴포넌트
- [x] screens/CampfireScreen.jsx 생성 (179줄) — 캠프파이어 3페이즈 + 6이벤트
- [x] screens/VillageScreen.jsx 생성 (141줄) — 스킬 트리 UI
- [x] screens/BattleScreen.jsx 생성 (285줄) — 전투 UI + 인카운터/대사/갬빗 오버레이
- [x] screens/ShopScreen.jsx 생성 (130줄) — 상점 UI
- [x] 캠프파이어 로컬 함수 5개 (enterPhase2/enterPhase3/leaveCampfire/resolveCampfire/sellCard) 메인 본문으로 호이스팅
- [x] game 단일 props 객체 구성 + 화면 라우팅 12개 컴포넌트 호출로 교체
- [x] CLAUDE.md/WORK_LOG.md 업데이트

### 줄 수 변화
- 분할 전: DungeonHand_v3.jsx 2,140줄
- 분할 후: DungeonHand_v3.jsx 1,215줄 + screens/ 1,028줄 = 2,243줄 (import/export 추가분)

### 검증
- 빌드 성공 (221.13 kB)

---

## 세션 22: 코드 품질 정리 (2026-03-05)

### 완료 내역
1. **Google Fonts 이중 로딩 제거** — styles.js @import 삭제, index.html에 wght@400;700;900 보정
2. **SKILL_TREES에 color 필드 추가** — common:#888, ranger_red:#e64b35, ranger_blue:#4e79a7, ranger_yellow:#f0b930
3. **VillageScreen 탭 색상 → tree.color** — tree.id.indexOf(...) ternary 제거
4. **relicBorderColor 헬퍼 추출** — utils.js에 함수 추가, SmallScreens(3곳)+ShopScreen(1곳) 교체, tier-3 `#f97316`→`var(--gd)` 버그 수정
5. **CSS 변수 --ac/--pu/--or 추가** — :root에 추가, 6개 파일에서 리터럴→var() 교체 (alpha 변형 제외)

### 검증
- 빌드 성공 (220.98 kB)

---

## 세션 23: 빠른 코드 정리 (2026-03-05)

### 완료 내역
1. **미사용 import 제거** — DungeonHand_v3.jsx에서 FLOOR_NAMES/SKILL_TREES/ULTIMATE_SKILL, SmallScreens.jsx에서 SKILL_TREES/ULTIMATE_SKILL 제거
2. **data.js var→const 통일** — SUITS, CAMPFIRE_EVENTS, KEYWORDS, SKILL_TREES, ULTIMATE_SKILL, BOSS_POINTS 6곳
3. **relicBorderColor 이동** — utils.js→components.jsx (UI 헬퍼이므로), SmallScreens/ShopScreen import 경로 변경

### 검증
- 빌드 성공 (220.95 kB)

---

## 세션 23B: 코드 정리 추가 (2026-03-05)

### 완료 내역
1. **rcPool 필터링 중복 제거** — getRewardPool() 헬퍼 추출, 822줄/919줄 2곳 교체
2. **components.jsx var→const/let 통일** — 34개 var 선언 → const 31개 + let 3개

### 검증
- 빌드 성공 (220.89 kB)

---

## 세션 24: 중복 코드 제거 (2026-03-05)

### 완료 내역
1. **scaleMonsterHp/scaleMonsterAtk 함수 추출** — beginBattle(168줄) + 캠프기습(1043줄) 2곳 교체
2. **rollEnemyDmg 함수 추출** — beginBattle기습(228줄) + enemyTurn(501줄) + 캠프기습(1069줄) 3곳 교체
3. **rollGrade 함수 추출** — generateRewardCards 내부함수 → 컴포넌트 메서드로 승격, openShop 인라인 로직 교체
4. **resetBattleState 함수 추출** — beginBattle(184~191줄) + 캠프기습(1054~1062줄) 통합 (10개 setter)

### 검증
- 빌드 성공 (220.77 kB)

---

## 세션 25: 기술부채 정리 — 버그+구조 (2026-03-05)

### 완료 내역
1. **VictoryScreen/DefeatScreen "마을" 버튼 버그 수정** — claimAndGo("menu")→claimAndGo("village") (승리/패배 후 마을 이동 복원)
2. **startRun BASE_HP 하드코딩 제거** — `70 + upgradeLevels.hp * 5` 수식 중복 → `MAX_HP` 직접 참조
3. **monMap 중복 + MONSTERS_PER_FLOOR 상수 추출** — `{ 1:0, 2:1, 4:2, 5:3 }` 2곳 → `BATTLE_TO_SLOT` 상수, `* 4` 3곳 → `MONSTERS_PER_FLOOR`
4. **var→const 7개** — MAX_HP, HAND_SIZE, MAX_HAND, RELIC_SLOTS, BASE_SUBMIT, MONSTERS_PER_FLOOR, BATTLE_TO_SLOT
5. **gamble relic eff 데이터 기반화** — data.js에 win/lose 필드 추가, beginBattle에서 하드코딩 제거

### 검증
- 빌드 성공 (220.81 kB)

---

## 세션 26: 유지보수 치명 이슈 해결 (2026-03-05)

### 완료 내역
1. **passiveState stale closure 버그 수정** — useRef로 최신 passiveState 추적, enemyTurn onEvade/onHit + campfire onCamp에서 passiveStateRef.current 사용
2. **upgradeLevels 자동 초기화** — SKILL_TREES+ULTIMATE_SKILL에서 initUpgrades 자동 생성 (수동 키 나열 제거)
3. **BASE_HP 상수 추출** — 70 하드코딩 2곳 → 모듈 레벨 BASE_HP 상수 참조
4. **fxMap → COMMONS desc 필드 통합** — data.js COMMONS/REWARD_COMMONS에 desc 추가, components.jsx fxMap 삭제 (reclaim은 동적 인라인)
5. **SHOP_MAX_REMOVE 상수 추출** — 상점 카드 제거 횟수 하드코딩 3곳 → 모듈 레벨 상수 + game props 전달

### 검증
- 매 수정 후 빌드 성공

---

## 세션 27 (2026-03-05) — UI/UX 개선

### 완료
- [x] #5 CardView 트랜지션 최적화: `all 0.15s` → `transform/box-shadow` 타겟 + WebkitTapHighlightColor 추가 (번카드 포함)
- [x] #2 HpBar 반응형 너비: 200/240px 고정 → `min(200px,56vw)`/`min(240px,64vw)` + 트랙 배경 `var(--cd)` 토큰화
- [x] #1 Btn 3D 외관 + 누르기 피드백: `.btn-base` CSS 룰 추가 (border-bottom 3D + :active 눌림), transition 제거
- [x] #3 전투 액션바 높이 확대: height:38 삭제 → 패딩 확대 + borderTop/background 시각 분리, 버튼 탭 타겟 확대
- [x] #4 유물 탭 인스펙터: BattleScreen relicTip 로컬 state + 유물 이모지 탭 → 툴팁 토글

### 수정 파일
| 파일 | 수정 건 |
|------|---------|
| styles.js | #1 (.btn-base 2줄 추가) |
| components.jsx | #1, #2, #5 |
| screens/BattleScreen.jsx | #3, #4 |

### 검증
- 매 수정 후 빌드 성공

---

## 세션 29 (2026-03-05) — 강한 공격 시 몬스터 넉백 효과

### 완료
- [x] styles.js: shakeHard 키프레임에 translateY 추가 — 10%에서 -12px(최대 넉백) → 점진적 0 복귀
- [x] components.jsx: shakeHard 애니메이션 duration 0.5s → 0.6s (넉백 복귀 느낌 강조)

### 검증
- 빌드 성공

---

## 세션 29B (2026-03-05) — 정적 분석 버그 수정 5건

### 완료
- [x] #1 burn 카드 레드 문양 판정 오류: `!c.burning` 조건 추가 (utils.js)
- [x] #2 initUpgrades lazy initializer: `useState(() => {...})` 패턴 적용 (DungeonHand_v3.jsx)
- [x] #3 poison stale closure: enemyTurn에 poisonOverride 파라미터 추가 (DungeonHand_v3.jsx)
- [x] #4 splitMon stale closure: splitMonRef(useRef) 추가 + setMonster updater 내 참조 교체 (DungeonHand_v3.jsx)
- [x] #5 monster stale closure: monsterRef(useRef) 추가 + freeze/erode/burn에서 참조 교체 (DungeonHand_v3.jsx)

### 검증
- 매 수정 후 빌드 성공

---

## 세션 33 (2026-03-05) — 전투화면 레이아웃 시프트 수정 + UI 개선

### 완료
- [x] bossDialogue absolute 위치 변경 (몬스터 컨테이너 기준 top:100%)
- [x] 데미지 그룹 bottom 조정 + column-reverse (passiveMsg 소멸 시 시프트 방지)
- [x] 손패 영역 높이 증가 (선택 카드 상단 가림 해소)
- [x] MISS 위치 플레이어 쪽(65%)으로 분기
- [x] encounterOverlay 배경/콘텐츠 분리 (scale 시 배경 노출 방지)
- [x] 몬스터 표시 순서 변경: 이름→HP바→공격력→캐릭터(이모지)
- [x] 몬스터 shake/attack 애니메이션 이모지로 이동
- [x] gambleAnim absolute 위치 변경 (몬스터 시프트 방지)
- [x] DefeatScreen "마을"→"홈으로" + "다시 도전" 바로 던전 재입장
- [x] 레이아웃 시프트 전수 조사 및 수정 4건 (splitMon/상태줄/배지영역/캠프판매확인)
- [x] dead props 정리 (HpBar emoji/shaking/hardShake/enemyAttacking)
- [x] HpBar emojiSize boss 분기 dead code 제거

### 수정 파일
| 파일 | 변경 |
|------|------|
| screens/BattleScreen.jsx | 레이아웃 시프트 수정, 몬스터 순서/애니메이션, encounterOverlay, gambleAnim |
| components.jsx | HpBar 이모지/애니메이션 분리, dead code 제거 |
| screens/SmallScreens.jsx | DefeatScreen 버튼 변경 |
| screens/CampfireScreen.jsx | pendingSell visibility 처리 |
| DungeonHand_v3.jsx | claimAndGo restart 분기 추가 |

### 검증
- 매 수정 후 빌드 성공

---

## 다음 세션 TODO (우선순위순)

### 🔴 P0: UI 리디자인 + 에셋 도입 (순차 진행)
> 전체 계획: 레이아웃/색상 → 배경 이미지 → 캐릭터(몬스터) 이미지 순서로 진행
> 에셋 방식: PNG/SVG 이미지 파일 (무료 소스에서 확보)
> 배경 범위: 모든 화면 (메뉴/마을/상점/캠프/전투)

#### ~~Phase 1: 레이아웃/색상/타이포그래피 리디자인~~ ✅ 완료 (세션 34~37)

#### ~~Phase 2: 배경 이미지 도입~~ ✅ 완료 (세션 38~39)
- [x] 배경 코드 구조 완성 (SCREEN_BG + gradient 오버레이 + BASE_URL)
- [x] 전투 배경 적용 + 확인 완료
- [x] 층별 전투 배경 분리 (battle0{1~5}.webp + bossbattle0{1~5}.webp)
- [x] 층별 캠프파이어 배경 분리 (campfire0{1~5}.webp)

#### Phase 3: 캐릭터(몬스터) 이미지 도입 (진행중)
- [x] MONSTERS에 img 필드 추가 (20종)
- [x] BattleScreen 이모지→이미지 교체 (onError fallback 포함)
- [x] 인카운터 오버레이 이모지→이미지 교체
- [ ] 나머지 19종 몬스터 이미지 에셋 확보 (goblin.webp만 완료)
- [x] 모바일 유물 탭 인스펙터 (세션27 완료)
- [x] 상점 카드 제거 불가 사유 표시 (세션28 완료)
- [x] 캠프 상인 판매 확인 UI (세션28 완료)
- [x] 스킬 초기화 3회 제한 도달 시 사유 표시 (세션28 완료)

### 🟠 P1: 콘텐츠 확장
- [ ] 신규 직업 추가 (전사/마법사/성직자 중 택1) — 패시브 훅 시스템 완비로 data.js만 수정
- [ ] 유물 추가 (현재 10종 → 15~18종) — 풀 고갈 문제 해소
- [ ] 키워드 추가 (현재 4종 → 6~7종)
- [ ] 캠프파이어 이벤트 추가 (현재 5종 → 7~8종)
- [ ] 1~2층 몬스터 특수능력 추가 (고블린 도둑/뱀파이어 흡혈 등)

### 🟡 P2: 게임 시스템
- [x] 저장/불러오기 (localStorage) — 세션44 완료
- [ ] 승리 시 골드→메타포인트 변환 (현재 골드 무의미)
- [ ] 유물 보상 "넘기기" 버튼 (슬롯 꽉 찼을 때 불필요한 교체 강요 방지)
- [ ] 난이도 설정 (스케일링 계수 분기)

### 🟢 P3: 코드 품질
- [x] initUpgrades lazy initializer (`useState(() => {...})`) — 세션29B 완료
- [x] 캠프 기습 ambush laterTimers 적용 + performAmbush 헬퍼 통합 (세션43 완료)
- [x] dead comment 정리 — 세션43 완료
- [x] tenacityUsed stale closure → useRef 패턴 적용 — 세션31 완료
- [x] ShopScreen IIFE → 렌더 전 계산 변수로 추출 — 세션31 완료

## 세션 30 (2026-03-05) — 전투화면 UI 점검 P0+P1

### 완료
- [x] CSS 변수 --fr/#60a5fa, --bn/#fca5a5, --er/#a78bfa 추가 + 하드코딩 색상 3곳 교체
- [x] 상단바 족보/덱 버튼 터치 타겟 확대 (최소 패딩 4→8px)
- [x] 유물 이모지 터치 영역 확대 (gap 2→4, padding 추가)
- [x] 유물 툴팁 잘림 수정 (bottom calc(100%+8px), maxWidth 80vw, whiteSpace normal)
- [x] 손패 영역 padding 하드코딩 → clamp() 반응형

### 🔵 P4: 밸런스 점검
- [ ] runPoints 승리 보너스 +3 vs 보스 킬 포인트 비율 검토
- [ ] stealth 투자 대비 효율 vs critMastery 비교
- [ ] bgmOn("home") 마을 BGM 실제 동작 확인
- [ ] 🌀 이모지 중복 (심연의 군주 / 대마법사) 수정

---

## 세션 31 (2026-03-05) — P3 코드 품질 정리 3건

### 완료
- [x] tenacityUsed stale closure → useRef 추적 (setHp 콜백 내 이중 발동 방지)
- [x] dead comment 정리 ("Warrior 🔷 blue" → "passive hook")
- [x] ShopScreen IIFE 3개 → 렌더 전 변수 추출 (relicCost/healCost/removeCost/sortedDeck)

---

## 세션 32 (2026-03-05) — 모바일 가독성 개선 5건

### 완료
- [x] VillageScreen 터치 타겟 확대 (탭/노드/구매/궁극기/리셋 버튼 padding 증가)
- [x] VillageScreen 12px→13px, 11px→12px 폰트 상향 (모바일 가독성)
- [x] BattleScreen 유물 이모지 터치 영역 확대 (padding 4px 2px → 6px 4px)
- [x] BattleScreen 하단바 프리뷰 textOverflow: "ellipsis" 추가
- [x] ShopScreen 덱 버튼 터치 타겟 확대 (padding 4px 10px → 6px 12px, fontSize 13→14)

---

## 세션 33 (2026-03-05) — 전투화면 레이아웃 시프트 수정 + UX 개선

### 완료
- [x] bossDialogue 등장 시 몬스터 바운스 수정 (position: absolute)
- [x] 데미지 그룹 하단 상태창 간격 조정 (clamp(12px, 3vh, 24px))
- [x] 카드 선택 시 상단 잘림 수정 (hand area 높이 증가)
- [x] passiveMsg 사라질 때 damageInfo 위치 이동 수정 (column-reverse)
- [x] encounterOverlay 스케일 애니메이션 시 배경 노출 수정 (배경/콘텐츠 분리)
- [x] MISS 표시 위치 플레이어 쪽으로 이동 (top 40%→65%)
- [x] 몬스터 표시 순서 변경 (HP바→공격력→이모지)
- [x] 몬스터 이모지에 흔들림/공격 애니메이션 이동 (HpBar에서 분리)
- [x] DefeatScreen "마을"→"홈으로" + "다시 도전"→바로 던전 재입장
- [x] gambleAnim 레이아웃 시프트 수정 (position: absolute)
- [x] 레이아웃 시프트 전수 조사 + 4건 추가 수정 (splitMon/stats/badge)
- [x] 정적 분석: dead props/dead code 정리

---

## 세션 34 (2026-03-05) — 색상 테마 워밍 던전 톤 교체

### 완료
- [x] styles.js CSS 변수 17종 워밍 팔레트로 교체 + 신규 3종 추가 (--wn/--cr/--sb)
- [x] components.jsx 카드/화상/HP바/버튼 하드코딩 색상 교체
- [x] BattleScreen.jsx 인카운터/갬블/데미지/뱃지/MISS 색상 교체
- [x] SmallScreens.jsx 타이틀/버튼/유물 배경 색상 교체
- [x] CampfireScreen.jsx 이벤트 배경/텍스트/골드 색상 교체
- [x] VillageScreen.jsx 스킬트리/궁극기/리셋 색상 교체
- [x] ShopScreen.jsx 회복 버튼 색상 교체
- [x] DungeonHand_v3.jsx 화상카드 suitColor 교체

## 세션 35 (2026-03-05) — 깊이감(Depth) UI 개선

### 완료
- [x] DungeonHand_v3.jsx: wrapStyle background → radial-gradient 비네트 효과
- [x] BattleScreen: 상단바/하단상태창/하단액션바 boxShadow 추가
- [x] ShopScreen: 상단 헤더 boxShadow 추가
- [x] CampfireScreen: 8개 이벤트 박스 boxShadow 추가
- [x] DeckViewer: 메인 패널 boxShadow 추가
- [x] HpBar: 트랙 inset shadow + fill gradient + inset highlight (컴포넌트+배틀 인라인)
- [x] Btn: flat color → linear-gradient + 강화된 boxShadow
- [x] styles.js: .btn-base:hover 규칙 추가
- [x] CardView: 기본 drop shadow + inset highlight, 선택 시 문양색 glow 강화, 화상 카드 동일 적용

## 세션 36 (2026-03-05) — 레이아웃 일관성 정리

### 완료
- [x] styles.js: :root에 --fs-xl/lg/md/sm 폰트 변수 4종 추가 (clamp 반응형)
- [x] SmallScreens.jsx: 7개 화면 제목/라벨 → CSS 변수 (Menu 28→xl, ClassSelect 16→xl, Reward/Enhance/RelicReward 15/14→lg, Victory 16→xl, Defeat 18→xl)
- [x] CampfireScreen.jsx: Phase 1/3 이모지 56→48, 모든 본문 14→md, 버튼 13~16→md, Merchant 이모지 22→24
- [x] ShopScreen.jsx: 헤더 제목 16→xl, 섹션 제목 14→lg, 유물 설명 16→md (돌출 수정), HP/버튼 14→md
- [x] VillageScreen.jsx: 제목 16→xl, 포인트 14→md, 총투자 13→sm, 탭 13→md, 스킬 이름 13→md, 설명 13→sm (계층 분리)

## 세션 37 (2026-03-05) — 하드코딩 색상 변수화 + 반응형 폭

### 완료
- [x] styles.js: CSS 변수 8종 추가 (--burn-bg/dark/bd, --cm-bg/dark/tx, --btn-off, --card-dark)
- [x] components.jsx: CardView 화상카드 3곳, 커먼카드 bg/color 4곳, Btn 비활성 1곳 → CSS 변수 교체
- [x] SmallScreens.jsx: #14120e → var(--card-dark) 3곳 + ClassSelect width clamp + RelicReward width clamp
- [x] ShopScreen.jsx: 하드코딩 색상 없음 (이미 변수화 완료)
- [x] CampfireScreen.jsx: 상인 이벤트 border #fbbf24 → var(--gd) 2곳

## 세션 38 (2026-03-05) — 배경 이미지 도입 (CSS 오버레이)

### 완료
- [x] public/images/bg/ 폴더 생성 (이미지 배치 위치)
- [x] data.js: SCREEN_BG 상수 추가 (menu/village/shop/campfire/battle 5종 경로)
- [x] DungeonHand_v3.jsx: screen→bgKey 매핑 + wrapStyle background 멀티레이어화 (gradient 오버레이 + url)
- [x] DungeonHand_v3.jsx: imageRendering: "pixelated" 추가 (픽셀아트 배경 선명 표시)
- [x] 배경 이미지 경로 버그 수정: BASE_URL 누락 → bgUrl에 import.meta.env.BASE_URL 접두사 추가 + SCREEN_BG 경로 선행 `/` 제거
- [x] battle.png 배경 실제 표시 확인 완료

### 화면→배경 매핑
| bgKey | 적용 화면 |
|-------|-----------|
| menu | menu, classSelect, victory, defeat |
| village | village |
| shop | shop |
| campfire | campfire |
| battle | battle, reward, enhance, relicReward |

### 이미지 배치 현황
`public/images/bg/` 에 배치:
- [x] battle.png — 전투/보상/강화 배경 ✅ 표시 확인
- [ ] menu.webp — 메뉴/직업선택/승리/패배 배경
- [ ] village.webp — 마을 배경
- [ ] shop.webp — 상점 배경
- [ ] campfire.webp — 캠프파이어 배경

이미지 없는 화면은 기존 gradient fallback으로 정상 표시됨.

## 세션 41 (2026-03-06) — 코드 품질 정리 5건

### 완료
- [x] getFloorFilter() dead code 삭제 (data.js, 14줄 제거)
- [x] 캠프힐/화상 매직넘버 상수 추출: CAMP_HEAL=10, CAMP_REST_HEAL=5, BURN_DAMAGE=3 (data.js + 메인 + CampfireScreen + components)
- [x] SUIT_ORDER 상수 추출 (data.js → components/SmallScreens/ShopScreen 3곳 교체)
- [x] 미사용/이중 import 정리 (HpBar 미사용 제거, SmallScreens/ShopScreen 이중 import 합침)
- [x] dead comment 제거 (poison 관련 오래된 주석 2줄)
- [x] WORK_LOG 최상단에 "현재 세션 계획" 섹션 도입
- [x] 밸런스 수정 5건: 심연군주 이모지 👿, 가시 3, 주사위 -0.3, 감정사 등급5, 급소숙련 코스트 3
