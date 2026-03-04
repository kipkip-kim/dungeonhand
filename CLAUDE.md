# 던전 핸드 v3 — CLAUDE.md

## 프로젝트 구조

| 파일 | 설명 |
|------|------|
| `DungeonHand_v3.jsx` | 메인 게임 컴포넌트 (~1,998줄) |
| `audio.js` | sfx 오디오 객체 |
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

---

## 기능 추가 체크리스트

### 카드 효과 추가 시 (5곳, 3개 파일)
1. `data.js` — **COMMONS 또는 REWARD_COMMONS** 배열에 카드 데이터 추가
2. `components.jsx` — **fxMap** 객체에 UI 설명 텍스트 추가
3. `DungeonHand_v3.jsx` — **submitCards()** 함수에 전투 로직 분기 추가
4. `utils.js` — **calcDamage()** 에 데미지 관련 효과 반영 (해당 시)
5. `DungeonHand_v3.jsx` — **enemyTurn() 또는 draw()** 에 턴 종료 로직 추가 (해당 시)

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
audio.js          (87줄)  — sfx 객체
data.js           (240줄) — SUITS, CLASSES, MONSTERS, RELICS, SKILL_TREES 등 모든 상수
utils.js          (247줄) — shuffle, makeDeck, detectHand, calcDamage 등
styles.js         (31줄)  — CSS 문자열
components.jsx    (350줄) — CardView, HpBar, Btn, DeckViewer
DungeonHand_v3.jsx (1,998줄) — 메인 게임 컴포넌트 (useState + 로직 + JSX)
```
- DungeonHand 컴포넌트: useState 58개, 함수 ~40개

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

## 참고: 몬스터 HP (x1.3 적용 완료)

고블린 36 / 궁수 50 / 대장 72 / 킹 94 / 해골 59 / 뱀파이어 72 / 망령 91 / 리치 124 / 골렘 72 / 마녀 85 / 불꽃 104 / 대마법사 143 / 그림자 78 / 심연눈 98 / 공허 124 / 심연군주 176 / 알지기 117 / 새끼 143 / 근위병 182 / 드래곤로드 260
