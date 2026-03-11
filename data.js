// === DATA ===
const SUITS = [
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
          const perStack = pState.shadowBurst ? 0.8 : 0.5;
          mult += pState.stacks * perStack;
        }
        return mult;
      },

      onSubmit: function(pState, playedCards) {
        const perStack = pState.shadowBurst ? 0.8 : 0.5;
        const hasRed = playedCards.some(function(c) { return !c.isCommon && c.suitId === "red"; });
        if (hasRed) {
          const ns = pState.stacks + 1;
          const evPct = Math.min(50, 10 + ns * 5);
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
        const perStack = pState.shadowBurst ? 0.8 : 0.5;
        const ns = pState.stacks + 1;
        return { state: { stacks: ns }, msg: "🗡️ 회피! 그림자 x" + ns + " (배율+" + (ns * perStack).toFixed(1) + ")" };
      },

      onCamp: function(pState) {
        return { state: { stacks: pState.stacks + 1 }, msg: "🌑 그림자 +1!" };
      },

      suitMessages: function(suitBonuses, critChance, hasRed) {
        const msgs = [];
        if (hasRed) msgs.push("🔺포함→그림자+1");
        if (suitBonuses.blue >= 2) msgs.push("🔷드로우+1");
        if (suitBonuses.yellow > 0) msgs.push("⭐급소" + critChance + "%");
        return msgs;
      },

      renderBadge: function(pState, stealthBonus) {
        const perStack = pState.shadowBurst ? 0.8 : 0.5;
        if (pState.stacks > 0) {
          return {
            bg: "#7c3aed22", border: "var(--pu)",
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
  { id: "aimed", icon: "🎯", name: "집중타", fx: "aimed", desc: "다음턴 제출+1" },
  { id: "glass", icon: "🔮", name: "유리", fx: "glass", desc: "x1.5 소멸" },
  { id: "focus", icon: "⚡", name: "기세", fx: "focus", desc: "배율+0.5" },
];

// Reward-only commons (not in starting deck)
const REWARD_COMMONS = COMMONS.concat([
  { id: "reclaim", icon: "🔁", name: "회수", fx: "reclaim", desc: "회수" },
  { id: "gambit", icon: "🎰", name: "투기", fx: "gambit", desc: "3장 중 1장 선택" },
]);

const MONSTERS = [
  // Floor 1: 고블린 소굴 (indices 0-9) — 일반6 + 엘리트3 + 보스1
  { name: "고블린", emoji: "👺", img: "goblin", hp: 36, atk: 6 },
  { name: "고블린 궁수", emoji: "🏹", img: "goblin_archer", hp: 50, atk: 8 },
  { name: "고블린 도둑", emoji: "🗝️", img: "goblin_thief", hp: 42, atk: 7, steal: 5 },
  { name: "고블린 주술사", emoji: "🔮", img: "goblin_shaman", hp: 38, atk: 5, erode: 1 },
  { name: "고블린 방패병", emoji: "🛡️", img: "goblin_shield", hp: 48, atk: 6, shield: 2 },
  { name: "고블린 독침수", emoji: "🧪", img: "goblin_poison", hp: 40, atk: 5, mPoison: 2 },
  { name: "고블린 대장", emoji: "💪", img: "goblin_chief", hp: 72, atk: 9, miniboss: true },
  { name: "고블린 전투광", emoji: "😤", img: "goblin_berserker", hp: 68, atk: 10, miniboss: true, enrage: true, steal: 4 },
  { name: "고블린 마술사", emoji: "🎪", img: "goblin_mage", hp: 60, atk: 8, miniboss: true, weaken: 1, freeze: 1 },
  { name: "고블린 킹", emoji: "👑", img: "goblin_king", hp: 94, atk: 11, boss: true },
  // Floor 2: 언데드 묘지 (indices 10-19)
  { name: "해골 병사", emoji: "💀", img: "skeleton", hp: 59, atk: 7 },
  { name: "뱀파이어", emoji: "🧛", img: "vampire", hp: 72, atk: 9 },
  { name: "구울", emoji: "🧟", img: "ghoul", hp: 63, atk: 8, regen: 4 },
  { name: "레이스", emoji: "👻", img: "wraith_ghost", hp: 52, atk: 9, steal: 7 },
  { name: "좀비 기사", emoji: "🧟‍♂️", img: "zombie_knight", hp: 65, atk: 8, shield: 3 },
  { name: "독안개 유령", emoji: "🌫️", img: "poison_ghost", hp: 55, atk: 7, mPoison: 3 },
  { name: "망령 기사", emoji: "⚔️", img: "wraith", hp: 91, atk: 10, miniboss: true },
  { name: "흡혈 백작", emoji: "🧛‍♂️", img: "vampire_count", hp: 85, atk: 11, miniboss: true, regen: 6, enrage: true },
  { name: "저주술사", emoji: "💀", img: "curse_mage", hp: 78, atk: 9, miniboss: true, weaken: 2, erode: 1 },
  { name: "리치", emoji: "☠️", img: "lich", hp: 124, atk: 12, boss: true },
  // Floor 3: 마법 탑 (indices 20-29)
  { name: "골렘", emoji: "🗿", img: "golem", hp: 72, atk: 8, freeze: 1 },
  { name: "마녀", emoji: "🧙‍♀️", img: "witch", hp: 85, atk: 10, freeze: 2 },
  { name: "가고일", emoji: "🦇", img: "gargoyle", hp: 88, atk: 7, rage: 2 },
  { name: "원소술사", emoji: "🌪️", img: "elementalist", hp: 75, atk: 9, freeze: 1, burn: 1 },
  { name: "마법 인형", emoji: "🎭", img: "magic_puppet", hp: 80, atk: 8, shield: 4, weaken: 1 },
  { name: "독염 술사", emoji: "☠️", img: "poison_mage", hp: 76, atk: 9, mPoison: 2, burn: 1 },
  { name: "불꽃 정령", emoji: "🔥", img: "fire_elemental", hp: 104, atk: 11, miniboss: true, freeze: 1 },
  { name: "수정 골렘", emoji: "💎", img: "crystal_golem", hp: 120, atk: 10, miniboss: true, shield: 5, rage: 2 },
  { name: "마력 폭주자", emoji: "⚡", img: "mana_berserker", hp: 95, atk: 12, miniboss: true, enrage: true, freeze: 2, burn: 1 },
  { name: "대마법사", emoji: "🌀", img: "archmage", hp: 143, atk: 13, boss: true, freeze: 2, split: true },
  // Floor 4: 심연 (indices 30-39)
  { name: "그림자 포식자", emoji: "🌑", img: "shadow", hp: 78, atk: 9 },
  { name: "심연의 눈", emoji: "👁️", img: "abyss_eye", hp: 98, atk: 11, erode: 1 },
  { name: "심연거미", emoji: "🕷️", img: "abyss_spider", hp: 85, atk: 10, freeze: 1, steal: 6 },
  { name: "공허흡수자", emoji: "🌀", img: "void_absorber", hp: 92, atk: 11, erode: 1, rage: 2 },
  { name: "심연 독충", emoji: "🦂", img: "abyss_scorpion", hp: 88, atk: 10, mPoison: 4 },
  { name: "공허 감시자", emoji: "👁️‍🗨️", img: "void_watcher", hp: 82, atk: 9, shield: 3, erode: 1 },
  { name: "공허의 사도", emoji: "🕳️", img: "void_apostle", hp: 124, atk: 12, miniboss: true, erode: 2 },
  { name: "심연 포식왕", emoji: "🐙", img: "abyss_devourer", hp: 135, atk: 13, miniboss: true, mPoison: 3, steal: 8, enrage: true },
  { name: "공허 직조자", emoji: "🕸️", img: "void_weaver", hp: 118, atk: 11, miniboss: true, weaken: 3, freeze: 2 },
  { name: "심연의 군주", emoji: "👿", img: "abyss_lord", hp: 176, atk: 15, boss: true, erode: 2 },
  // Floor 5: 드래곤 둥지 (indices 40-49)
  { name: "드래곤 알지기", emoji: "🥚", img: "dragon_keeper", hp: 117, atk: 12 },
  { name: "드래곤 새끼", emoji: "🐉", img: "dragon_young", hp: 143, atk: 14, burn: 1 },
  { name: "용암도마뱀", emoji: "🦎", img: "lava_lizard", hp: 130, atk: 13, rage: 3, burn: 1 },
  { name: "드래곤 사제", emoji: "📿", img: "dragon_priest", hp: 125, atk: 11, regen: 10 },
  { name: "용암 독사", emoji: "🐍", img: "lava_snake", hp: 135, atk: 13, mPoison: 5, burn: 1 },
  { name: "드래곤 수호병", emoji: "🏰", img: "dragon_defender", hp: 148, atk: 12, shield: 6 },
  { name: "드래곤 근위병", emoji: "🛡️", img: "dragon_guard", hp: 182, atk: 16, miniboss: true, burn: 1 },
  { name: "화염 폭군", emoji: "🌋", img: "flame_tyrant", hp: 195, atk: 17, miniboss: true, burn: 2, enrage: true, rage: 2 },
  { name: "고대 용사제", emoji: "📿", img: "ancient_priest", hp: 170, atk: 14, miniboss: true, regen: 12, shield: 4, weaken: 2 },
  { name: "드래곤 로드", emoji: "🐲", img: "dragon_lord", hp: 260, atk: 20, boss: true, burn: 2 },
];

// Campfire events
const CAMPFIRE_EVENTS = [
  { id: "fairy", name: "🧚 요정", desc: "요정이 축복을 내렸다!", good: true },
  { id: "merchant", name: "🏪 떠돌이 상인", desc: "카드를 팔아 골드를 얻자", good: true },
  { id: "rest", name: "😴 평온한 휴식", desc: "깊은 잠에 빠졌다...", good: true },
  { id: "ambush", name: "🐺 습격", desc: "적이 기습했다!", good: false },
  { id: "thief", name: "🤡 도둑", desc: "도둑이 카드를 훔쳐갔다!", good: false },
];

const RELICS = [
  { id: "whet", name: "낡은 숫돌", emoji: "🗡️", desc: "카드당 공격력 +1", tier: 1, eff: { type: "atk", val: 1 }, classId: null },
  { id: "glove", name: "가죽 장갑", emoji: "🧤", desc: "버리기 횟수 +1", tier: 1, eff: { type: "disc", val: 1 }, classId: null },
  { id: "dice", name: "도박사의 주사위", emoji: "🎲", desc: "매 전투 시작 시 50% 배율+1 / 50% 배율-0.3", tier: 1, eff: { type: "gamble", win: 1, lose: -0.3 }, classId: null },
  { id: "thorn", name: "가시 갑옷", emoji: "🦔", desc: "피격 시 적에게 5 반사", tier: 1, eff: { type: "thorns", val: 5 }, classId: null },
  { id: "ruby", name: "루비 반지", emoji: "💍", desc: "🔺카드 공격력 x2", tier: 2, eff: { type: "suitMul", suit: "red", val: 2 }, classId: null },
  { id: "chain", name: "연쇄의 고리", emoji: "⛓️", desc: "스트레이트 배율 +3", tier: 2, eff: { type: "handAdd", hand: "스트레이트", val: 3 }, classId: null },
  { id: "eye", name: "감정사의 눈", emoji: "👁️", desc: "등급5↑ 카드 1장당 배율 +2", tier: 2, eff: { type: "gradeAdd", grade: 5, val: 2 }, classId: null },
  { id: "book2", name: "전쟁의 서", emoji: "📖", desc: "매 전투 첫 제출 시 한도 +1", tier: 3, eff: { type: "submitOnce", val: 1 }, classId: null },
  { id: "hero", name: "영웅의 증표", emoji: "🏅", desc: "스트레이트 플러시 배율 x2", tier: 3, eff: { type: "handMul", hand: "스트레이트 플러시", val: 2 }, classId: null },
  { id: "inf", name: "무한의 덱", emoji: "♾️", desc: "매 턴 드로우 +1", tier: 3, eff: { type: "drawAdd", val: 1 }, classId: null },
];

const FLOOR_NAMES = ["", "고블린 소굴", "언데드 묘지", "마법 탑", "심연", "드래곤 둥지"];

// Boss/miniboss dialogue lines (keyed by monster name)
const BOSS_DIALOGUES = {
  "고블린 대장": ["이 녀석들! 내 부하를 건드리다니!", "크하하! 쓸 만한 놈이군!"],
  "고블린 전투광": ["으아아아! 피가 끓어오른다!", "멈출 수 없어... 더 싸워야 해!"],
  "고블린 마술사": ["후후... 몸이 둔해지는 느낌이지?", "마법 앞에선 힘도 소용없다!"],
  "고블린 킹": ["감히 왕 앞에서 칼을 드나!", "이 왕관은 피로 지켜왔다!"],
  "망령 기사": ["죽음이 끝이 아니라는 걸 보여주지...", "검의 기억은 사라지지 않는다."],
  "흡혈 백작": ["피의 향기... 훌륭하군.", "영원한 삶의 대가를 치러라!"],
  "저주술사": ["저주가 너를 감싸고 있다...", "약해져라... 더, 더 약해져라!"],
  "리치": ["영원을 살아온 자에게 도전하겠다고?", "네 영혼... 좋은 재료가 되겠군."],
  "불꽃 정령": ["타올라! 모든 것을 재로!", "불꽃은 멈추지 않는다!"],
  "수정 골렘": ["이 수정 갑옷을 뚫을 수 있겠나?", "부서지지 않는다... 영원히!"],
  "마력 폭주자": ["제어가... 안 돼! 으아아아!", "마력이 폭주한다! 다 태워버리겠어!"],
  "대마법사": ["마법의 힘을 보여주마!", "이 탑의 주인은 나다!"],
  "공허의 사도": ["심연이 너를 부르고 있다...", "어둠 속에서 영원히 헤매거라."],
  "심연 포식왕": ["배가 고프다... 네 모든 것을 삼키겠다!", "독과 어둠 속에서 끝나거라!"],
  "공허 직조자": ["거미줄처럼 얽혀라...", "공허의 실이 너를 옥죈다!"],
  "심연의 군주": ["나는 심연 그 자체다!", "빛은 이곳에서 의미가 없다."],
  "드래곤 근위병": ["주인님을 건드리지 마라!", "이 비늘을 뚫을 수 있겠나!"],
  "화염 폭군": ["불꽃의 분노를 맛봐라!", "모든 것을 태우고 나면 평화가 온다!"],
  "고대 용사제": ["용의 축복이 나를 지킨다.", "치유와 수호... 끝없는 힘이다!"],
  "드래곤 로드": ["필멸자여, 나에게 도전하다니!", "이 땅의 최강은 바로 나다!"],
};

// Keywords that can be attached to cards
const KEYWORDS = [
  { id: "poison", icon: "☠️", name: "맹독", desc: "등급만큼 매턴 독 데미지" },
  { id: "chain", icon: "⛓️", name: "연쇄", desc: "제출 시 드로우 +1" },
  { id: "growth", icon: "🌱", name: "성장", desc: "제출마다 등급 영구 +1" },
  { id: "resonance", icon: "🔔", name: "공명", desc: "같은 문양 2장+ 시 배율 +0.8" },
];

const SKILL_TREES = [
  {
    id: "common", name: "공통", icon: "⚔️", classId: null, color: "#888",
    nodes: [
      { id: "hp", name: "생명력", icon: "❤️", desc: "HP +5", cost: 3, max: 2 },
      { id: "sharp", name: "강화", icon: "🗡️", desc: "시작시 중립카드 등급+1", cost: 4, max: 1 },
      { id: "merchant", name: "상인", icon: "🏪", desc: "상점 20% 할인", cost: 6, max: 1 },
      { id: "loot", name: "약탈", icon: "💰", desc: "전투 골드 +2", cost: 6, max: 2 },
      { id: "tenacity", name: "집념", icon: "💀", desc: "HP 0시 1회 부활", cost: 12, max: 1 },
      { id: "inventory", name: "유물슬롯", icon: "🎒", desc: "유물 슬롯 +1", cost: 8, max: 2 },
    ],
  },
  {
    id: "ranger_red", name: "습격", icon: "🔺", classId: "ranger", color: "#e64b35",
    nodes: [
      { id: "redCollect", name: "🔺수집", icon: "🔺", desc: "보상시 🔺카드 1장 보장", cost: 4, max: 1 },
      { id: "awaken", name: "각성", icon: "🌑", desc: "시작시 그림자 x1", cost: 10, max: 1 },
      { id: "stealth", name: "은신", icon: "🌫️", desc: "기본 회피 +7%", cost: 3, max: 2 },
      { id: "shadowBurst", name: "그림자폭발", icon: "🌑", desc: "스택당 배율 +0.5→+0.8", cost: 8, max: 1 },
    ],
  },
  {
    id: "ranger_blue", name: "연계", icon: "🔷", classId: "ranger", color: "#4e79a7",
    nodes: [
      { id: "blueCollect", name: "🔷수집", icon: "🔷", desc: "보상시 🔷카드 1장 보장", cost: 4, max: 1 },
      { id: "deft", name: "손재주", icon: "👋", desc: "시작 드로우 +1", cost: 5, max: 1 },
      { id: "nimble", name: "기민함", icon: "🧤", desc: "버리기 +1", cost: 4, max: 1 },
      { id: "chainBoost", name: "연쇄강화", icon: "🔗", desc: "🔷2장+ 제출시 드로우+2", cost: 7, max: 1 },
    ],
  },
  {
    id: "ranger_yellow", name: "급소", icon: "⭐", classId: "ranger", color: "#f0b930",
    nodes: [
      { id: "yellowCollect", name: "⭐수집", icon: "⭐", desc: "보상시 ⭐카드 1장 보장", cost: 4, max: 1 },
      { id: "critMastery", name: "급소숙련", icon: "🗡️", desc: "치명타 +10%", cost: 3, max: 2 },
      { id: "quickStrike", name: "속전속결", icon: "⚡", desc: "첫턴 치명타 2배", cost: 6, max: 1 },
      { id: "critDamage", name: "치명타격", icon: "💥", desc: "치명 x1.5→x2.0", cost: 8, max: 1 },
    ],
  },
];

const ULTIMATE_SKILL = {
  id: "fatedDice", name: "운명의 주사위", icon: "🎲",
  desc: "제출마다 주사위! 데미지 배율 33% x0.5 / 33% x1.5 / 33% x3",
  unlockCost: 40,
};

const NODE_TYPES = {
  battle:   { icon: "⚔️", name: "전투" },
  elite:    { icon: "💪", name: "정예" },
  campfire: { icon: "🔥", name: "캠프" },
  shop:     { icon: "🏪", name: "상점" },
  event:    { icon: "❓", name: "이벤트" },
  boss:     { icon: "👑", name: "보스" },
};

const MAP_ROWS = 7; // row0(시작) + row1~5(선택) + row6(보스)

const MAP_EVENTS = [
  { id: "chest", name: "보물 상자", icon: "🎁",
    desc: "보물 상자를 발견했다!", effect: "gold", val: 15 },
  { id: "shrine", name: "기도의 제단", icon: "⛪",
    desc: "제단에 기도를 올렸다.", effect: "heal", val: 15 },
  { id: "gambler", name: "도박꾼", icon: "🎰",
    desc: "도박꾼이 내기를 제안한다. 15G를 걸겠는가?", effect: "gamble", cost: 15, winGold: 40 },
  { id: "blacksmith", name: "떠돌이 대장장이", icon: "🔨",
    desc: "카드 1장을 무료로 강화해준다.", effect: "enhance" },
  { id: "cursed", name: "저주받은 샘", icon: "🪦",
    desc: "HP -5, 하지만 무작위 카드 등급 +2", effect: "cursedWell", hpCost: 5, gradeBonus: 2 },
  { id: "wanderer", name: "방랑자", icon: "🧙",
    desc: "수상한 방랑자가 유물을 제안한다.", effect: "relicOffer" },
];

const SUIT_ORDER = { red: 0, blue: 1, yellow: 2 };

const CAMP_HEAL = 10;
const CAMP_REST_HEAL = 5;
const BURN_DAMAGE = 3;

const BOSS_POINTS = { 9: 1, 19: 2, 29: 3, 39: 4, 49: 6 }; // monster index (0-based) → points

const HAND_RANKINGS = [
  { emoji: "🌟", name: "스트레이트 플러시", mult: "x12", desc: "같은 문양 연속 3장+", tier: 5 },
  { emoji: "👑", name: "퍼펙트 포카", mult: "x9", desc: "같은 문양+등급 4장", tier: 4 },
  { emoji: "👑", name: "포카", mult: "x8", desc: "같은 등급 4장", tier: 4 },
  { emoji: "⛓️", name: "스트레이트5", mult: "x8", desc: "연속 등급 5장", tier: 4 },
  { emoji: "🏠", name: "풀하우스", mult: "x6", desc: "트리플 + 페어", tier: 4 },
  { emoji: "🔗", name: "스트레이트4", mult: "x6", desc: "연속 등급 4장", tier: 4 },
  { emoji: "💎", name: "플러시", mult: "x5", desc: "같은 문양 5장", tier: 3 },
  { emoji: "🔺", name: "퍼펙트 트리플", mult: "x4.5", desc: "같은 문양+등급 3장", tier: 3 },
  { emoji: "🔺", name: "트리플", mult: "x4", desc: "같은 등급 3장", tier: 3 },
  { emoji: "🔗", name: "스트레이트3", mult: "x4", desc: "연속 등급 3장", tier: 3 },
  { emoji: "✌️", name: "투페어", mult: "x3", desc: "페어 2개", tier: 2 },
  { emoji: "👯", name: "원페어", mult: "x2", desc: "같은 등급 2장", tier: 2 },
  { emoji: "👊", name: "하이카드", mult: "x1", desc: "조합 없음", tier: 1 },
];

export { SUITS, CLASSES, COMMONS, REWARD_COMMONS, MONSTERS, CAMPFIRE_EVENTS, RELICS, FLOOR_NAMES, BOSS_DIALOGUES, KEYWORDS, SKILL_TREES, ULTIMATE_SKILL, BOSS_POINTS, HAND_RANKINGS, SUIT_ORDER, CAMP_HEAL, CAMP_REST_HEAL, BURN_DAMAGE, NODE_TYPES, MAP_ROWS, MAP_EVENTS };
