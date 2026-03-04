// === DATA ===
var SUITS = [
  { id: "red", emoji: "🔺", color: "#e64b35" },
  { id: "blue", emoji: "🔷", color: "#4e79a7" },
  { id: "yellow", emoji: "⭐", color: "#f0b930" },
];

const CLASSES = [
  {
    id: "ranger",
    icon: "🗡️",
    name: "도적",
    suits: { red: "습격", blue: "연계", yellow: "급소" },
    passive: {
      name: "그림자",
      icon: "🌑",
      desc: "🌑 🔺포함 → 그림자",
      color: "#7c3aed",
      suitDescs: ["🔺 그림자+1", "🔷 드로우+1", "⭐ 급소 15%/장"],

      init: function(hasAwakening) {
        return { stacks: hasAwakening ? 1 : 0 };
      },

      cardBonus: function(suitId) {
        return { atk: 0, defReduce: 0 };
      },

      calcBonus: function(pState, suitBonuses, stealthBonus) {
        return {
          evasion: Math.min(50, 10 + stealthBonus + pState.stacks * 5),
          crit: Math.min(90, suitBonuses.yellow * 15),
          extraDraw: suitBonuses.blue >= 2 ? (pState.chainBoost ? 2 : 1) : 0,
        };
      },

      applyMult: function(mult, pState) {
        if (pState.stacks > 0) {
          var perStack = pState.shadowBurst ? 0.8 : 0.5;
          mult += pState.stacks * perStack;
        }
        return mult;
      },

      onSubmit: function(pState, playedCards) {
        var perStack = pState.shadowBurst ? 0.8 : 0.5;
        var hasRed = playedCards.some(function(c) { return !c.isCommon && c.suitId === "red"; });
        if (hasRed) {
          var ns = pState.stacks + 1;
          var evPct = Math.min(50, 10 + ns * 5);
          return { state: { stacks: ns }, msg: "🌑 그림자 x" + ns + "! 배율+" + (ns * perStack).toFixed(1) + " 회피" + evPct + "%" };
        }
        if (pState.stacks > 0) {
          return { state: { stacks: 0 }, msg: "💨 그림자 소멸... (🔺 포함 필요)" };
        }
        return { state: pState };
      },

      onHit: function(pState) {
        if (pState.stacks > 0) {
          return { state: { stacks: 0 }, msg: "💨 피격! 그림자 소멸..." };
        }
        return { state: pState };
      },

      onEvade: function(pState) {
        var perStack = pState.shadowBurst ? 0.8 : 0.5;
        var ns = pState.stacks + 1;
        return { state: { stacks: ns }, msg: "🗡️ 회피! 그림자 x" + ns + " (배율+" + (ns * perStack).toFixed(1) + ")" };
      },

      onCamp: function(pState) {
        return { state: { stacks: pState.stacks + 1 }, msg: "🌑 그림자 +1!" };
      },

      suitMessages: function(suitBonuses, critChance, hasRed) {
        var msgs = [];
        if (hasRed) msgs.push("🔺포함→그림자+1");
        if (suitBonuses.blue >= 2) msgs.push("🔷드로우+1");
        if (suitBonuses.yellow > 0) msgs.push("⭐급소" + critChance + "%");
        return msgs;
      },

      renderBadge: function(pState, stealthBonus) {
        var perStack = pState.shadowBurst ? 0.8 : 0.5;
        if (pState.stacks > 0) {
          return {
            bg: "#7c3aed22", border: "#7c3aed",
            label: "🌑x" + pState.stacks,
            detail: "+" + (pState.stacks * perStack).toFixed(1) + " 회피" + Math.min(50, 10 + pState.stacks * 5) + "%",
          };
        }
        return {
          bg: "#1a1a2e", border: "var(--bd)",
          label: "🌑회피" + (10 + stealthBonus) + "%",
        };
      },
    },
  },
];

const COMMONS = [
  { id: "aimed", icon: "🎯", name: "집중타", fx: "aimed" },
  { id: "glass", icon: "🔮", name: "유리", fx: "glass" },
  { id: "focus", icon: "⚡", name: "기세", fx: "focus" },
];

// Reward-only commons (not in starting deck)
const REWARD_COMMONS = COMMONS.concat([
  { id: "reclaim", icon: "🔁", name: "회수", fx: "reclaim" },
  { id: "gambit", icon: "🎰", name: "투기", fx: "gambit" },
]);

const MONSTERS = [
  // Floor 1: 고블린 소굴 (indices 0-3) — x1.3 적용
  { name: "고블린", emoji: "👺", hp: 36, atk: 6 },
  { name: "고블린 궁수", emoji: "🏹", hp: 50, atk: 8 },
  { name: "고블린 대장", emoji: "💪", hp: 72, atk: 9, miniboss: true },
  { name: "고블린 킹", emoji: "👑", hp: 94, atk: 11, boss: true },
  // Floor 2: 언데드 묘지 (indices 4-7)
  { name: "해골 병사", emoji: "💀", hp: 59, atk: 7 },
  { name: "뱀파이어", emoji: "🧛", hp: 72, atk: 9 },
  { name: "망령 기사", emoji: "⚔️", hp: 91, atk: 10, miniboss: true },
  { name: "리치", emoji: "☠️", hp: 124, atk: 12, boss: true },
  // Floor 3: 마법 탑 (indices 8-11)
  { name: "골렘", emoji: "🗿", hp: 72, atk: 8, freeze: 1 },
  { name: "마녀", emoji: "🧙‍♀️", hp: 85, atk: 10, freeze: 2 },
  { name: "불꽃 정령", emoji: "🔥", hp: 104, atk: 11, miniboss: true, freeze: 1 },
  { name: "대마법사", emoji: "🌀", hp: 143, atk: 13, boss: true, freeze: 2, split: true },
  // Floor 4: 심연 (indices 12-15)
  { name: "그림자 포식자", emoji: "🌑", hp: 78, atk: 9 },
  { name: "심연의 눈", emoji: "👁️", hp: 98, atk: 11, erode: 1 },
  { name: "공허의 사도", emoji: "🕳️", hp: 124, atk: 12, miniboss: true, erode: 2 },
  { name: "심연의 군주", emoji: "🌀", hp: 176, atk: 15, boss: true, erode: 2 },
  // Floor 5: 드래곤 둥지 (indices 16-19)
  { name: "드래곤 알지기", emoji: "🥚", hp: 117, atk: 12 },
  { name: "드래곤 새끼", emoji: "🐉", hp: 143, atk: 14, burn: 1 },
  { name: "드래곤 근위병", emoji: "🛡️", hp: 182, atk: 16, miniboss: true, burn: 1 },
  { name: "드래곤 로드", emoji: "🐲", hp: 260, atk: 20, boss: true, burn: 2 },
];

// Campfire events
var CAMPFIRE_EVENTS = [
  { id: "fairy", name: "🧚 요정", desc: "요정이 축복을 내렸다!", good: true },
  { id: "merchant", name: "🏪 떠돌이 상인", desc: "카드를 팔아 골드를 얻자", good: true },
  { id: "rest", name: "😴 평온한 휴식", desc: "깊은 잠에 빠졌다...", good: true },
  { id: "ambush", name: "🐺 습격", desc: "적이 기습했다!", good: false },
  { id: "thief", name: "🤡 도둑", desc: "도둑이 카드를 훔쳐갔다!", good: false },
];

const RELICS = [
  { id: "whet", name: "낡은 숫돌", emoji: "🗡️", desc: "카드당 공격력 +1", tier: 1, eff: { type: "atk", val: 1 }, classId: null },
  { id: "glove", name: "가죽 장갑", emoji: "🧤", desc: "버리기 횟수 +1", tier: 1, eff: { type: "disc", val: 1 }, classId: null },
  { id: "dice", name: "도박사의 주사위", emoji: "🎲", desc: "매 전투 시작 시 50% 배율+1 / 50% 배율-0.5", tier: 1, eff: { type: "gamble" }, classId: null },
  { id: "thorn", name: "가시 갑옷", emoji: "🦔", desc: "피격 시 적에게 2 반사", tier: 1, eff: { type: "thorns", val: 2 }, classId: null },
  { id: "ruby", name: "루비 반지", emoji: "💍", desc: "🔺카드 공격력 x2", tier: 2, eff: { type: "suitMul", suit: "red", val: 2 }, classId: null },
  { id: "chain", name: "연쇄의 고리", emoji: "⛓️", desc: "스트레이트 배율 +2", tier: 2, eff: { type: "handAdd", hand: "스트레이트", val: 2 }, classId: null },
  { id: "eye", name: "감정사의 눈", emoji: "👁️", desc: "등급4↑ 카드 1장당 배율 +2", tier: 2, eff: { type: "gradeAdd", grade: 4, val: 2 }, classId: null },
  { id: "book2", name: "전쟁의 서", emoji: "📖", desc: "매 전투 첫 제출 시 한도 +1", tier: 3, eff: { type: "submitOnce", val: 1 }, classId: null },
  { id: "hero", name: "영웅의 증표", emoji: "🏅", desc: "스트레이트 플러시 배율 x2", tier: 3, eff: { type: "handMul", hand: "스트레이트 플러시", val: 2 }, classId: null },
  { id: "inf", name: "무한의 덱", emoji: "♾️", desc: "매 턴 드로우 +1", tier: 3, eff: { type: "drawAdd", val: 1 }, classId: null },
];

const FLOOR_NAMES = ["", "고블린 소굴", "언데드 묘지", "마법 탑", "심연", "드래곤 둥지"];

// Boss/miniboss dialogue lines (keyed by monster name)
const BOSS_DIALOGUES = {
  "고블린 대장": ["이 녀석들! 내 부하를 건드리다니!", "크하하! 쓸 만한 놈이군!"],
  "고블린 킹": ["감히 왕 앞에서 칼을 드나!", "이 왕관은 피로 지켜왔다!"],
  "망령 기사": ["죽음이 끝이 아니라는 걸 보여주지...", "검의 기억은 사라지지 않는다."],
  "리치": ["영원을 살아온 자에게 도전하겠다고?", "네 영혼... 좋은 재료가 되겠군."],
  "불꽃 정령": ["타올라! 모든 것을 재로!", "불꽃은 멈추지 않는다!"],
  "대마법사": ["마법의 힘을 보여주마!", "이 탑의 주인은 나다!"],
  "공허의 사도": ["심연이 너를 부르고 있다...", "어둠 속에서 영원히 헤매거라."],
  "심연의 군주": ["나는 심연 그 자체다!", "빛은 이곳에서 의미가 없다."],
  "드래곤 근위병": ["주인님을 건드리지 마라!", "이 비늘을 뚫을 수 있겠나!"],
  "드래곤 로드": ["필멸자여, 나에게 도전하다니!", "이 땅의 최강은 바로 나다!"],
};

// Keywords that can be attached to cards
var KEYWORDS = [
  { id: "poison", icon: "☠️", name: "맹독", desc: "등급만큼 매턴 독 데미지" },
  { id: "chain", icon: "⛓️", name: "연쇄", desc: "제출 시 드로우 +1" },
  { id: "growth", icon: "🌱", name: "성장", desc: "제출마다 등급 영구 +1" },
  { id: "resonance", icon: "🔔", name: "공명", desc: "같은 문양 2장+ 시 배율 +0.5" },
];

var SKILL_TREES = [
  {
    id: "common", name: "공통", icon: "⚔️", classId: null,
    nodes: [
      { id: "hp", name: "생명력", icon: "❤️", desc: "HP +5", cost: 3, max: 2 },
      { id: "sharp", name: "강화", icon: "🗡️", desc: "시작시 중립카드 등급+1", cost: 4, max: 1 },
      { id: "merchant", name: "상인", icon: "🏪", desc: "상점 20% 할인", cost: 6, max: 1 },
      { id: "loot", name: "약탈", icon: "💰", desc: "전투 골드 +3", cost: 6, max: 2 },
      { id: "tenacity", name: "집념", icon: "💀", desc: "HP 0시 1회 부활", cost: 12, max: 1 },
      { id: "inventory", name: "유물슬롯", icon: "🎒", desc: "유물 슬롯 +1", cost: 8, max: 2 },
    ],
  },
  {
    id: "ranger_red", name: "습격", icon: "🔺", classId: "ranger",
    nodes: [
      { id: "redCollect", name: "🔺수집", icon: "🔺", desc: "보상시 🔺카드 1장 보장", cost: 4, max: 1 },
      { id: "awaken", name: "각성", icon: "🌑", desc: "시작시 그림자 x1", cost: 10, max: 1 },
      { id: "stealth", name: "은신", icon: "🌫️", desc: "기본 회피 +5%", cost: 3, max: 2 },
      { id: "shadowBurst", name: "그림자폭발", icon: "🌑", desc: "스택당 배율 +0.5→+0.8", cost: 8, max: 1 },
    ],
  },
  {
    id: "ranger_blue", name: "연계", icon: "🔷", classId: "ranger",
    nodes: [
      { id: "blueCollect", name: "🔷수집", icon: "🔷", desc: "보상시 🔷카드 1장 보장", cost: 4, max: 1 },
      { id: "deft", name: "손재주", icon: "👋", desc: "시작 드로우 +1", cost: 5, max: 1 },
      { id: "nimble", name: "기민함", icon: "🧤", desc: "버리기 +1", cost: 4, max: 1 },
      { id: "chainBoost", name: "연쇄강화", icon: "🔗", desc: "🔷2장+ 제출시 드로우+2", cost: 7, max: 1 },
    ],
  },
  {
    id: "ranger_yellow", name: "급소", icon: "⭐", classId: "ranger",
    nodes: [
      { id: "yellowCollect", name: "⭐수집", icon: "⭐", desc: "보상시 ⭐카드 1장 보장", cost: 4, max: 1 },
      { id: "critMastery", name: "급소숙련", icon: "🗡️", desc: "치명타 +10%", cost: 4, max: 2 },
      { id: "quickStrike", name: "속전속결", icon: "⚡", desc: "첫턴 치명타 2배", cost: 6, max: 1 },
      { id: "critDamage", name: "치명타격", icon: "💥", desc: "치명 x1.5→x2.0", cost: 8, max: 1 },
    ],
  },
];

var ULTIMATE_SKILL = {
  id: "fatedDice", name: "운명의 주사위", icon: "🎲",
  desc: "매 제출시 1d6: 1-2=x0.5, 3-4=x1.5, 5-6=x3",
  unlockCost: 40,
};

var BOSS_POINTS = { 3: 1, 7: 2, 11: 3, 15: 4, 19: 6 }; // monster index (0-based) → points

export { SUITS, CLASSES, COMMONS, REWARD_COMMONS, MONSTERS, CAMPFIRE_EVENTS, RELICS, FLOOR_NAMES, BOSS_DIALOGUES, KEYWORDS, SKILL_TREES, ULTIMATE_SKILL, BOSS_POINTS };
