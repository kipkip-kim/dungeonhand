# 던전 핸드 v3 — CLAUDE.md

## 프로젝트 구조

| 파일 | 설명 |
|------|------|
| `DungeonHand_v3.jsx` | 메인 게임 컴포넌트 (~1,998줄) |
| `audio.js` | sfx 오디오 객체 (HTMLAudioElement 기반, public/audio/ 참조) |
| `public/audio/` | BGM 3종 + SFX 9종 오디오 파일 |
| `data.js` | 상수/배열 (SUITS, CLASSES, MONSTERS 등) |
| `utils.js` | 순수 함수 (shuffle, detectHand, calcDamage 등) |
| `styles.js` | CSS 문자열 |
| `components.jsx` | 공용 컴포넌트 (CardView, HpBar, Btn, DeckViewer) |
| `DungeonHand_v3_portrait.jsx` | **원본 백업 — 절대 수정 금지** |
| `CLAUDE.md` | 프로젝트 규칙/현황 (이 파일) |
| `WORK_LOG.md` | 세션별 변경 이력 + 다음 세션 TODO |

## 금지사항
- `DungeonHand_v3_portrait.jsx`는 원본 백업이므로 **절대 수정하지 않는다**
- git commit 없이 코드 수정을 시작하지 않는다
- 한 세션에 5건 이상 수정하지 않는다
- 검증 없이 다음 수정으로 넘어가지 않는다
- 구현 중 설계를 변경하지 않는다

---

## 작업 규칙

### 수정 단위
- 수정 1건마다 lint/빌드 검증 1회
- JSX 수정 후 빌드 명령으로 문법 오류 즉시 확인
- 5건 수정 → 검증 → 테스트 → git commit → 세션 종료

### 세션 시작 루틴
1. `git pull` (다른 컴퓨터에서 작업 시)
2. CLAUDE.md 확인
3. WORK_LOG.md에서 이전 세션 상태/TODO 확인
4. `git commit -m "before: [작업명]"`

### 세션 종료 루틴
1. lint/빌드 에러 없는지 최종 확인
2. WORK_LOG.md에 완료 내역 기록
3. `git add` 후 `git commit -m "[완료 내역 요약]"`

### git 규칙
- 커밋 메시지는 한국어, 변경 내용 한 줄 요약
- 작업 전 백업 커밋 / 작업 후 완료 커밋 분리
- 큰 기능 추가 시 브랜치 생성 후 작업

---

## 완료된 수정 (8건)

| # | 항목 | 상태 |
|---|------|------|
| 1 | 영웅의 증표 val:3→2, desc "x3"→"x2" | ✅ |
| 2 | 기세 배율 mult += 1.0→0.5, fxMap "배율+1.0"→"배율+0.5" | ✅ |
| 3 | 성장 보너스 캡 Math.min(..., 5) | ✅ |
| 4 | 몬스터 HP 스케일링 0.15→0.45 (mhp, amhp) | ✅ |
| 5 | 전술교대 max:2→1 | ⏭️ 해당 없음 |
| 6 | 강화 시스템 2회 (enhanceCount 도입) | ✅ |
| 9 | 메타 업그레이드 가격 (actualCost 계산+표시) | ✅ |
| 12 | 플레이어 HP 40→70 | ✅ |
| 13 | 연쇄고리 val:3→2 | ✅ |

## 완료된 추가 작업 (9건)

### ~~세션 1: 밸런스 완성~~ ✅ 완료

### ~~세션 2: 신규 카드 효과~~ ✅ 완료
- **#7** 회수(reclaim) 효과 구현 + fxMap ✅
- **#8** 투기(gambit) 효과 구현 + fxMap ✅

### ~~세션 3: 전투 연출~~ ✅ 완료
- **#14** 몬스터 기습 (일반10%, 미니보스20%, 보스30%) ✅
- **#15** 보스/미니보스 대사 (BOSS_DIALOGUES) ✅

### ~~세션 4: 인카운터 시퀀스~~ ✅ 완료
- **#16** 보스 인카운터 효과 (풀스크린 오버레이) ✅
- **#17** 전투 시작 시퀀스 정리 (encounter→dialogue→ambush→dice→draw) ✅

### ~~세션 5: 정적 분석 버그 수정~~ ✅ 완료
- HP 초기화 불일치 수정 (startRun 40→70) ✅
- 회수 메시지 정합성 수정 (실제 회수 후 표시) ✅
- encounterOut dead code 삭제 ✅
- 기습 사망 시 setTimeout 체인 취소 ✅

### ~~세션 6: 변환(wild) 카드 버그 수정~~ ✅ 완료
- detectHand suits 매핑에서 wild 카드 `getEffectiveSuit()` 호출 ✅
- checkStraightFlush에서 wild 공용카드 포함 ✅

### ~~세션 7: 유물/메타 밸런스 조정~~ ✅ 완료
- 전투의 서(book1) 삭제 ✅
- 전쟁의 서(book2) 너프: 전투당 1회 제출 한도 +1 ✅
- submit 메타 → 노련한 상인 (상점 20% 할인) ✅
- sharp 메타 max 2→1 ✅
- 유물 가격 인상 30/50/75 ✅

### ~~세션 8: 유물 인벤토리 슬롯 제한~~ ✅ 완료
- 유물 슬롯 3칸 제한 (RELIC_SLOTS=3) ✅
- 슬롯 꽉 찼을 때 교체/버리기 오버레이 UI ✅
- 버린/교체된 유물 재등장 불가 (discardedRelicIds) ✅
- 상점 교체: 교체 확정 시에만 골드 차감 ✅

### ~~세션 9: 최대 손패 7장 제한~~ ✅ 완료
- MAX_HAND=7 상수 추가 ✅
- submitCards() 드로우 캡 (remain + draw ≤ MAX_HAND) ✅
- 화상 메커닉 하드코딩 → MAX_HAND 상수 참조 ✅

### ~~세션 10: 화상 카드 MAX_HAND 초과 버그 수정~~ ✅ 완료
- 화상(burn) 카드 주입 시 MAX_HAND 초과 방지 (actualBurn 캡) ✅

### ~~세션 11: 아키텍처 진단~~ ✅ 완료
- 코드 수정 없음 — 진단/분석 결과 문서화

### ~~세션 13A: 파일 분할 (데이터/유틸/컴포넌트)~~ ✅ 완료
- audio.js, data.js, utils.js, styles.js, components.jsx 추출 ✅
- 메인 파일 2,893줄 → 1,998줄 ✅

### ~~세션 12: 직업 시스템 데이터 기반 리팩터링~~ ✅ 완료
- 전사(warrior) 직업 삭제 ✅
- fury/lastSuit/shadow useState → passiveState 단일 상태로 통합 ✅
- CLASSES에 passive 훅 객체 추가 (init/cardBonus/calcBonus/applyMult/onSubmit/onHit/onEvade/onCamp/suitMessages/renderBadge) ✅
- calcDamage classId 분기 → passive 훅 호출로 전환 ✅
- submitCards/startRun/enemyTurn/campfire classId 분기 → passive 훅 호출로 전환 ✅
- UI: classSelect passiveDesc/suitLines → passive.desc/suitDescs 참조 ✅
- UI: 패시브 뱃지 warrior/ranger 분기 → passive.renderBadge() ✅
- UI: CLASSES.length===1이면 직업 선택 스킵 ✅
- 기존 JSX 구문 오류 수정 (damageInfo ternary `)}}`→`)}`) ✅

### ~~세션 14: 카드 밸런스 조정~~ ✅ 완료
- 보루(fortress) 삭제 (COMMONS/fxMap/로직/state/UI) ✅
- 변환→모방 이름/아이콘 변경 (🃏→🪞, 변환→모방) ✅
- 투기(gambit) 50% 배율→3장 중 1장 선택 메커닉 ✅
- 키워드 드랍 확률 절반 (보상 0.3/0.15, 상점 0.25) ✅
- 골드 수입 2/3 감소 (10/7/4+rand(5)) ✅

### ~~세션 15: 모방→유리 카드 효과 교체~~ ✅ 완료
- 모방(wild) → 유리(glass) 교체 (🪞→🔮) ✅
- utils.js: getEffectiveSuit/detectHand/checkStraightFlush wild 분기 전체 삭제 ✅
- calcDamage: glass 배율 x1.5 추가 ✅
- submitCards: glass 카드 제출 시 덱에서 영구 소멸 ✅

### ~~세션 16A: 메타 업그레이드 → 스킬 트리 데이터+UI~~ ✅ 완료
- UPGRADES(7종) → SKILL_TREES(4카테고리 18노드) + ULTIMATE_SKILL 교체 ✅
- RELICS classId: null 추가 (직업 유물 확장 기반) ✅
- upgradeLevels 7키 → 21키 확장 ✅
- 마을 UI: 카테고리별 스킬 트리 + 궁극기 해금 ✅
- 유물 필터링에 classId 조건 추가 (보스보상/상점) ✅

### ~~세션 16B: 신규 스킬 효과 구현~~ ✅ 완료
- inventory: RELIC_SLOTS = 3 + inventory ✅
- 문양수집 ×3: 보상 카드 문양 보장 ✅
- 그림자폭발: applyMult 0.5→0.8 분기 + 메시지 동적화 ✅
- 손재주/기민함: HAND_SIZE+deft / discards+nimble ✅
- 연쇄강화: 🔷2장+ extraDraw 1→2 ✅

### ~~세션 16C: 치명타 스킬 + 궁극기 효과~~ ✅ 완료
- 급소숙련: critChance +10%×level ✅
- 속전속결: 첫턴 critChance ×2 ✅
- 치명타격: 치명배율 1.5→2.0 ✅
- 운명의 주사위: 1d6 배율(x0.5/x1.5/x3) + 연출 ✅

### ~~세션 17: BGM 5종 + 효과음 확장~~ ✅ 완료
- BGM 5종: battle/elite/boss/campfire/shop (melodies 객체 + bgmOn(type)) ✅
- 효과음: monHit()/playerHit() 추가, win()/lose() 6음+화음 개선 ✅
- beginBattle 내 bn 기반 BGM 분기 (1,2→battle, 4→elite, 5→boss) ✅
- 캠프파이어/상점 진입 시 각각 campfire/shop BGM ✅
- sfx.dmg()→monHit(), sfx.enemy()→playerHit() 교체 ✅

### ~~세션 19: 오디오 시스템 마이그레이션~~ ✅ 완료
- audio.js: 오실레이터 합성음 → HTMLAudioElement(실제 파일) 전면 교체 ✅
- public/audio/bgm/ (battle/campfire/shop.ogg) + sfx/ (9종) 폴더 구조 ✅
- sfx API 인터페이스 100% 유지 (DungeonHand_v3.jsx/components.jsx 변경 없음) ✅
- iOS 오디오 잠금 해제 유지, 재생 실패 무음 처리 ✅

### ~~세션 21: 화면별 파일 분리~~ ✅ 완료
- screens/SmallScreens.jsx (293줄) — menu, classSelect, reward, enhance, relicReward, victory, defeat, pendingRelic ✅
- screens/CampfireScreen.jsx (179줄) — 캠프파이어 3페이즈 + 6이벤트 ✅
- screens/VillageScreen.jsx (141줄) — 스킬 트리 UI ✅
- screens/BattleScreen.jsx (285줄) — 전투 UI + 인카운터/대사/갬빗 오버레이 ✅
- screens/ShopScreen.jsx (130줄) — 상점 UI ✅
- 캠프파이어 로컬 함수 5개 메인 본문으로 호이스팅 ✅
- game 단일 props 객체로 화면 라우팅 ✅
- DungeonHand_v3.jsx 2,140줄 → 1,215줄 ✅

### ~~세션 22: 코드 품질 정리~~ ✅ 완료
- Google Fonts 이중 로딩 제거 (styles.js @import 삭제 + index.html 보정) ✅
- SKILL_TREES에 color 필드 추가 ✅
- VillageScreen 탭 색상 → tree.color 사용 ✅
- relicBorderColor 헬퍼 추출 + 4곳 교체 (ShopScreen tier-3 버그 수정 포함) ✅
- CSS 변수 --ac/--pu/--or 추가 + 6개 파일 리터럴 교체 ✅

### ~~세션 23: 빠른 코드 정리~~ ✅ 완료
- 미사용 import 제거 (FLOOR_NAMES/SKILL_TREES/ULTIMATE_SKILL) ✅
- data.js var→const 통일 (6곳) ✅
- relicBorderColor utils.js→components.jsx 이동 ✅

### ~~세션 23B: 코드 정리 추가~~ ✅ 완료
- rcPool 필터링 중복 → getRewardPool() 헬퍼 추출 ✅
- components.jsx var→const/let 통일 (34개) ✅

### ~~세션 24: 중복 코드 제거~~ ✅ 완료
- scaleMonsterHp/scaleMonsterAtk 헬퍼 추출 (2곳) ✅
- rollEnemyDmg 헬퍼 추출 (3곳) ✅
- rollGrade 함수 추출 + 상점 인라인 제거 (2곳) ✅
- resetBattleState 헬퍼 추출 (2곳, setter 10개 통합) ✅

### ~~세션 25: 기술부채 정리 — 버그+구조~~ ✅ 완료
- VictoryScreen/DefeatScreen "마을" 버튼 버그 수정 ✅
- startRun BASE_HP 하드코딩 → MAX_HP 참조 ✅
- monMap 중복 + MONSTERS_PER_FLOOR 상수 추출 ✅
- 파생 상수 7개 var→const ✅
- gamble relic eff에 win/lose 값 추가 (데이터 기반화) ✅

### ~~세션 26: 유지보수 치명 이슈 해결~~ ✅ 완료
- passiveState stale closure 버그 수정 (useRef 추적) ✅
- upgradeLevels 자동 초기화 (SKILL_TREES 기반) ✅
- BASE_HP 상수 추출 (70 하드코딩 제거) ✅
- fxMap → COMMONS desc 필드 통합 (fxMap 삭제) ✅
- SHOP_MAX_REMOVE 상수 추출 ✅

### ~~세션 28: P0 UX 수정 3건~~ ✅ 완료
- 스킬 초기화 제한 사유 표시 (3회 소진/포인트 부족/투자 없음) ✅
- 상점 카드 제거 불가 사유 표시 (덱 10장 이하/횟수 소진/골드 부족) ✅
- 캠프 상인 판매 확인 UI (pendingSell 로컬 state + 확인/취소) ✅

### ~~세션 29B: 정적 분석 버그 수정 5건~~ ✅ 완료
- burn 카드 레드 문양 판정 오류 수정 (`!c.burning` 조건) ✅
- initUpgrades lazy initializer 적용 ✅
- poison stale closure 수정 (enemyTurn poisonOverride 파라미터) ✅
- splitMon stale closure 수정 (splitMonRef useRef) ✅
- monster stale closure 수정 (monsterRef useRef, freeze/erode/burn) ✅

### ~~세션 30: 전투화면 UI 점검 P0+P1~~ ✅ 완료
- CSS 변수 --fr/--bn/--er 추가 + 하드코딩 색상 3곳 교체 ✅
- 상단바 족보/덱 버튼 터치 타겟 확대 (패딩 4→8px) ✅
- 유물 이모지 터치 영역 확대 (gap+padding) ✅
- 유물 툴팁 잘림 수정 (calc+maxWidth+whiteSpace) ✅
- 손패 padding 하드코딩 → clamp() 반응형 ✅

### ~~세션 31: P3 코드 품질 정리 3건~~ ✅ 완료
- tenacityUsed stale closure → useRef 추적 (이중 발동 방지) ✅
- dead comment 정리 ("Warrior" → "passive hook") ✅
- ShopScreen IIFE 3개 → 렌더 전 변수 추출 ✅

### ~~세션 32: 모바일 가독성 개선 5건~~ ✅ 완료
- VillageScreen 터치 타겟 확대 (탭/노드/구매/궁극기/리셋 버튼 padding 증가) ✅
- VillageScreen fontSize 12→13, 11→12 일괄 상향 ✅
- BattleScreen 유물 이모지 터치 영역 확대 (padding 6px 4px) ✅
- BattleScreen 하단바 프리뷰 textOverflow: "ellipsis" 추가 ✅
- ShopScreen 덱 버튼 터치 타겟 확대 (padding/fontSize 증가) ✅

### ~~세션 35: 깊이감(Depth) UI 개선 5건~~ ✅ 완료
- 앱 배경 radial-gradient 비네트 효과 ✅
- 주요 패널 box-shadow 추가 (BattleScreen/ShopScreen/CampfireScreen/DeckViewer) ✅
- HP 바 광택 효과 (트랙 inset shadow + fill gradient) ✅
- 버튼 그라디언트 + hover glow (Btn + styles.js) ✅
- 카드 drop shadow + 선택 시 문양색 glow 강화 (CardView) ✅

### ~~세션 36: 레이아웃 일관성 정리 5건~~ ✅ 완료
- CSS 폰트 변수 --fs-xl/lg/md/sm 추가 (clamp 반응형) ✅
- SmallScreens 7개 화면 폰트 → CSS 변수 + 반응형 ✅
- CampfireScreen 이모지/버튼/본문 폰트 통일 ✅
- ShopScreen 유물설명 축소 + 전체 폰트 CSS 변수 ✅
- VillageScreen 폰트 계층 분리 (이름 md / 설명 sm) ✅

### ~~세션 37: 하드코딩 색상 변수화 + 반응형 폭~~ ✅ 완료
- styles.js CSS 변수 8종 추가 (burn-bg/dark/bd, cm-bg/dark/tx, btn-off, card-dark) ✅
- components.jsx CardView/Btn 하드코딩 색상 → CSS 변수 (~8곳) ✅
- SmallScreens #14120e → var(--card-dark) + 반응형 폭 2곳 ✅
- CampfireScreen #fbbf24 → var(--gd) 통일 ✅

### ~~세션 38: 배경 이미지 도입~~ ✅ 완료
- public/images/bg/ 폴더 생성 ✅
- data.js SCREEN_BG 상수 추가 (5종 경로) ✅
- wrapStyle background 멀티레이어화 (gradient + url) ✅
- imageRendering: pixelated 추가 ✅

### ~~세션 41: 코드 품질 정리 5건~~ ✅ 완료
- getFloorFilter() dead code 삭제 ✅
- 매직넘버 상수 추출 (CAMP_HEAL, CAMP_REST_HEAL, BURN_DAMAGE) ✅
- SUIT_ORDER 상수 추출 + 3곳 교체 ✅
- 미사용/이중 import 정리 ✅
- dead comment 제거 ✅

### ~~세션 43: 코드 리뷰 기반 품질 개선~~ ✅ 완료
- 캠프 기습 laterTimers 적용 (campTimers 배열 + 사망 시 clearTimeout) ✅
- stale closure 방어적 ref 추가 (handRef/selectedRef/drawPileRef/discardPileRef/relicsRef) ✅
- 메인 파일 state 선언부 var→const 통일 ✅
- HAND_RANKINGS 상수 추출 (data.js → BattleScreen 참조) ✅
- 핫픽스: runPoints const 재할당 버그 수정 ✅
- showPassive 타이머 취소 (passiveTimerRef 도입) ✅
- data.js passive 내부 var→const 통일 ✅
- performAmbush 헬퍼 추출 (beginBattle/캠프 기습 중복 제거) ✅

### ~~세션 44: 저장/불러오기 (localStorage)~~ ✅ 완료
- loadMeta/loadRunData 모듈 레벨 헬퍼 (localStorage JSON 파싱) ✅
- saveMeta/saveRun/clearRunSave/hasSavedRun/loadRun 컴포넌트 함수 ✅
- useState 초기값 메타 로딩 (metaPoints/upgradeLevels/resetCount) ✅
- 자동저장: 캠프 진입 + 상점 진입 (saveRun) ✅
- 런 종료 시 clearRunSave + meta 저장 (claimAndGo) ✅
- VillageScreen "던전으로" 버튼에서 saveMeta 호출 ✅
- MenuScreen "이어하기" 버튼 + 새 게임 확인 팝업 ✅
- utils.js setNextId 추가 (로드 시 카드 ID 충돌 방지) ✅

### ~~세션 46: 지도 시스템 (Slay the Spire 스타일)~~ ✅ 완료
- **세션 A**: 데이터 레이어 — MONSTERS 20→30종 확장, NODE_TYPES/MAP_EVENTS 상수, generateFloorMap() ✅
- **세션 B**: MapScreen/EventScreen UI — 7열 가로 노드 맵 + SVG 연결선 + 이벤트 6종 ✅
- **세션 C**: 플로우 연결 — advanceBattle 제거 → goToMap/goNextFloor/selectNode 도입 ✅
- **세션 D**: 갭 분석 + 반복 개선 (82%→90%→98%) — P0 5건 + P1 2건 + P2 4건 = 11건 수정 ✅
- battleNum state 완전 제거 (node.type 기반 분기로 전환) ✅
- 이벤트 효과 실제 적용 (대장장이 등급+1, 저주샘 등급+2, 방랑자 유물 제안) ✅
- 저장/불러오기 floorMap+currentScreen 포함, SAVE_VERSION 2 ✅
- MapScreen 자동스크롤 (useEffect + scrollRef) ✅
- pickRelic ctx 파라미터 추가 (boss/wanderer/shop 컨텍스트 분기) ✅

---

## 기능 추가 체크리스트

### 카드 효과 추가 시 (4곳, 3개 파일)
1. `data.js` — **COMMONS 또는 REWARD_COMMONS** 배열에 카드 데이터 추가 (desc 필드 포함)
2. `DungeonHand_v3.jsx` — **submitCards()** 함수에 전투 로직 분기 추가
3. `utils.js` — **calcDamage()** 에 데미지 관련 효과 반영 (해당 시)
4. `DungeonHand_v3.jsx` — **enemyTurn() 또는 draw()** 에 턴 종료 로직 추가 (해당 시)

### 유물 추가 시 (3곳, 2개 파일)
1. `data.js` — **RELICS** 배열에 유물 데이터 추가
2. `DungeonHand_v3.jsx` — **eff.type** 처리 분기 추가 (submitCards/calcDamage/beginBattle 등)
3. `DungeonHand_v3.jsx` — 유물이 전투 시작 시 리셋되어야 하면 **beginBattle**에 초기화 추가

### 몬스터 추가 시 (3곳, 1개 파일)
1. `data.js` — **MONSTERS** 배열에 몬스터 데이터 추가
2. `data.js` — **FLOOR_NAMES**에 던전 이름 추가 (새 던전인 경우)
3. `data.js` — **BOSS_DIALOGUES**에 대사 추가 (보스/미니보스인 경우)

### 직업 추가 시 (1곳, 1개 파일 — 데이터 기반)
> 세션 12에서 패시브 시스템을 데이터 기반 훅으로 리팩터링 완료
1. `data.js` — **CLASSES** 배열에 새 항목 추가 (id, icon, name, suits, passive 객체)
2. passive 객체에 모든 훅 구현: init, cardBonus, calcBonus, applyMult, onSubmit, onHit, onEvade, onCamp, suitMessages, renderBadge
3. 코드 수정 불필요 — 모든 분기가 훅을 호출하므로 자동 적용

---

## 아키텍처 참고

### 현재 구조 (멀티 파일)
```
audio.js              (97줄)  — sfx 객체 (HTMLAudioElement 기반)
data.js               (~350줄) — SUITS, CLASSES, MONSTERS(30종), RELICS, SKILL_TREES, NODE_TYPES, MAP_EVENTS 등
utils.js              (~290줄) — shuffle, makeDeck, detectHand, calcDamage, generateFloorMap 등
styles.js             (31줄)  — CSS 문자열
components.jsx        (350줄) — CardView, HpBar, Btn, DeckViewer
DungeonHand_v3.jsx    (~1,400줄) — 메인 게임 컴포넌트 (useState + 로직 + game 객체 + 화면 라우팅)
screens/
  SmallScreens.jsx    (~300줄) — menu, classSelect, reward, enhance, relicReward, victory, defeat, pendingRelic
  BattleScreen.jsx    (285줄) — 전투 UI + 인카운터/대사/갬빗 오버레이
  CampfireScreen.jsx  (179줄) — 캠프파이어 3페이즈 + 6이벤트
  VillageScreen.jsx   (141줄) — 스킬 트리 UI
  ShopScreen.jsx      (130줄) — 상점 UI
  MapScreen.jsx       (~250줄) — 지도 UI (7열 노드 맵 + SVG) + 이벤트 화면
```
- DungeonHand 컴포넌트: useState ~60개, 함수 ~45개
- 화면 컴포넌트는 game 단일 props 객체로 필요한 state/callback 수신
- 지도 시스템: floorMap state로 맵 관리, selectNode()로 노드 진입

### 확장 난이도
| 작업 | 난이도 | 사유 |
|------|--------|------|
| 카드/유물/몬스터 추가 | 쉬움 | 데이터 배열 + 로직 분기 |
| 난이도 설정 | 보통 | 스케일링 계수 분기 |
| 음악/그래픽 변경 | 보통 | sfx/CardView 수정 |
| 추가 직업 | 쉬움 | CLASSES 배열에 passive 훅 객체 추가만으로 완료 |

### 리팩터링 기준
- **4,000줄 초과 시** 화면별 커스텀 훅 분리 검토

---

## 참고: 몬스터 (30종, 층별 6마리)

### 1층 고블린 소굴
고블린 36/6 / 궁수 50/8 / 도둑 42/7(steal5) / 주술사 38/5(erode1) / 대장 72/9 / 킹 94/11

### 2층 언데드 묘지
해골 59/7 / 뱀파이어 72/9 / 구울 63/8(regen4) / 레이스 52/9(steal7) / 망령 91/10 / 리치 124/12

### 3층 마법 탑
골렘 72/8(freeze1) / 마녀 85/10(freeze2) / 가고일 88/7(rage2) / 원소술사 75/9(freeze1,burn1) / 불꽃 104/11 / 대마법사 143/13(freeze2,split)

### 4층 심연
포식자 78/9 / 심연눈 98/11(erode1) / 심연거미 85/10(freeze1,steal6) / 공허흡수자 92/11(erode1,rage2) / 사도 124/12(erode2) / 군주 176/15(erode2)

### 5층 드래곤 둥지
알지기 117/12 / 새끼 143/14(burn1) / 용암도마뱀 130/13(rage3,burn1) / 사제 125/11(regen10) / 근위병 182/16(burn1) / 로드 260/20(burn2)
