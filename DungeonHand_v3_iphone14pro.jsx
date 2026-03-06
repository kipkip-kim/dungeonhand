import { useState, useRef } from "react";

// === AUDIO (File-based) ===
const sfx = (() => {
  const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let isOn = false;
  let currentBgm = null;
  let currentBgmType = null;
  let iosUnlocked = false;

  // --- iOS Audio Unlock ---
  function unlockIOS() {
    if (iosUnlocked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      ctx.resume();
      iosUnlocked = true;
    } catch (e) { /* silent */ }
  }

  // --- SFX preload ---
  const sfxNames = ["click", "card", "hit", "dmg", "enemy", "win", "lose", "gold", "heal"];
  const sounds = {};
  const sfxVolume = { click: 0.3, card: 0.3, win: 0.75, heal: 0.5 };
  sfxNames.forEach(function (name) {
    const a = new Audio();
    a.preload = "auto";
    a.src = BASE + "/audio/sfx/" + name + ".ogg";
    if (sfxVolume[name]) a.volume = sfxVolume[name];
    sounds[name] = a;
  });

  function playSfx(name) {
    if (!isOn) return;
    try {
      var a = sounds[name];
      if (!a) return;
      // Reset to start for rapid re-trigger
      a.currentTime = 0;
      a.play().catch(function () {});
    } catch (e) { /* silent */ }
  }

  // --- BGM ---
  const bgmCache = {};

  function getBgm(type) {
    if (!bgmCache[type]) {
      var a = new Audio();
      a.preload = "auto";
      a.loop = true;
      a.volume = 0.3;
      a.src = BASE + "/audio/bgm/" + type + ".ogg";
      bgmCache[type] = a;
    }
    return bgmCache[type];
  }

  return {
    getOn: function () { return isOn; },
    toggle: function () {
      isOn = !isOn;
      if (isOn) {
        unlockIOS();
        sfx.bgmOn(currentBgmType || "home");
      } else {
        sfx.bgmOff();
      }
      return isOn;
    },
    bgmOn: function (type) {
      sfx.bgmOff();
      var t = type || "battle";
      currentBgmType = t;
      if (!isOn) return;
      try {
        var a = getBgm(t);
        currentBgm = a;
        a.currentTime = 0;
        a.play().catch(function () {});
      } catch (e) { /* silent */ }
    },
    bgmOff: function () {
      if (currentBgm) {
        try {
          currentBgm.pause();
          currentBgm.currentTime = 0;
        } catch (e) { /* silent */ }
        currentBgm = null;
      }
    },
    click: function () { playSfx("click"); },
    card: function () { playSfx("card"); },
    hit: function (/* tier */) { playSfx("hit"); },
    dmg: function () { playSfx("dmg"); },
    enemy: function () { playSfx("enemy"); },
    win: function () { playSfx("win"); },
    lose: function () { playSfx("lose"); },
    gold: function () { playSfx("gold"); },
    heal: function () { playSfx("heal"); },
  };
})();

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
  // Floor 1: 고블린 소굴 (indices 0-3) — x1.3 적용
  { name: "고블린", emoji: "👺", img: "goblin", hp: 36, atk: 6 },
  { name: "고블린 궁수", emoji: "🏹", img: "goblin_archer", hp: 50, atk: 8 },
  { name: "고블린 대장", emoji: "💪", img: "goblin_chief", hp: 72, atk: 9, miniboss: true },
  { name: "고블린 킹", emoji: "👑", img: "goblin_king", hp: 94, atk: 11, boss: true },
  // Floor 2: 언데드 묘지 (indices 4-7)
  { name: "해골 병사", emoji: "💀", img: "skeleton", hp: 59, atk: 7 },
  { name: "뱀파이어", emoji: "🧛", img: "vampire", hp: 72, atk: 9 },
  { name: "망령 기사", emoji: "⚔️", img: "wraith", hp: 91, atk: 10, miniboss: true },
  { name: "리치", emoji: "☠️", img: "lich", hp: 124, atk: 12, boss: true },
  // Floor 3: 마법 탑 (indices 8-11)
  { name: "골렘", emoji: "🗿", img: "golem", hp: 72, atk: 8, freeze: 1 },
  { name: "마녀", emoji: "🧙‍♀️", img: "witch", hp: 85, atk: 10, freeze: 2 },
  { name: "불꽃 정령", emoji: "🔥", img: "fire_elemental", hp: 104, atk: 11, miniboss: true, freeze: 1 },
  { name: "대마법사", emoji: "🌀", img: "archmage", hp: 143, atk: 13, boss: true, freeze: 2, split: true },
  // Floor 4: 심연 (indices 12-15)
  { name: "그림자 포식자", emoji: "🌑", img: "shadow", hp: 78, atk: 9 },
  { name: "심연의 눈", emoji: "👁️", img: "abyss_eye", hp: 98, atk: 11, erode: 1 },
  { name: "공허의 사도", emoji: "🕳️", img: "void_apostle", hp: 124, atk: 12, miniboss: true, erode: 2 },
  { name: "심연의 군주", emoji: "👿", img: "abyss_lord", hp: 176, atk: 15, boss: true, erode: 2 },
  // Floor 5: 드래곤 둥지 (indices 16-19)
  { name: "드래곤 알지기", emoji: "🥚", img: "dragon_keeper", hp: 117, atk: 12 },
  { name: "드래곤 새끼", emoji: "🐉", img: "dragon_young", hp: 143, atk: 14, burn: 1 },
  { name: "드래곤 근위병", emoji: "🛡️", img: "dragon_guard", hp: 182, atk: 16, miniboss: true, burn: 1 },
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
  { id: "thorn", name: "가시 갑옷", emoji: "🦔", desc: "피격 시 적에게 3 반사", tier: 1, eff: { type: "thorns", val: 3 }, classId: null },
  { id: "ruby", name: "루비 반지", emoji: "💍", desc: "🔺카드 공격력 x2", tier: 2, eff: { type: "suitMul", suit: "red", val: 2 }, classId: null },
  { id: "chain", name: "연쇄의 고리", emoji: "⛓️", desc: "스트레이트 배율 +2", tier: 2, eff: { type: "handAdd", hand: "스트레이트", val: 2 }, classId: null },
  { id: "eye", name: "감정사의 눈", emoji: "👁️", desc: "등급5↑ 카드 1장당 배율 +2", tier: 2, eff: { type: "gradeAdd", grade: 5, val: 2 }, classId: null },
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
const KEYWORDS = [
  { id: "poison", icon: "☠️", name: "맹독", desc: "등급만큼 매턴 독 데미지" },
  { id: "chain", icon: "⛓️", name: "연쇄", desc: "제출 시 드로우 +1" },
  { id: "growth", icon: "🌱", name: "성장", desc: "제출마다 등급 영구 +1" },
  { id: "resonance", icon: "🔔", name: "공명", desc: "같은 문양 2장+ 시 배율 +0.5" },
];

const SKILL_TREES = [
  {
    id: "common", name: "공통", icon: "⚔️", classId: null, color: "#888",
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
    id: "ranger_red", name: "습격", icon: "🔺", classId: "ranger", color: "#e64b35",
    nodes: [
      { id: "redCollect", name: "🔺수집", icon: "🔺", desc: "보상시 🔺카드 1장 보장", cost: 4, max: 1 },
      { id: "awaken", name: "각성", icon: "🌑", desc: "시작시 그림자 x1", cost: 10, max: 1 },
      { id: "stealth", name: "은신", icon: "🌫️", desc: "기본 회피 +5%", cost: 3, max: 2 },
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

const SUIT_ORDER = { red: 0, blue: 1, yellow: 2 };

const CAMP_HEAL = 10;
const CAMP_REST_HEAL = 5;
const BURN_DAMAGE = 3;

const BOSS_POINTS = { 3: 1, 7: 2, 11: 3, 15: 4, 19: 6 }; // monster index (0-based) → points

const SCREEN_BG = {
  menu: "images/bg/menu.png",
  village: "images/bg/village.png",
  shop: "images/bg/shop.png",
};

function getBattleBg(floor, battleNum) {
  var f = Math.max(1, Math.min(5, floor || 1));
  var prefix = battleNum === 5 ? "bossbattle" : "battle";
  return "images/bg/" + prefix + "0" + f + ".png";
}

function getCampfireBg(floor) {
  var f = Math.max(1, Math.min(5, floor || 1));
  return "images/bg/campfire0" + f + ".png";
}


// === UTILS ===
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN(arr, n) {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

let nextId = 0;
function getNextId() { return nextId++; }
function makeCard(suitId, grade, classId, common, keyword) {
  const suit = SUITS.find(function(s) { return s.id === suitId; });
  return {
    id: nextId++,
    suitId: suitId,
    grade: grade,
    classId: classId,
    common: common || null,
    keyword: keyword || null,
    suitEmoji: suit.emoji,
    suitColor: suit.color,
    isCommon: !!common,
    enhanceCount: 0,
    growthBonus: 0,
  };
}

function makeDeck(classId) {
  nextId = 0;
  var cards = [];
  SUITS.forEach(function(s) {
    [1, 1, 2, 2, 3].forEach(function(g) {
      cards.push(makeCard(s.id, g, classId));
    });
  });
  // Common cards have no suit (use first suit as placeholder for rendering)
  COMMONS.forEach(function(cm) {
    cards.push(makeCard("red", 1, classId, cm));
  });
  return shuffle(cards);
}

function getCardName(card, classData) {
  if (card.isCommon) return card.common.name;
  return classData.suits[card.suitId];
}

function detectHand(cards) {
  var len = cards.length;
  if (len === 0) return null;
  if (len === 1) return { name: "하이카드", mult: 1, tier: 1, emoji: "👊" };

  // Use effective grade (grade + growthBonus) for hand detection
  var grades = cards.map(function(c) { return c.grade + (c.growthBonus || 0); }).sort(function(a, b) { return a - b; });
  // Common cards have NO suit for flush/SF purposes
  var suits = cards.map(function(c) {
    if (c.isCommon) return "none";
    return c.suitId;
  });

  var gradeCounts = {};
  grades.forEach(function(g) { gradeCounts[g] = (gradeCounts[g] || 0) + 1; });
  var counts = Object.values(gradeCounts).sort(function(a, b) { return b - a; });

  // Perfect: same suit + same grade (class cards only)
  var perfectCounts = {};
  cards.forEach(function(c) {
    if (!c.isCommon) {
      var key = c.suitId + "_" + (c.grade + (c.growthBonus || 0));
      perfectCounts[key] = (perfectCounts[key] || 0) + 1;
    }
  });
  var maxPerfect = 0;
  Object.values(perfectCounts).forEach(function(v) { if (v > maxPerfect) maxPerfect = v; });

  // Flush: ALL 5 cards must be same suit. Common cards (suit "none") break flush.
  var suitCards = suits.filter(function(s) { return s !== "none"; });
  var isFlush = len === 5 && suitCards.length === 5 && new Set(suitCards).size <= 1;

  var uniqueGrades = Array.from(new Set(grades)).sort(function(a, b) { return a - b; });

  function hasConsecutive(n) {
    if (uniqueGrades.length < n) return false;
    for (var i = 0; i <= uniqueGrades.length - n; i++) {
      if (uniqueGrades[i + n - 1] - uniqueGrades[i] === n - 1) return true;
    }
    return false;
  }

  function checkStraightFlush() {
    if (len < 3) return false;
    var classCards = cards.filter(function(c) { return !c.isCommon; });
    if (classCards.length < 3) return false;
    var suitGroups = {};
    classCards.forEach(function(c) {
      if (!suitGroups[c.suitId]) suitGroups[c.suitId] = [];
      suitGroups[c.suitId].push(c.grade + (c.growthBonus || 0));
    });
    var found = false;
    Object.values(suitGroups).forEach(function(gradeArr) {
      var all = Array.from(new Set(gradeArr)).sort(function(a, b) { return a - b; });
      if (all.length >= 3) {
        for (var i = 0; i <= all.length - 3; i++) {
          if (all[i + 2] - all[i] === 2) found = true;
        }
      }
    });
    return found;
  }

  if (checkStraightFlush()) return { name: "스트레이트 플러시", mult: 12, tier: 5, emoji: "🌟" };
  if (maxPerfect >= 4) return { name: "퍼펙트 포카", mult: 9, tier: 4, emoji: "👑" };
  if (counts[0] >= 4) return { name: "포카", mult: 8, tier: 4, emoji: "👑" };
  if (len === 5 && uniqueGrades.length === 5 && hasConsecutive(5)) return { name: "스트레이트5", mult: 8, tier: 4, emoji: "⛓️" };
  if (counts[0] === 3 && counts[1] >= 2) return { name: "풀하우스", mult: 6, tier: 4, emoji: "🏠" };
  if (len >= 4 && hasConsecutive(4)) return { name: "스트레이트4", mult: 6, tier: 4, emoji: "🔗" };
  if (isFlush) return { name: "플러시", mult: 5, tier: 3, emoji: "💎" };
  if (maxPerfect >= 3) return { name: "퍼펙트 트리플", mult: 4.5, tier: 3, emoji: "🔺" };
  if (counts[0] >= 3) return { name: "트리플", mult: 4, tier: 3, emoji: "🔺" };
  if (len >= 3 && hasConsecutive(3)) return { name: "스트레이트3", mult: 4, tier: 3, emoji: "🔗" };
  if (counts[0] >= 2 && counts[1] >= 2) return { name: "투페어", mult: 3, tier: 2, emoji: "✌️" };
  if (counts[0] >= 2) return { name: "원페어", mult: 2, tier: 2, emoji: "👯" };
  return { name: "하이카드", mult: 1, tier: 1, emoji: "👊" };
}

function calcDamage(cards, hand, relics, pState, classDef, isPreview) {
  var atk = 0;
  var extraDraw = 0;
  var hasGrowth = false;
  var suitBonuses = { red: 0, blue: 0, yellow: 0 };
  var dmgReduction = 0;
  var passive = classDef.passive;

  cards.forEach(function(c) {
    var a = c.grade + (c.growthBonus || 0);

    // === Class-specific suit bonuses (via passive hook) ===
    if (!c.isCommon) {
      suitBonuses[c.suitId] = (suitBonuses[c.suitId] || 0) + 1;
      var cb = passive.cardBonus(c.suitId);
      a += cb.atk;
      dmgReduction += cb.defReduce;
    }

    relics.forEach(function(r) {
      if (r.eff.type === "atk") a += r.eff.val;
      if (r.eff.type === "suitMul" && c.suitId === r.eff.suit) a *= r.eff.val;
    });
    atk += a;

    // Keyword effects
    if (c.keyword) {
      if (c.keyword.id === "chain") extraDraw += 1;
      if (c.keyword.id === "growth") hasGrowth = true;
    }
  });

  var mult = hand.mult;

  // === Passive: calcBonus (evasion, crit, extraDraw) ===
  var stealthBonus = pState ? (pState.stealthBonus || 0) : 0;
  var bonus = passive.calcBonus(pState || { stacks: 0 }, suitBonuses, stealthBonus);
  var evasionChance = bonus.evasion;
  var critChance = bonus.crit;
  if (bonus.extraDraw) extraDraw += bonus.extraDraw;

  // === Check if 1+ red class card submitted (for shadow stacking) ===
  var hasRed = cards.some(function(c) { return !c.isCommon && c.suitId === "red" && !c.burning; });

  // Common card: focus
  cards.forEach(function(c) {
    if (c.isCommon && c.common.fx === "focus") mult += 0.5;
  });
  // Common card: glass
  cards.forEach(function(c) {
    if (c.isCommon && c.common.fx === "glass") mult *= 1.5;
  });
  // Keyword: resonance
  cards.forEach(function(c) {
    if (c.keyword && c.keyword.id === "resonance") {
      var sameSuit = cards.filter(function(x) { return x.suitId === c.suitId; }).length;
      if (sameSuit >= 2) mult += 0.5;
    }
  });
  // Relic effects
  var relicTriggers = [];
  relics.forEach(function(r) {
    if (r.eff.type === "handAdd" && hand.name.indexOf(r.eff.hand) >= 0) {
      mult += r.eff.val;
      relicTriggers.push(r.emoji + " " + r.name + " 배율+" + r.eff.val);
    }
    if (r.eff.type === "handMul" && hand.name.indexOf(r.eff.hand) >= 0) {
      mult *= r.eff.val;
      relicTriggers.push(r.emoji + " " + r.name + " 배율x" + r.eff.val + "!");
    }
    if (r.eff.type === "gradeAdd") {
      var cnt = 0;
      cards.forEach(function(c) { if (c.grade + (c.growthBonus || 0) >= r.eff.grade) { mult += r.eff.val; cnt++; } });
      if (cnt > 0) relicTriggers.push(r.emoji + " " + r.name + " " + cnt + "장 배율+" + (cnt * r.eff.val));
    }
  });

  // === Passive: apply mult bonus ===
  mult = passive.applyMult(mult, pState || { stacks: 0 });

  // === Gamble relic buff ===
  if (pState && pState.gambleBuff) {
    mult += pState.gambleBuff;
  }

  // 급소숙련: +10% per level
  if (pState && pState.critMastery) critChance = Math.min(90, critChance + pState.critMastery * 10);
  // 속전속결: 첫턴 치명타 2배
  if (pState && pState.quickStrike && pState.roundNum === 1) critChance = Math.min(90, critChance * 2);

  // 운명의 주사위: 1d6 배율
  var fatedRoll = 0;
  var fatedMult = 1;
  if (pState && pState.fatedDice && !isPreview) {
    fatedRoll = Math.floor(Math.random() * 6) + 1;
    if (fatedRoll <= 2) fatedMult = 0.5;
    else if (fatedRoll <= 4) fatedMult = 1.5;
    else fatedMult = 3.0;
    mult *= fatedMult;
  }

  var isCrit = !isPreview && critChance > 0 && Math.random() * 100 < critChance;
  var critMult = (pState && pState.critDamage) ? 2.0 : 1.5;
  var finalTotal = Math.floor(atk * mult);
  if (isCrit) finalTotal = Math.floor(finalTotal * critMult);

  return {
    atk: Math.round(atk),
    mult: Math.round(mult * 10) / 10,
    total: finalTotal,
    isCrit: isCrit,
    critChance: critChance,
    extraDraw: extraDraw,
    hasGrowth: hasGrowth,
    relicTriggers: relicTriggers,
    suitBonuses: suitBonuses,
    dmgReduction: dmgReduction,
    evasionChance: evasionChance,
    hasRed: hasRed,
    fatedRoll: fatedRoll,
    fatedMult: fatedMult,
  };
}

// === STYLES ===
var CSS = [
  "*{margin:0;padding:0;box-sizing:border-box}",
  "body{background:#0a0808;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100vh}",
  ":root{--gw:min(100vw,calc(100vh * 9 / 16),960px);--bg:#0f0c08;--pn:#1a1510;--cd:#231e14;--bd:#3a3025;--tx:#f0e8d8;--dm:#8a7e6b;--gd:#e8a820;--rd:#c0392b;--gn:#2d9b4e;--bl:#4a8cc7;--ac:#9b59b6;--pu:#7d3c98;--or:#d35400;--fr:#5dade2;--bn:#e6a598;--er:#a88ec4;--wn:#c87f0a;--cr:#f0b930;--sb:#d5cfc0;--burn-bg:#5c1a0e;--burn-dark:#3a0e06;--burn-bd:#6b1a0e;--cm-bg:#3a2a1844;--cm-dark:#1a1408;--cm-tx:#c4b098;--btn-off:#1a1810;--card-dark:#14120e;--fs-xl:clamp(18px,calc(var(--gw) * 0.036),28px);--fs-lg:clamp(15px,calc(var(--gw) * 0.03),24px);--fs-md:clamp(13px,calc(var(--gw) * 0.026),20px);--fs-sm:clamp(12px,calc(var(--gw) * 0.024),18px)}",
  "@keyframes popIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}",
  "@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes shake{0%,100%{transform:translateX(0) rotate(0)}10%{transform:translateX(-8px) rotate(-2deg)}30%{transform:translateX(10px) rotate(2deg)}50%{transform:translateX(-10px) rotate(-1deg)}70%{transform:translateX(8px) rotate(1deg)}90%{transform:translateX(-4px) rotate(0)}}",
  "@keyframes shakeHard{0%,100%{transform:translateX(0) translateY(0) rotate(0)}10%{transform:translateX(-14px) translateY(-12px) rotate(-4deg)}30%{transform:translateX(16px) translateY(-8px) rotate(3deg)}50%{transform:translateX(-16px) translateY(-4px) rotate(-3deg)}70%{transform:translateX(12px) translateY(-2px) rotate(2deg)}90%{transform:translateX(-6px) translateY(0) rotate(-1deg)}}",
  "@keyframes dmgPop{0%{opacity:0;transform:scale(0) rotate(-10deg)}40%{transform:scale(1.5) rotate(3deg)}70%{transform:scale(0.9)}100%{opacity:1;transform:scale(1) rotate(0)}}",
  "@keyframes multIn{0%{opacity:0;transform:scale(2)}100%{opacity:1;transform:scale(1)}}",
  "@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}",
  "@keyframes enemyAtk{0%{transform:translateY(0) scale(1)}20%{transform:translateY(-12px) scale(1.08)}50%{transform:translateY(30px) scale(1.12)}70%{transform:translateY(30px) scale(1.12)}100%{transform:translateY(0) scale(1)}}",
  "@keyframes playerHit{0%{opacity:1;transform:scale(1)}15%{opacity:.2;transform:scale(0.92) translateX(-8px)}30%{opacity:1;transform:scale(1.05)}50%{opacity:.3;transform:scale(0.95) translateX(6px)}70%{opacity:1;transform:scale(1.02)}85%{opacity:.4}100%{opacity:1;transform:scale(1)}}",
  "@keyframes intentPulse{0%,100%{opacity:.6}50%{opacity:1}}",
  "@keyframes victBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}",
  "@keyframes passivePop{0%{opacity:0;transform:translateY(10px) scale(0.8)}20%{opacity:1;transform:translateY(-5px) scale(1.1)}100%{opacity:1;transform:translateY(0) scale(1)}}",
  "@keyframes passiveFade{0%{opacity:1}70%{opacity:1}100%{opacity:0}}",
  "@keyframes cardDraw{0%{opacity:0;transform:translateY(40px) scale(0.7) rotate(-8deg)}50%{opacity:1;transform:translateY(-6px) scale(1.05) rotate(2deg)}100%{opacity:1;transform:translateY(0) scale(1) rotate(0deg)}}",
  "@keyframes dmgFloat{0%{opacity:1;transform:translateY(0) scale(1.2)}100%{opacity:0;transform:translateY(-40px) scale(0.8)}}",
  "@keyframes screenFlash{0%{opacity:0.5}100%{opacity:0}}",
  "@keyframes critPulse{0%{box-shadow:0 0 0px #ef4444}50%{box-shadow:0 0 30px #ef444488}100%{box-shadow:0 0 0px #ef4444}}",
  "@keyframes critFlash{0%{opacity:0}10%{opacity:0.6}20%{opacity:0}35%{opacity:0.4}50%{opacity:0}100%{opacity:0}}",
  "@keyframes critBurst{0%{transform:scale(0.5) rotate(-15deg);opacity:0}30%{transform:scale(1.8) rotate(5deg);opacity:1}50%{transform:scale(0.9) rotate(-2deg)}70%{transform:scale(1.3) rotate(1deg)}100%{transform:scale(1) rotate(0);opacity:1}}",
  "@keyframes critShine{0%{background-position:-200% 0}100%{background-position:200% 0}}",
  "@keyframes missFlash{0%{opacity:0}15%{opacity:0.4}30%{opacity:0}100%{opacity:0}}",
  "@keyframes missBounce{0%{transform:translateX(-50%) scale(0) rotate(-20deg)}25%{transform:translateX(-50%) scale(2.2) rotate(8deg)}45%{transform:translateX(-50%) scale(0.7) rotate(-3deg)}65%{transform:translateX(-50%) scale(1.4) rotate(2deg)}100%{transform:translateX(-50%) scale(1) rotate(0)}}",
  "@keyframes encounterIn{0%{opacity:0;transform:scale(0.3)}30%{opacity:1;transform:scale(1.1)}50%{transform:scale(0.95)}100%{transform:scale(1)}}",
  ".btn-base{border-bottom:3px solid rgba(0,0,0,0.35);transition:transform 0.08s,border-bottom 0.08s,box-shadow 0.08s}",
  ".btn-base:hover:not(:disabled){filter:brightness(1.15)}",
  ".btn-base:active{transform:translateY(2px)!important;border-bottom:1px solid rgba(0,0,0,0.2)!important;box-shadow:none!important}",
].join("\n");


// === COMPONENTS ===
function CardView(props) {
  const c = props.card;
  const cls = props.cls;
  const selected = props.selected;
  const small = props.small;
  const disabled = props.disabled;
  const onClick = props.onClick;

  // Burn card special render
  if (c.burning) {
    const bw = small ? "clamp(55px, calc(var(--gw) * 0.11), 100px)" : "clamp(70px, calc(var(--gw) * 0.14), 130px)";
    const bh = small ? "clamp(77px, calc(var(--gw) * 0.154), 140px)" : "clamp(98px, calc(var(--gw) * 0.196), 182px)";
    return (
      <div
        onClick={disabled ? undefined : onClick}
        style={{
          width: bw, height: bh,
          background: "linear-gradient(145deg, var(--burn-bg), var(--burn-dark))",
          border: "2px solid " + (selected ? "var(--rd)" : "var(--burn-bd)"),
          borderRadius: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
          cursor: disabled ? "default" : "pointer",
          transform: selected ? "translateY(-12px) scale(1.04)" : "none",
          transition: "transform 0.12s ease, box-shadow 0.12s ease",
          boxShadow: selected ? "0 4px 16px #c0392b44, 0 0 0 1px #c0392b66, inset 0 1px 0 rgba(255,255,255,0.06)" : "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ fontSize: "clamp(" + (small ? "20px, calc(var(--gw) * 0.04), 36px)" : "24px, calc(var(--gw) * 0.048), 44px)") }}>🔥</span>
        <span style={{ fontSize: "clamp(" + (small ? "9px, calc(var(--gw) * 0.018), 16px)" : "11px, calc(var(--gw) * 0.022), 20px)"), color: "var(--bn)", fontWeight: 700 }}>화상</span>
        <span style={{ fontSize: "clamp(" + (small ? "8px, calc(var(--gw) * 0.016), 14px)" : "10px, calc(var(--gw) * 0.02), 18px)"), color: "var(--rd)" }}>{"제출시 -" + BURN_DAMAGE + "HP"}</span>
      </div>
    );
  }

  const nm = getCardName(c, cls);
  const w = small ? "clamp(55px, calc(var(--gw) * 0.11), 100px)" : "clamp(70px, calc(var(--gw) * 0.14), 130px)";
  const h = small ? "clamp(77px, calc(var(--gw) * 0.154), 140px)" : "clamp(98px, calc(var(--gw) * 0.196), 182px)";

  // Common cards get distinct styling
  const isC = c.isCommon;
  const commonBg = isC
    ? (selected ? "linear-gradient(145deg,var(--cm-bg),var(--cm-dark))" : "linear-gradient(145deg,#2a2010,#14100a)")
    : (selected ? "linear-gradient(145deg," + c.suitColor + "22," + c.suitColor + "11)" : "linear-gradient(145deg,var(--cd),var(--card-dark))");

  const borderColor = c.keyword ? "var(--ac)" : isC ? "var(--pu)" : (selected ? c.suitColor : "var(--bd)");
  const transform = selected ? "translateY(-12px) scale(1.04)" : "none";
  const sColor = isC ? "var(--ac)" : c.suitColor;
  const shadow = selected
    ? "0 4px 16px " + sColor + "44, 0 0 0 1px " + sColor + "66, inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)";

  // Effect descriptions for common cards
  let fxText = "";
  if (isC) {
    fxText = c.common.fx === "reclaim" ? "회수" + (c.grade + (c.growthBonus || 0)) + "장" : (c.common.desc || "");
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: w,
        height: h,
        background: commonBg,
        border: "2px solid " + borderColor,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(" + (small ? "2px, calc(var(--gw) * 0.004), 4px)" : "4px, calc(var(--gw) * 0.008), 7px)"),
        cursor: disabled ? "default" : "pointer",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
        transform: transform,
        WebkitTapHighlightColor: "transparent",
        boxShadow: c.keyword ? "0 0 10px #9b59b633, " + shadow : shadow,
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Common badge */}
      {isC && (
        <div style={{
          position: "absolute",
          top: small ? 2 : 4,
          left: small ? 3 : 5,
          fontSize: "clamp(" + (small ? "8px, calc(var(--gw) * 0.016), 14px)" : "10px, calc(var(--gw) * 0.02), 18px)"),
          color: "var(--er)",
          fontWeight: 700,
          letterSpacing: 1,
        }}>
          중립
        </div>
      )}
      {/* Keyword badge */}
      {c.keyword && (
        <div style={{
          position: "absolute",
          top: small ? 2 : 4,
          right: small ? 3 : 5,
          fontSize: "clamp(" + (small ? "10px, calc(var(--gw) * 0.02), 18px)" : "13px, calc(var(--gw) * 0.026), 24px)"),
        }} title={c.keyword.name + ": " + c.keyword.desc}>
          {c.keyword.icon}
        </div>
      )}
      <span style={{ fontSize: "clamp(" + (small ? "14px, calc(var(--gw) * 0.028), 26px)" : "18px, calc(var(--gw) * 0.036), 33px)") }}>{isC ? c.common.icon : c.suitEmoji}</span>
      <span style={{
        fontSize: "clamp(" + (small ? "20px, calc(var(--gw) * 0.04), 36px)" : "28px, calc(var(--gw) * 0.056), 52px)"),
        fontWeight: 900,
        fontFamily: "'Silkscreen', cursive",
        color: isC ? "var(--cm-tx)" : c.suitColor,
        lineHeight: 1,
      }}>
        {c.grade + (c.growthBonus || 0)}{(c.enhanceCount || 0) >= 2 ? "⬆⬆" : (c.enhanceCount || 0) >= 1 ? "⬆" : ""}
      </span>
      <span style={{
        fontSize: "clamp(" + (small ? "8px, calc(var(--gw) * 0.016), 14px)" : "10px, calc(var(--gw) * 0.02), 18px)"),
        color: isC ? "var(--cm-tx)" : "var(--dm)",
        fontWeight: 700,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {nm}
      </span>
      {/* Effect text for common cards */}
      {isC && (
        <span style={{
          fontSize: "clamp(" + (small ? "8px, calc(var(--gw) * 0.016), 14px)" : "10px, calc(var(--gw) * 0.02), 18px)"),
          color: "var(--dm)",
          fontFamily: "'Noto Sans KR', sans-serif",
          background: "#ffffff08",
          borderRadius: 4,
          padding: "1px 5px",
        }}>
          {fxText}
        </span>
      )}
      {/* Suit indicator for common cards (small dot) */}
      {isC && (
        <span style={{ fontSize: "clamp(" + (small ? "8px, calc(var(--gw) * 0.016), 14px)" : "10px, calc(var(--gw) * 0.02), 18px)") }}>{c.suitEmoji}</span>
      )}
    </div>
  );
}

function HpBar(props) {
  const pct = Math.max(0, (props.current / props.max) * 100);
  const barColor = pct > 50 ? "var(--gn)" : pct > 25 ? "var(--wn)" : "var(--rd)";
  const anim = props.isPlayer ? (props.shaking ? (props.hardShake ? "shakeHard 0.6s ease" : "shake 0.4s ease") : "none") : "none";
  const barWidth = props.isPlayer ? "clamp(200px, calc(var(--gw) * 0.4), 380px)" : "clamp(240px, calc(var(--gw) * 0.48), 460px)";
  const barHeight = props.isPlayer ? "clamp(14px, calc(var(--gw) * 0.028), 24px)" : "clamp(16px, calc(var(--gw) * 0.032), 28px)";
  const emojiSize = props.isPlayer ? "clamp(32px, calc(var(--gw) * 0.064), 58px)" : "clamp(40px, calc(var(--gw) * 0.08), 72px)";
  const nameSize = props.boss ? "clamp(18px, calc(var(--gw) * 0.036), 32px)" : props.isPlayer ? "clamp(14px, calc(var(--gw) * 0.028), 24px)" : "clamp(16px, calc(var(--gw) * 0.032), 28px)";

  var txtShadow = "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)";
  return (
    <div style={{ textAlign: "center", animation: anim }}>
      <div style={{
        fontSize: nameSize,
        fontWeight: 700,
        marginBottom: 3,
        fontFamily: "'Noto Sans KR', sans-serif",
        textShadow: txtShadow,
      }}>
        {props.name}
        {props.boss && <span style={{ color: "var(--gd)", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 22px)", marginLeft: 4 }}>BOSS</span>}
        {props.miniboss && <span style={{ color: "var(--or)", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 22px)", marginLeft: 4 }}>엘리트</span>}
      </div>
      <div style={{
        width: barWidth,
        height: barHeight,
        background: "var(--cd)",
        borderRadius: 7,
        overflow: "hidden",
        margin: "0 auto",
        border: "1px solid var(--bd)",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          width: pct + "%",
          height: "100%",
          background: barColor,
          borderRadius: 7,
          transition: "width 0.5s ease",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)",
        }} />
      </div>
      <div style={{
        fontSize: "clamp(14px, calc(var(--gw) * 0.028), 24px)",
        color: "var(--dm)",
        marginTop: 2,
        fontFamily: "'Silkscreen', cursive",
        textShadow: txtShadow,
      }}>
        {Math.max(0, props.current)}/{props.max}
      </div>
      {props.isPlayer && (
        <div style={{
          fontSize: emojiSize,
          marginTop: 3,
        }}>
          {props.emoji}
        </div>
      )}
    </div>
  );
}

function Btn(props) {
  const isDisabled = props.disabled;
  const color = props.color || "var(--bd)";
  return (
    <button
      className="btn-base"
      onClick={isDisabled ? undefined : function(e) { sfx.click(); props.onClick(e); }}
      style={Object.assign({
        padding: "clamp(8px, calc(var(--gw) * 0.016), 14px) clamp(16px, calc(var(--gw) * 0.032), 28px)",
        background: isDisabled ? "var(--btn-off)" : color,
        border: "none",
        borderRadius: 10,
        color: "var(--tx)",
        fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)",
        fontWeight: 700,
        fontFamily: "'Noto Sans KR', sans-serif",
        cursor: isDisabled ? "default" : "pointer",
        opacity: isDisabled ? 0.3 : 1,
        boxShadow: isDisabled ? "none" : "0 3px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
      }, props.style || {})}
    >
      {props.children}
    </button>
  );
}

function DeckViewer(props) {
  const dk = props.deck;
  const cls = props.cls;
  const show = props.show;
  const onClose = props.onClose;
  const sortMode = props.sortMode;
  const onSort = props.onSort;

  if (!show) return null;

  const suitOrder = SUIT_ORDER;
  const sorted = dk.slice();

  if (sortMode === "grade") {
    sorted.sort(function(a, b) {
      const ga = a.grade + (a.growthBonus || 0);
      const gb = b.grade + (b.growthBonus || 0);
      if (gb !== ga) return gb - ga;
      return (suitOrder[a.suitId] || 0) - (suitOrder[b.suitId] || 0);
    });
  } else {
    // Sort by type: class cards grouped by suit, then common cards grouped by fx
    sorted.sort(function(a, b) {
      if (a.isCommon !== b.isCommon) return a.isCommon ? 1 : -1;
      if (!a.isCommon && !b.isCommon) {
        if (a.suitId !== b.suitId) return (suitOrder[a.suitId] || 0) - (suitOrder[b.suitId] || 0);
        return a.grade - b.grade;
      }
      if (a.isCommon && b.isCommon) {
        if (a.common.id !== b.common.id) return a.common.id.localeCompare(b.common.id);
        return a.grade - b.grade;
      }
      return 0;
    });
  }

  // Group cards for display
  const groups = [];
  let curGroup = null;
  sorted.forEach(function(c) {
    let key = "";
    let label = "";
    if (sortMode === "grade") {
      const g = c.grade + (c.growthBonus || 0);
      key = "g" + g;
      label = "등급 " + g;
    } else {
      if (c.isCommon) {
        key = "common-" + c.common.id;
        label = c.common.icon + " " + c.common.name;
      } else {
        key = "suit-" + c.suitId;
        const suit = SUITS.find(function(s) { return s.id === c.suitId; });
        label = suit.emoji + " " + cls.suits[c.suitId];
      }
    }
    if (!curGroup || curGroup.key !== key) {
      curGroup = { key: key, label: label, cards: [] };
      groups.push(curGroup);
    }
    curGroup.cards.push(c);
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--pn)", borderRadius: 14, padding: 22, maxWidth: 860, width: "94%", maxHeight: "85vh", overflow: "auto", border: "1px solid var(--bd)", boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 14 }}>📦 내 덱 ({dk.length}장)</h3>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={function() { onSort("type"); }}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "'Noto Sans KR', sans-serif",
                background: sortMode === "type" ? "var(--pu)" : "var(--bd)",
                color: "var(--tx)",
              }}
            >
              종류별
            </button>
            <button
              onClick={function() { onSort("grade"); }}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "'Noto Sans KR', sans-serif",
                background: sortMode === "grade" ? "var(--pu)" : "var(--bd)",
                color: "var(--tx)",
              }}
            >
              등급별
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map(function(grp) {
            return (
              <div key={grp.key}>
                <div style={{ fontSize: 13, color: "var(--dm)", fontWeight: 700, marginBottom: 6 }}>{grp.label} ({grp.cards.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {grp.cards.map(function(c) {
                    return <CardView key={c.id} card={c} cls={cls} small />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <Btn onClick={onClose}>닫기</Btn>
        </div>
      </div>
    </div>
  );
}

function relicBorderColor(tier) {
  return tier >= 3 ? "var(--gd)" : tier >= 2 ? "var(--ac)" : "var(--bd)";
}


// === RELIC SWAP OVERLAY ===
function PendingRelicOverlay({ game }) {
  var { wrapStyle, CSS, pendingRelic, relics, swapRelic, discardPendingRelic } = game;
  var prBorder = relicBorderColor(pendingRelic.tier);
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ background: "var(--cd)", border: "1px solid var(--bd)", borderRadius: 16, padding: 24, maxWidth: 340, width: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--rd)" }}>인벤토리가 가득 찼습니다!</div>
          <div style={{ fontSize: 13, color: "var(--dm)" }}>새 유물을 장착하려면 기존 유물 하나를 교체하세요</div>
          <div style={{ padding: 14, background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid " + prBorder, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: "80%" }}>
            <span style={{ fontSize: 28 }}>{pendingRelic.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{pendingRelic.name}</span>
            <span style={{ fontSize: 13, color: "var(--dm)", textAlign: "center" }}>{pendingRelic.desc}</span>
            <span style={{ fontSize: 11, color: "var(--gn)" }}>NEW</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>교체할 유물을 선택하세요:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {relics.map(function(r) {
              var bCol = relicBorderColor(r.tier);
              return (
                <div
                  key={r.id}
                  onClick={function() { swapRelic(r); }}
                  style={{ width: 90, padding: 10, background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid " + bCol, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 22 }}>{r.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: "var(--dm)", textAlign: "center" }}>{r.desc}</span>
                </div>
              );
            })}
          </div>
          <Btn onClick={discardPendingRelic} style={{ marginTop: 6, background: "#5c1a0e" }}>버리기 (영구 삭제)</Btn>
        </div>
      </div>
    </div>
  );
}

// === MENU SCREEN ===
function MenuScreen({ game }) {
  var { wrapStyle, CSS, audioButton, startRun, setScreen, metaPoints, sfx } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 48, animation: "popIn 0.5s ease" }}>🗡️</div>
        <h1 style={{ fontSize: "var(--fs-xl)", fontFamily: "'Silkscreen', cursive", background: "linear-gradient(135deg,#e8a820,#c0392b,#9b59b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textAlign: "center", lineHeight: 1.5 }}>
          DUNGEON HAND
        </h1>
        <p style={{ color: "var(--dm)", fontSize: "var(--fs-md)" }}>도적의 카드로 던전을 정복하라!</p>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Btn onClick={function() { if (CLASSES.length === 1) { startRun(CLASSES[0].id); } else { setScreen("classSelect"); } }} color="var(--rd)" style={{ fontSize: 14, padding: "14px 32px" }}>
            ⚔️ 던전 입장
          </Btn>
          <Btn onClick={function() { setScreen("village"); }} color="var(--gn)" style={{ fontSize: 14, padding: "14px 32px" }}>
            🌳 스킬 트리
          </Btn>
        </div>
        {metaPoints > 0 && (
          <div style={{ color: "var(--or)", fontSize: 14 }}>⭐ {metaPoints} 포인트 보유</div>
        )}
      </div>
    </div>
  );
}

// === CLASS SELECT SCREEN ===
function ClassSelectScreen({ game }) {
  var { wrapStyle, CSS, audioButton, startRun } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>직업을 선택하세요</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {CLASSES.map(function(c) {
            return (
              <div
                key={c.id}
                onClick={function() { startRun(c.id); }}
                style={{ width: "clamp(160px, calc(var(--gw) * 0.4), 240px)", background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid var(--bd)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", padding: "16px 12px" }}
              >
                <span style={{ fontSize: 42 }}>{c.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                <div style={{ fontSize: 14, color: "var(--ac)", textAlign: "center", lineHeight: 1.4 }}>
                  {c.passive.desc}
                </div>
                <div style={{ fontSize: 13, color: "var(--dm)", textAlign: "center", lineHeight: 1.6 }}>
                  {c.passive.suitDescs.join("  ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// === REWARD SCREEN ===
function RewardScreen({ game }) {
  var { wrapStyle, CSS, audioButton, rewardCards, classData, addCardToDeck, setScreen, skipReward, deck, deckView, setDeckView, deckSort, setDeckSort } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{ fontSize: 38, animation: "popIn 0.4s ease" }}>⚔️ 승리!</div>
        <h3 style={{ fontSize: "var(--fs-lg)" }}>보상 카드 선택</h3>
        <div style={{ display: "flex", gap: 10 }}>
          {rewardCards.map(function(c) {
            return (
              <div key={c.id} style={{ cursor: "pointer", textAlign: "center" }} onClick={function() { addCardToDeck(c); }}>
                <CardView card={c} cls={classData} />
                {c.keyword && (
                  <div style={{ fontSize: 14, color: "var(--ac)", marginTop: 4 }}>
                    {c.keyword.icon} {c.keyword.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={function() { setScreen("enhance"); }} color="var(--pu)">⬆️강화</Btn>
          <Btn onClick={function() { setDeckView(true); }}>📦덱 보기</Btn>
          <Btn onClick={skipReward}>건너뛰기</Btn>
        </div>
      </div>
      <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
    </div>
  );
}

// === ENHANCE SCREEN ===
function EnhanceScreen({ game }) {
  var { wrapStyle, CSS, audioButton, deck, classData, enhanceCard, skipReward, deckView, setDeckView, deckSort, setDeckSort } = game;
  var enhanceable = deck.filter(function(c) { return (c.enhanceCount || 0) < 2; });
  var suitOrder = SUIT_ORDER;
  var sorted = enhanceable.slice().sort(function(a, b) {
    if (a.isCommon !== b.isCommon) return a.isCommon ? 1 : -1;
    if (!a.isCommon && !b.isCommon) {
      if (a.suitId !== b.suitId) return (suitOrder[a.suitId] || 0) - (suitOrder[b.suitId] || 0);
      return a.grade - b.grade;
    }
    if (a.isCommon && b.isCommon) {
      if (a.common.id !== b.common.id) return a.common.id.localeCompare(b.common.id);
      return a.grade - b.grade;
    }
    return 0;
  });
  var groups = [];
  var currentGroup = null;
  sorted.forEach(function(c) {
    var key = c.isCommon ? "common-" + c.common.id : "class-" + c.suitId;
    if (currentGroup === null || currentGroup.key !== key) {
      currentGroup = { key: key, cards: [], label: c.isCommon ? c.common.icon + c.common.name : c.suitEmoji };
      groups.push(currentGroup);
    }
    currentGroup.cards.push(c);
  });
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 16, overflow: "auto" }}>
        <h3 style={{ fontSize: "var(--fs-lg)" }}>강화할 카드 (등급+1, 카드당 최대2회)</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 800 }}>
          {groups.map(function(grp) {
            return (
              <div key={grp.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 13, color: "var(--dm)", fontWeight: 700 }}>{grp.label}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                  {grp.cards.map(function(c) {
                    return (
                      <div key={c.id} style={{ cursor: "pointer" }} onClick={function() { enhanceCard(c); }}>
                        <CardView card={c} cls={classData} small />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={function() { setDeckView(true); }}>📦덱 보기</Btn>
          <Btn onClick={skipReward}>건너뛰기</Btn>
        </div>
      </div>
      <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
    </div>
  );
}

// === RELIC REWARD SCREEN ===
function RelicRewardScreen({ game }) {
  var { wrapStyle, CSS, audioButton, rewardRelics, pickRelic, deck, classData, deckView, setDeckView, deckSort, setDeckSort } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{ fontSize: 24, animation: "popIn 0.4s ease" }}>👑 보스 처치!</div>
        <h3 style={{ fontSize: "var(--fs-lg)" }}>유물 선택</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", padding: "0 8px" }}>
          {rewardRelics.map(function(r) {
            var borderCol = relicBorderColor(r.tier);
            return (
              <div
                key={r.id}
                onClick={function() { pickRelic(r); }}
                style={{ width: "clamp(100px, calc(var(--gw) * 0.26), 180px)", padding: "14px 10px", background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid " + borderCol, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}
              >
                <span style={{ fontSize: 24 }}>{r.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</span>
                <span style={{ fontSize: 14, color: "var(--dm)", textAlign: "center" }}>{r.desc}</span>
              </div>
            );
          })}
        </div>
        <Btn onClick={function() { setDeckView(true); }} style={{ marginTop: 6 }}>📦덱 보기</Btn>
      </div>
      <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
    </div>
  );
}

// === VICTORY SCREEN ===
function VictoryScreen({ game }) {
  var { wrapStyle, CSS, audioButton, gold, relics, runPoints, claimAndGo } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(10px, 1.8vh, 18px)" }}>
        <div style={{ fontSize: 48, animation: "victBounce 1.5s ease infinite" }}>🏆</div>
        <h1 style={{ fontSize: "var(--fs-xl)", fontFamily: "'Silkscreen', cursive", background: "linear-gradient(135deg,#e8a820,#d35400)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          VICTORY!
        </h1>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gd)" }}>💰{gold}</div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>골드</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ac)" }}>{relics.length}</div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>유물</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--or)" }}>+{runPoints}⭐</div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>포인트</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Btn onClick={function() { claimAndGo("village"); }} color="var(--gn)">🏘️ 마을</Btn>
          <Btn onClick={function() { claimAndGo("menu"); }} color="var(--rd)">🃏 다시 도전</Btn>
        </div>
      </div>
    </div>
  );
}

// === DEFEAT SCREEN ===
function DefeatScreen({ game }) {
  var { wrapStyle, CSS, audioButton, floor, runPoints, claimAndGo } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(10px, 1.8vh, 18px)" }}>
        <div style={{ fontSize: 44 }}>💀</div>
        <h1 style={{ fontSize: "var(--fs-xl)", fontFamily: "'Silkscreen', cursive", color: "var(--rd)" }}>DEFEAT</h1>
        <p style={{ color: "var(--dm)" }}>{floor}층에서 쓰러졌습니다...</p>
        {runPoints > 0 && (
          <div style={{ fontSize: 14, color: "var(--or)", fontWeight: 700 }}>+{runPoints}⭐ 획득</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Btn onClick={function() { claimAndGo("menu"); }} color="var(--gn)">🏠 홈으로</Btn>
          <Btn onClick={function() { claimAndGo("restart"); }} color="var(--rd)">🃏 다시 도전</Btn>
        </div>
      </div>
    </div>
  );
}


function CampfireScreen({ game }) {
  var { wrapStyle, CSS, audioButton, campPhase, campEvent, hp, MAX_HP, floor, classData, passiveState, stolenCard, deck, enterPhase2, enterPhase3, leaveCampfire, resolveCampfire, sellCard } = game;
  var [pendingSell, setPendingSell] = useState(null);

  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(12px, 2vh, 20px)", padding: "clamp(12px, 2vh, 20px)" }}>

        {/* Phase 1: Arrival */}
        {campPhase === 1 && (
          <div style={{ textAlign: "center", animation: "slideUp 0.5s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)", marginBottom: 4 }}>{floor}층 {FLOOR_NAMES[floor]}</div>
            <h2 style={{ fontSize: "var(--fs-lg)", color: "var(--or)", marginBottom: 12 }}>화톳불을 발견했다</h2>
            <div style={{ background: "rgba(20,16,10,0.85)", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
              <p style={{ color: "var(--dm)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: 0 }}>
                저 앞에 따뜻한 빛이 보인다.
                <br />지친 몸을 이끌고 불 옆에 다가간다.
              </p>
            </div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)", marginBottom: 8 }}>❤️ {hp}/{MAX_HP}</div>
            <Btn onClick={enterPhase2} color="var(--or)" style={{ padding: "10px 28px", fontSize: "var(--fs-md)" }}>
              불 옆에 앉다 →
            </Btn>
          </div>
        )}

        {/* Phase 2: Rest & Heal */}
        {campPhase === 2 && (
          <div style={{ textAlign: "center", animation: "slideUp 0.5s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 12, animation: "victBounce 2s ease infinite" }}>🔥</div>
            <h2 style={{ fontSize: "var(--fs-lg)", color: "var(--or)", marginBottom: 12 }}>휴식</h2>
            <div style={{ background: "rgba(25,80,40,0.85)", border: "1px solid #2d9b4e44", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
              <p style={{ color: "var(--sb)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: 0 }}>
                따뜻한 불빛이 몸을 감싼다.
                <br />잠시 눈을 감고 상처를 돌본다.
              </p>
              <div style={{ marginTop: 10, fontSize: "var(--fs-md)", color: "var(--gn)", fontWeight: 700 }}>
                ❤️ HP +{CAMP_HEAL} 회복!
              </div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--dm)", marginTop: 4 }}>
                {hp}/{MAX_HP}
              </div>
            </div>
            <Btn onClick={enterPhase3} color="var(--or)" style={{ padding: "10px 28px", fontSize: "var(--fs-md)" }}>
              눈을 뜨다 →
            </Btn>
          </div>
        )}

        {/* Phase 3: Event */}
        {campPhase === 3 && campEvent && (
          <div style={{ textAlign: "center", animation: "slideUp 0.5s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>

            {/* No event */}
            {campEvent.id === "none" && (
              <div style={{ background: "rgba(20,16,10,0.85)", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                <p style={{ color: "var(--sb)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: 0 }}>
                  고요한 밤이었다.
                  <br />충분히 쉬었으니 발걸음을 옮긴다.
                </p>
                <Btn onClick={leaveCampfire} color="var(--or)" style={{ marginTop: 14, padding: "10px 28px", fontSize: "var(--fs-md)" }}>
                  출발 →
                </Btn>
              </div>
            )}

            {/* Fairy */}
            {campEvent.id === "fairy" && (
              <div style={{ background: "rgba(80,30,100,0.85)", border: "1px solid var(--ac)", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🧚</div>
                <p style={{ color: "var(--sb)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: 0 }}>
                  잠에서 깨니 작은 빛이 주위를 맴돌고 있다.
                  <br />요정이 손끝으로 이마를 어루만졌다.
                  <br />몸 안에서 힘이 솟아오른다!
                </p>
                <div style={{ marginTop: 10, fontSize: "var(--fs-md)", color: "var(--ac)", fontWeight: 700 }}>
                  {classData.passive.onCamp(passiveState).msg}
                </div>
                <Btn onClick={resolveCampfire} color="var(--ac)" style={{ marginTop: 12, padding: "8px 24px", fontSize: "var(--fs-md)" }}>
                  감사히 받다 →
                </Btn>
              </div>
            )}

            {/* Rest */}
            {campEvent.id === "rest" && (
              <div style={{ background: "rgba(25,80,40,0.85)", border: "1px solid #2d9b4e44", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>😴</div>
                <p style={{ color: "var(--sb)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: 0 }}>
                  깊고 편안한 잠에 빠졌다.
                  <br />꿈속에서 따뜻한 빛이 상처를 감싸안았다.
                </p>
                <div style={{ marginTop: 10, fontSize: "var(--fs-md)", color: "var(--gn)", fontWeight: 700 }}>
                  ❤️ 추가 HP +{CAMP_REST_HEAL} 회복! (총 +{CAMP_HEAL + CAMP_REST_HEAL})
                </div>
                <Btn onClick={resolveCampfire} color="var(--gn)" style={{ marginTop: 12, padding: "8px 24px", fontSize: "var(--fs-md)" }}>
                  개운하다 →
                </Btn>
              </div>
            )}

            {/* Ambush */}
            {campEvent.id === "ambush" && (
              <div style={{ background: "rgba(120,30,20,0.85)", border: "1px solid #c0392b", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🐺</div>
                <p style={{ color: "var(--sb)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: 0 }}>
                  갑자기 덤불에서 바스락거리는 소리가 들린다!
                  <br />눈을 떠보니 적이 다가오고 있다!
                </p>
                <div style={{ marginTop: 10, fontSize: "var(--fs-md)", color: "var(--rd)", fontWeight: 700 }}>
                  ⚔️ 전투 발생!
                </div>
                <Btn onClick={resolveCampfire} color="var(--rd)" style={{ marginTop: 12, padding: "8px 24px", fontSize: "var(--fs-md)" }}>
                  ⚔️ 맞서 싸운다!
                </Btn>
              </div>
            )}

            {/* Thief */}
            {campEvent.id === "thief" && (
              <div style={{ background: "rgba(120,30,20,0.85)", border: "1px solid #c0392b", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🤡</div>
                <p style={{ color: "var(--sb)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: 0 }}>
                  잠에서 깨니 뭔가 허전하다...
                  <br />도둑이 카드를 훔쳐 달아났다!
                </p>
                {stolenCard ? (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: "var(--fs-md)", color: "var(--rd)", fontWeight: 700 }}>빼앗긴 카드:</div>
                    <CardView card={stolenCard} cls={classData} small />
                  </div>
                ) : (
                  <div style={{ marginTop: 10, fontSize: "var(--fs-md)", color: "var(--dm)" }}>
                    덱이 너무 적어 훔치지 못했다!
                  </div>
                )}
                <Btn onClick={resolveCampfire} color="var(--rd)" style={{ marginTop: 12, padding: "8px 24px", fontSize: "var(--fs-md)" }}>
                  어쩔 수 없다... →
                </Btn>
              </div>
            )}

            {/* Merchant */}
            {campEvent.id === "merchant" && (
              <div style={{ background: "rgba(140,100,15,0.85)", border: "1px solid var(--gd)", borderRadius: 12, padding: "14px 16px", maxWidth: 400, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🏪</div>
                <p style={{ color: "var(--sb)", fontSize: "var(--fs-md)", lineHeight: 1.6, margin: 0 }}>
                  "좋은 카드가 있으면 제값에 사겠소."
                </p>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--dm)", margin: "6px 0" }}>탭하여 선택 → 확인 후 판매 (등급×3 골드)</div>
                <div style={{ maxHeight: 220, overflow: "auto", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", padding: "4px 0" }}>
                  {deck.map(function(c) {
                    var isSelected = pendingSell && pendingSell.id === c.id;
                    return (
                      <div key={c.id} onClick={function() { setPendingSell(isSelected ? null : c); }} style={{ cursor: "pointer", position: "relative", border: isSelected ? "2px solid var(--gd)" : "2px solid transparent", borderRadius: 8 }}>
                        <CardView card={c} cls={classData} small={true} />
                        <div style={{ position: "absolute", bottom: 2, right: 2, background: "var(--gd)", color: "#000", borderRadius: 4, padding: "1px 4px", fontSize: 11, fontWeight: 700 }}>
                          💰{c.grade * 3}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, padding: "8px 12px", background: pendingSell ? "#e8a82011" : "transparent", border: pendingSell ? "1px solid #e8a82088" : "1px solid transparent", borderRadius: 8, textAlign: "center", visibility: pendingSell ? "visible" : "hidden" }}>
                  <div style={{ fontSize: 13, color: "var(--gd)", fontWeight: 700, marginBottom: 6 }}>
                    {pendingSell ? (pendingSell.isCommon ? pendingSell.common.name : (pendingSell.suitId + " " + pendingSell.grade)) + " 판매? 💰" + (pendingSell.grade * 3) : "\u00A0"}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <Btn onClick={function() { if (pendingSell) { sellCard(pendingSell); setPendingSell(null); } }} color="var(--gd)" style={{ padding: "5px 16px", fontSize: 12 }}>
                      판매 확인
                    </Btn>
                    <Btn onClick={function() { setPendingSell(null); }} color="var(--dm)" style={{ padding: "5px 16px", fontSize: 12 }}>
                      취소
                    </Btn>
                  </div>
                </div>
                <Btn onClick={function() { setPendingSell(null); leaveCampfire(); }} style={{ marginTop: 8, fontSize: "var(--fs-md)", padding: "8px 20px" }}>
                  안 팔고 진행 →
                </Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function VillageScreen({ game }) {
  var { wrapStyle, CSS, audioButton, metaPoints, setMetaPoints, upgradeLevels, setUpgradeLevels, classId, skillTab, setSkillTab, resetCount, setResetCount, setScreen } = game;

  var totalInvested = 0;
  SKILL_TREES.forEach(function(tree) {
    tree.nodes.forEach(function(node) {
      var lv = upgradeLevels[node.id] || 0;
      for (var i = 0; i < lv; i++) {
        totalInvested += node.cost + i * Math.ceil(node.cost * 0.5);
      }
    });
  });
  var ulUnlocked = totalInvested >= ULTIMATE_SKILL.unlockCost;
  var ulOwned = upgradeLevels.fatedDice > 0;
  var visibleTrees = SKILL_TREES.filter(function(t) {
    return t.classId === null || t.classId === classId || CLASSES.length === 1;
  });

  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflow: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: "var(--fs-xl)" }}>🌟 스킬 트리</h2>
          <div style={{ fontSize: "var(--fs-md)", color: "var(--or)", fontWeight: 700 }}>⭐ {metaPoints} 포인트</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--dm)", marginTop: 2 }}>총 투자: {totalInvested}⭐</div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {visibleTrees.map(function(tree) {
            var isActive = skillTab === tree.id;
            var tColor = tree.color || "var(--dm)";
            return (
              <button key={tree.id} onClick={function() { setSkillTab(tree.id); }} style={{ padding: "8px 14px", fontSize: "var(--fs-md)", fontWeight: 700, border: "1px solid " + (isActive ? tColor : "var(--bd)"), borderRadius: 6, background: isActive ? tColor + "22" : "var(--cd)", color: isActive ? tColor : "var(--dm)", cursor: "pointer" }}>
                {tree.icon} {tree.name}
              </button>
            );
          })}
        </div>
        {visibleTrees.filter(function(t) { return t.id === skillTab; }).map(function(tree) {
          return (
            <div key={tree.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {tree.nodes.map(function(node) {
                  var lv = upgradeLevels[node.id] || 0;
                  var maxed = lv >= node.max;
                  var actualCost = node.cost + lv * Math.ceil(node.cost * 0.5);
                  var canBuy = metaPoints >= actualCost && !maxed;
                  return (
                    <div key={node.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: maxed ? "#2d9b4e11" : "var(--cd)", border: "1px solid " + (maxed ? "#2d9b4e44" : "var(--bd)"), borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "var(--fs-md)" }}>{node.icon}</span>
                        <span style={{ fontWeight: 700, marginLeft: 4, fontSize: "var(--fs-md)" }}>{node.name}</span>
                        <span style={{ color: "var(--dm)", fontSize: "var(--fs-sm)", marginLeft: 6 }}>{node.desc}</span>
                        <span style={{ color: "var(--ac)", fontSize: "var(--fs-sm)", marginLeft: 6 }}>{lv}/{node.max}</span>
                      </div>
                      {maxed ? (
                        <span style={{ color: "var(--gn)", fontSize: 13, fontWeight: 700 }}>MAX</span>
                      ) : (
                        <Btn
                          onClick={function() {
                            var nodeId = node.id;
                            var cost = node.cost + (upgradeLevels[nodeId] || 0) * Math.ceil(node.cost * 0.5);
                            if (metaPoints < cost) return;
                            setMetaPoints(function(p) { return p - cost; });
                            setUpgradeLevels(function(prev) {
                              var n = Object.assign({}, prev);
                              n[nodeId] = (n[nodeId] || 0) + 1;
                              return n;
                            });
                          }}
                          disabled={!canBuy}
                          style={{ padding: "6px 12px", fontSize: 13, whiteSpace: "nowrap" }}
                        >
                          ⭐{actualCost}
                        </Btn>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div style={{ marginBottom: 14, padding: 10, background: ulUnlocked ? "#c87f0a11" : "#1a1810", border: "1px solid " + (ulUnlocked ? "#c87f0a44" : "var(--bd)"), borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ulUnlocked ? "var(--wn)" : "var(--dm)" }}>{ULTIMATE_SKILL.icon} {ULTIMATE_SKILL.name}</div>
          <div style={{ fontSize: 13, color: "var(--dm)", marginTop: 2 }}>{ULTIMATE_SKILL.desc}</div>
          {ulOwned ? (
            <span style={{ color: "var(--gn)", fontSize: 13, fontWeight: 700 }}>활성화됨</span>
          ) : ulUnlocked ? (
            <Btn
              onClick={function() {
                setUpgradeLevels(function(prev) {
                  return Object.assign({}, prev, { fatedDice: 1 });
                });
              }}
              style={{ padding: "8px 16px", fontSize: 13, marginTop: 6 }}
              color="var(--wn)"
            >
              해금
            </Btn>
          ) : (
            <div style={{ fontSize: 13, color: "var(--dm)", marginTop: 4 }}>{ULTIMATE_SKILL.unlockCost}⭐ 투자 시 해금 (현재 {totalInvested}⭐)</div>
          )}
        </div>
        {(function() {
          if (resetCount >= 3) {
            return (
              <div style={{ textAlign: "center", marginTop: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--dm)" }}>🔄 초기화 3회 모두 사용</span>
              </div>
            );
          }
          var resetCost = [2, 3, 4][resetCount];
          var canReset = metaPoints >= resetCost && totalInvested > 0;
          return (
            <div style={{ textAlign: "center", marginTop: 8, marginBottom: 4 }}>
              <Btn
                onClick={function() {
                  if (!canReset) return;
                  setMetaPoints(function(p) { return p + totalInvested - resetCost; });
                  setUpgradeLevels(function(prev) {
                    var n = {};
                    Object.keys(prev).forEach(function(k) { n[k] = 0; });
                    return n;
                  });
                  setResetCount(function(c) { return c + 1; });
                }}
                disabled={!canReset}
                color="var(--rd)"
                style={{ padding: "8px 20px", fontSize: 13 }}
              >
                🔄 스킬 초기화 ({resetCount + 1}/3회) — ⭐{resetCost}
              </Btn>
              {!canReset && totalInvested === 0 && (
                <div style={{ fontSize: 12, color: "var(--dm)", marginTop: 4 }}>투자한 스킬 없음</div>
              )}
              {!canReset && totalInvested > 0 && metaPoints < resetCost && (
                <div style={{ fontSize: 12, color: "var(--dm)", marginTop: 4 }}>⭐ 부족 (필요: {resetCost})</div>
              )}
            </div>
          );
        })()}
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <Btn onClick={function() { setScreen("menu"); sfx.bgmOn("home"); }} color="var(--rd)" style={{ padding: "10px 32px" }}>⚔️ 던전으로</Btn>
        </div>
      </div>
    </div>
  );
}


function BattleScreen({ game }) {
  var {
    wrapStyle, CSS, audioButton,
    classData, floor, battleNum, gold, hp, MAX_HP,
    relics, deck, hand, selected, monster,
    discards, roundNum, damageInfo, currentHand,
    monShake, monShakeHard, playerShake, enemyAttacking, busy,
    overlay, enemyDmgShow, passiveState, gambleBuff, gambleAnim,
    poison, frozenIds, tenacityUsed, bossDialogue, encounterOverlay,
    gambitChoices, splitMon, passiveMsg, newCardIds, upgradeLevels,
    deckSort, submitLimit, preview, previewDmg,
    toggleCard, submitCards, doDiscard, pickGambitCard,
    setOverlay, setDeckSort,
  } = game;

  var [relicTip, setRelicTip] = useState(null);

  var handTierColor = "var(--tx)";
  if (currentHand && currentHand.tier >= 4) handTierColor = "var(--gd)";
  else if (currentHand && currentHand.tier >= 3) handTierColor = "var(--rd)";

  var hpPct = Math.max(0, (hp / MAX_HP) * 100);
  var hpColor = hpPct > 50 ? "var(--gn)" : hpPct > 25 ? "var(--wn)" : "var(--rd)";

  return (
    <div style={Object.assign({}, wrapStyle, { minHeight: "auto", overflow: "hidden", position: "relative" })}>
      <style>{CSS}</style>
      {audioButton}
      {encounterOverlay && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: encounterOverlay.boss
            ? "radial-gradient(circle, #2d1a08 0%, var(--bg) 70%)"
            : "radial-gradient(circle, #1a1808 0%, var(--bg) 70%)",
        }}>
          <div style={{ animation: "encounterIn 0.6s ease", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 144, animation: "floatY 2s ease infinite", marginBottom: 12 }}>
              {encounterOverlay.emoji}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: encounterOverlay.boss ? "var(--gd)" : "var(--ac)", textShadow: "0 0 20px currentColor", letterSpacing: 2 }}>
              {encounterOverlay.name}
            </div>
            <div style={{ fontSize: 14, color: "var(--dm)", marginTop: 6, fontWeight: 700 }}>
              {encounterOverlay.boss ? "⚠️ BOSS ⚠️" : "⚔️ 엘리트 ⚔️"}
            </div>
          </div>
        </div>
      )}
      {gambitChoices.length > 0 && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.85)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--gd)", marginBottom: 16 }}>🎰 투기 — 1장을 선택하세요</div>
          <div style={{ display: "flex", gap: 12 }}>
            {gambitChoices.map(function(c) {
              return (
                <div key={c.id} onClick={function() { pickGambitCard(c); }} style={{ cursor: "pointer", transition: "transform 0.15s" }}>
                  <CardView card={c} cls={classData} />
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: "var(--dm)", marginTop: 12 }}>나머지 2장은 버린카드 더미로</div>
        </div>
      )}
      {/* === 상단바 (간소화: 층 정보 + 덱) === */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "clamp(5px, calc(var(--gw) * 0.01), 8px) clamp(10px, calc(var(--gw) * 0.02), 16px)", background: "var(--pn)", borderBottom: "1px solid var(--bd)", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize: "clamp(15px, calc(var(--gw) * 0.03), 24px)" }}>
          <b>{classData.icon} {floor}층 {FLOOR_NAMES[floor]}</b>
          <span style={{ color: "var(--dm)", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", marginLeft: 6 }}>{battleNum === 3 ? "⚔️습격!" : "전투" + battleNum + "/5"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(5px, calc(var(--gw) * 0.01), 10px)" }}>
          <div
            onClick={function() { setOverlay("hands"); }}
            style={{ background: "var(--bd)", borderRadius: 6, padding: "clamp(8px, calc(var(--gw) * 0.016), 12px) clamp(10px, calc(var(--gw) * 0.02), 16px)", fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", cursor: "pointer", color: "var(--dm)", fontWeight: 700 }}
          >
            족보
          </div>
          <div
            onClick={function() { setOverlay("deck"); }}
            style={{ background: "var(--bd)", borderRadius: 6, padding: "clamp(8px, calc(var(--gw) * 0.016), 12px) clamp(10px, calc(var(--gw) * 0.02), 16px)", fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", cursor: "pointer", color: "var(--dm)", fontWeight: 700 }}
          >
            덱{deck.length}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* === 1인칭 뷰: 몬스터(상) + 데미지(하) === */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", overflow: "hidden", position: "relative" }}>
        {/* --- 몬스터 그룹 (위쪽) --- */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", gap: "clamp(4px, 1vh, 8px)", paddingBottom: "clamp(10px, 2vh, 20px)" }}>
        <div style={{ textAlign: "center", padding: "2px 0", flexShrink: 0, position: "relative" }}>
          {monster && (
            <div>
              <HpBar current={monster.hp} max={monster.maxHp} name={monster.name} boss={monster.boss} miniboss={monster.miniboss} />
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 3, visibility: monster.hp > 0 ? "visible" : "hidden", textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)" }}>
                <span style={{ fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", color: "var(--rd)", fontWeight: 700, animation: "intentPulse 2s ease infinite" }}>
                  ⚔️{monster.atk}~{monster.atk + 2}
                </span>
                {monster.freeze > 0 && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--fr)", fontWeight: 700 }}>❄️{monster.freeze}</span>}
                {monster.erode > 0 && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--ac)", fontWeight: 700 }}>🌑{monster.erode}</span>}
                {monster.burn > 0 && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--or)", fontWeight: 700 }}>🔥{monster.burn}</span>}
                {monster.split && !monster.hasSplit && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--or)", fontWeight: 700 }}>💥분열</span>}
              </div>
              <div style={{ fontSize: monster.boss ? "clamp(96px, calc(var(--gw) * 0.192), 176px)" : "clamp(80px, calc(var(--gw) * 0.16), 144px)", marginTop: 3, animation: monShake ? (monShakeHard ? "shakeHard 0.6s ease" : "shake 0.4s ease") : enemyAttacking ? "enemyAtk 0.5s ease" : "floatY 3s ease infinite", display: "flex", justifyContent: "center", overflow: "hidden" }}>
                {monster.emoji}
              </div>
              <div style={{
                width: "40%",
                height: 0,
                margin: "-2px auto 0",
                boxShadow: "0 0 clamp(20px,4vw,40px) clamp(10px,2vw,20px) rgba(0,0,0,0.5)",
                borderRadius: "50%",
              }} />
              <div style={{ marginTop: 3, fontSize: "clamp(12px, calc(var(--gw) * 0.024), 18px)", color: "var(--dm)", background: splitMon ? "var(--cd)" : "transparent", borderRadius: 4, padding: "2px 8px", display: "inline-block", visibility: splitMon ? "visible" : "hidden" }}>
                {splitMon ? "대기: " + splitMon.emoji + " HP" + splitMon.hp : "\u00A0"}
              </div>
            </div>
          )}
          {bossDialogue && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, textAlign: "center", padding: "4px 0", animation: "slideUp 0.4s ease", zIndex: 5, pointerEvents: "none" }}>
              <span style={{ display: "inline-block", background: "#231e14ee", border: "1px solid var(--ac)", borderRadius: 8, padding: "5px 16px", fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", fontWeight: 700, color: "#f0e0c8", maxWidth: "80%" }}>
                "{bossDialogue}"
              </span>
            </div>
          )}
        {/* Gamble Roulette Animation */}
        {gambleAnim && (
          <div style={{ position: "absolute", top: "calc(100% + 30px)", left: 0, right: 0, textAlign: "center", padding: "4px 0", animation: "popIn 0.2s ease", zIndex: 5, pointerEvents: "none" }}>
            <span style={{ fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", fontWeight: 700, color: gambleAnim.includes("🎉") ? "var(--gn)" : gambleAnim.includes("💀") ? "var(--rd)" : "var(--gd)", background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 16px" }}>
              {gambleAnim}
            </span>
          </div>
        )}
        </div>
        </div>
        {/* --- 데미지 그룹 (아래쪽) --- */}
        <div style={{ position: "absolute", bottom: "clamp(12px, 3vh, 24px)", left: 0, right: 0, display: "flex", flexDirection: "column-reverse", alignItems: "stretch", gap: "clamp(2px, 0.5vh, 6px)", pointerEvents: "none", zIndex: 10 }}>
        {/* === 데미지 정보 영역 === */}
        {damageInfo && currentHand ? (
          <div style={{ flexShrink: 0, textAlign: "center", padding: "4px 0" }}>
            <div style={{ fontSize: "clamp(16px, calc(var(--gw) * 0.032), 24px)", fontWeight: 900, color: handTierColor, animation: "popIn 0.4s ease", marginBottom: 2 }}>
              {currentHand.emoji} {currentHand.name}! {currentHand.emoji}
            </div>
            {damageInfo.fatedRoll > 0 && (
              <div style={{ fontSize: "clamp(14px, calc(var(--gw) * 0.028), 20px)", fontWeight: 700, color: damageInfo.fatedMult <= 0.5 ? "var(--rd)" : damageInfo.fatedMult <= 1.5 ? "var(--bl)" : "var(--cr)", animation: "dmgPop 0.4s ease 0.1s both", marginBottom: 2 }}>
                🎲 [{damageInfo.fatedRoll}] → x{damageInfo.fatedMult}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "'Silkscreen', cursive", position: "relative" }}>
              {damageInfo.isCrit && (
                <div style={{ position: "absolute", inset: -16, background: "radial-gradient(circle, #f0b93044 0%, transparent 70%)", animation: "critFlash 0.8s ease", borderRadius: "50%", pointerEvents: "none" }} />
              )}
              <span style={{ fontSize: "clamp(16px, calc(var(--gw) * 0.032), 24px)", color: "var(--bl)", animation: "multIn 0.3s ease 0.2s both" }}>{damageInfo.atk}</span>
              <span style={{ fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", color: "var(--dm)", animation: "multIn 0.3s ease 0.4s both" }}>x{damageInfo.mult}</span>
              <span style={{ fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", color: "var(--dm)" }}>=</span>
              <span style={{ fontSize: damageInfo.isCrit ? "clamp(26px, calc(var(--gw) * 0.052), 40px)" : (currentHand.tier >= 4 ? "clamp(22px, calc(var(--gw) * 0.044), 34px)" : "clamp(18px, calc(var(--gw) * 0.036), 28px)"), color: damageInfo.isCrit ? "#f0b930" : handTierColor, animation: damageInfo.isCrit ? "critBurst 0.7s ease 0.3s both" : "dmgPop 0.5s ease 0.3s both", textShadow: damageInfo.isCrit ? "0 0 20px #f0b930aa" : "none" }}>{damageInfo.total}</span>
              <span style={{ fontSize: "clamp(18px, calc(var(--gw) * 0.036), 28px)", animation: "dmgPop 0.3s ease 0.5s both" }}>{damageInfo.isCrit ? "💥⭐" : "💥"}</span>
            </div>
          </div>
        ) : null}

        {/* Passive Trigger Message */}
        {passiveMsg && (
          <div style={{ textAlign: "center", flexShrink: 0, padding: "2px 0", animation: "passivePop 0.4s ease, passiveFade 2s ease forwards" }}>
            <span style={{ display: "inline-block", background: "#9b59b633", border: "1px solid var(--ac)", borderRadius: 6, padding: "3px 12px", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", fontWeight: 700, color: "#f0e0c8" }}>
              {passiveMsg}
            </span>
          </div>
        )}
        </div>

        {/* 적 공격 데미지 표시 (몬스터 영역 중앙) */}
        {enemyDmgShow !== null && (
          <div style={{ position: "absolute", top: enemyDmgShow === "MISS" ? "65%" : "40%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 20, pointerEvents: "none" }}>
            {enemyDmgShow === "MISS" && (
              <div style={{ position: "absolute", inset: -40, background: "radial-gradient(circle, #2d9b4e33 0%, transparent 70%)", animation: "missFlash 0.6s ease", borderRadius: "50%", pointerEvents: "none" }} />
            )}
            <div style={{ fontSize: enemyDmgShow === "MISS" ? 32 : 28, fontWeight: 900, color: enemyDmgShow === "MISS" ? "var(--gn)" : "var(--rd)", fontFamily: "'Silkscreen', cursive", animation: enemyDmgShow === "MISS" ? "missBounce 0.7s ease, dmgFloat 1.4s ease 0.7s forwards" : "dmgPop 0.4s ease, dmgFloat 1.2s ease 0.4s forwards", textShadow: enemyDmgShow === "MISS" ? "0 0 15px #2d9b4eaa" : "0 0 10px #c0392b88" }}>
              {enemyDmgShow === "MISS" ? "✨MISS!✨" : "-" + enemyDmgShow}
            </div>
          </div>
        )}

        </div>

        {/* === 1인칭 하단 상태창 (패시브 + HP + 유물 + 골드) === */}
        <div style={{ flexShrink: 0, padding: "5px 10px", borderTop: "1px solid var(--bd)", background: "linear-gradient(180deg, var(--pn), var(--bg))", animation: playerShake ? "playerHit 0.5s ease" : "none", boxShadow: "0 -2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
          {/* 패시브 뱃지 (HP 바 위) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1, minHeight: "clamp(24px, calc(var(--gw) * 0.048), 36px)" }}>
              {(function() {
                var badge = classData.passive.renderBadge(passiveState, upgradeLevels.stealth * 5);
                if (!badge) return null;
                return (
                  <div style={{ background: badge.bg, border: "1px solid " + badge.border, borderRadius: 5, padding: "2px 8px", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                    <span>{badge.label}</span>
                    {badge.detail && <span style={{ color: classData.passive.color, fontSize: "clamp(12px, calc(var(--gw) * 0.024), 18px)" }}>{badge.detail}</span>}
                  </div>
                );
              })()}
              {poison > 0 && (
                <div style={{ background: "#9b59b622", border: "1px solid var(--ac)", borderRadius: 5, padding: "2px 8px", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", fontWeight: 700 }}>
                  ☠️독{poison}
                </div>
              )}
              {gambleBuff !== 0 && (
                <div style={{ background: gambleBuff > 0 ? "#2d9b4e22" : "#c0392b22", border: "1px solid " + (gambleBuff > 0 ? "var(--gn)" : "var(--rd)"), borderRadius: 5, padding: "2px 8px", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", fontWeight: 700 }}>
                  🎲{gambleBuff > 0 ? "+" : ""}{gambleBuff}
                </div>
              )}
              {upgradeLevels.tenacity > 0 && !tenacityUsed && (
                <div style={{ background: "#6b5c4a22", border: "1px solid #6b5c4a", borderRadius: 5, padding: "2px 8px", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", fontWeight: 700 }}>
                  💀집념
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {relics.map(function(r) {
                return (
                  <span key={r.id}
                    onClick={function() { setRelicTip(relicTip === r.id ? null : r.id); }}
                    style={{ fontSize: "clamp(18px, calc(var(--gw) * 0.036), 30px)", cursor: "pointer", position: "relative", padding: "6px 4px" }}>
                    {r.emoji}
                    {relicTip === r.id && (
                      <span style={{
                        position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--cd)", border: "1px solid var(--bd)",
                        borderRadius: 8, padding: "5px 10px",
                        fontSize: 12, color: "var(--tx)",
                        maxWidth: "80vw", whiteSpace: "normal", wordBreak: "keep-all",
                        zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                        pointerEvents: "none", fontWeight: 700,
                      }}>
                        {r.name}: {r.desc}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
          {/* HP 바 + 골드 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "clamp(15px, calc(var(--gw) * 0.03), 24px)", fontWeight: 700, fontFamily: "'Silkscreen', cursive", color: hpColor, minWidth: "clamp(65px, calc(var(--gw) * 0.13), 110px)" }}>
              {Math.max(0, hp)}/{MAX_HP}
            </span>
            <div style={{ flex: 1, height: "clamp(12px, calc(var(--gw) * 0.024), 20px)", background: "var(--cd)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--bd)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
              <div style={{ width: hpPct + "%", height: "100%", background: hpColor, borderRadius: 6, transition: "width 0.5s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)" }} />
            </div>
            <span style={{ fontSize: "clamp(15px, calc(var(--gw) * 0.03), 24px)", color: "var(--gd)", fontWeight: 700 }}>💰{gold}</span>
          </div>
        </div>

        {/* === 손패 고정 영역 === */}
        <div style={{ padding: "clamp(8px, calc(var(--gw) * 0.016), 14px) clamp(6px, calc(var(--gw) * 0.012), 10px) clamp(2px, calc(var(--gw) * 0.004), 4px)", display: "flex", justifyContent: "center", alignItems: "flex-end", overflow: "visible", flexShrink: 0, height: "clamp(110px, calc(var(--gw) * 0.22), 200px)", background: "var(--bg)" }}>
          {hand.map(function(c, idx) {
            var isNew = newCardIds.indexOf(c.id) >= 0;
            var isFrozen = frozenIds.indexOf(c.id) >= 0;
            var isEroded = c.eroded;
            var isBurning = c.burning;
            var baseOverlap = hand.length > 7 ? -18 : hand.length > 6 ? -14 : hand.length > 5 ? -6 : 3;
            var overlap = "clamp(" + baseOverlap + "px, calc(var(--gw) * " + (baseOverlap * 0.002) + "), " + (baseOverlap < 0 ? Math.round(baseOverlap * 1.8) + "px" : Math.round(baseOverlap * 1.8) + "px") + ")";
            return (
              <div key={c.id} style={{
                animation: isNew ? "cardDraw 0.35s ease forwards" : "none",
                position: "relative",
                marginLeft: idx === 0 ? 0 : overlap,
                zIndex: selected.indexOf(c.id) >= 0 ? 10 : idx,
              }}>
                <div style={{ opacity: isFrozen ? 0.5 : 1, filter: isFrozen ? "saturate(0.3)" : isEroded ? "brightness(0.6) saturate(0.5)" : isBurning ? "sepia(0.5) brightness(1.1)" : "none" }}>
                  <CardView
                    card={c}
                    cls={classData}
                    selected={selected.indexOf(c.id) >= 0}
                    onClick={function() { toggleCard(c.id); }}
                    disabled={busy}
                  />
                </div>
                {isFrozen && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 14, pointerEvents: "none" }}>❄️</div>}
                {isEroded && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 14, pointerEvents: "none" }}>🌑</div>}
                {isBurning && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 14, pointerEvents: "none" }}>🔥</div>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "clamp(6px, calc(var(--gw) * 0.012), 10px) clamp(10px, calc(var(--gw) * 0.02), 18px) clamp(8px, calc(var(--gw) * 0.016), 14px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--bd)", background: "var(--pn)", flexShrink: 0, boxShadow: "0 -2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
          <div style={{ fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>
            {preview ? (
              <span>
                {preview.emoji}{" "}
                <b style={{ color: preview.tier >= 3 ? "var(--gd)" : "var(--tx)" }}>{preview.name}</b>
                <span style={{ color: "var(--dm)", marginLeft: 3 }}>x{preview.mult}</span>
                {previewDmg && (
                  <span style={{ marginLeft: 6 }}>
                    <span style={{ color: "var(--bl)" }}>{previewDmg.atk}</span>
                    <span style={{ color: "var(--dm)" }}>×</span>
                    <span style={{ color: "var(--or)" }}>{previewDmg.mult}</span>
                    <span style={{ color: "var(--dm)" }}>=</span>
                    <span style={{ color: "var(--rd)", fontWeight: 700 }}>{previewDmg.total}</span>
                    {previewDmg.critChance > 0 && (
                      <span style={{ color: "#f0b930", fontSize: "clamp(11px, calc(var(--gw) * 0.022), 16px)", marginLeft: 3 }}>⭐{previewDmg.critChance}%</span>
                    )}
                  </span>
                )}
              </span>
            ) : (
              <span style={{ color: "var(--dm)" }}>최대 {submitLimit}장 R{roundNum}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <Btn onClick={doDiscard} disabled={discards <= 0 || selected.length === 0 || busy} style={{ padding: "clamp(8px, calc(var(--gw) * 0.016), 14px) clamp(12px, calc(var(--gw) * 0.024), 20px)", fontSize: "clamp(13px, calc(var(--gw) * 0.026), 22px)" }}>
              🔄{discards}
            </Btn>
            <Btn onClick={submitCards} disabled={selected.length === 0 || busy} color="var(--rd)" style={{ padding: "clamp(10px, calc(var(--gw) * 0.02), 18px) clamp(20px, calc(var(--gw) * 0.04), 36px)", fontSize: "clamp(15px, calc(var(--gw) * 0.03), 26px)" }}>
              ⚡제출
            </Btn>
          </div>
        </div>
      </div>

      {overlay === "deck" && (
        <DeckViewer
          deck={deck}
          cls={classData}
          show={true}
          sortMode={deckSort}
          onSort={function(m) { setDeckSort(m); }}
          onClose={function() { setOverlay(null); }}
        />
      )}
      {overlay === "hands" && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function() { setOverlay(null); }}
        >
          <div
            style={{ background: "var(--pn)", borderRadius: 14, padding: "18px 22px", maxWidth: 380, width: "90%", border: "1px solid var(--bd)" }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            <h3 style={{ fontSize: 16, marginBottom: 12, textAlign: "center" }}>🃏 족보 목록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
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
              ].map(function(h) {
                var tierColor = h.tier >= 5 ? "var(--gd)" : h.tier >= 4 ? "var(--or)" : h.tier >= 3 ? "var(--rd)" : h.tier >= 2 ? "var(--bl)" : "var(--dm)";
                return (
                  <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", background: "var(--cd)", borderRadius: 6, borderLeft: "3px solid " + tierColor }}>
                    <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{h.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, flex: 1, color: tierColor }}>{h.name}</span>
                    <span style={{ fontSize: 12, color: "var(--dm)", flex: 1 }}>{h.desc}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, fontFamily: "'Silkscreen', cursive", color: tierColor, minWidth: 36, textAlign: "right" }}>{h.mult}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <Btn onClick={function() { setOverlay(null); }}>닫기</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ShopScreen({ game }) {
  var {
    wrapStyle, CSS, audioButton,
    hp, MAX_HP, gold, deck, classData, relics, floor,
    shopCards, shopRelic, shopHealed, shopRemoved, SHOP_MAX_REMOVE,
    upgradeLevels, deckView, deckSort,
    buyCard, buyRelic, removeCard, leaveShop,
    setGold, setHp, setShopHealed, setDeckView, setDeckSort,
  } = game;

  var discount = upgradeLevels.merchant > 0 ? 0.8 : 1;
  var relicCost = shopRelic ? Math.floor((shopRelic.tier === 1 ? 30 : shopRelic.tier === 2 ? 50 : 75) * discount) : 0;
  var healCost = Math.floor(10 * discount);
  var removeCost = Math.floor(10 * discount);
  var sortedDeck = deck.slice().sort(function(a, b) {
    var suitOrd = SUIT_ORDER;
    if (a.isCommon !== b.isCommon) return a.isCommon ? 1 : -1;
    if (!a.isCommon && !b.isCommon) {
      if (a.suitId !== b.suitId) return (suitOrd[a.suitId] || 0) - (suitOrd[b.suitId] || 0);
      return a.grade - b.grade;
    }
    if (a.isCommon && b.isCommon) return a.common.id.localeCompare(b.common.id);
    return 0;
  });

  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ padding: "12px 14px", background: "var(--pn)", borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>🏪 대장간</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: "var(--fs-md)" }}>❤️{hp}/{MAX_HP}</span>
          <span style={{ color: "var(--gd)", fontWeight: 700 }}>💰{gold}</span>
          <button
            onClick={function() { setDeckView(true); }}
            style={{ background: "var(--bd)", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 14, color: "var(--tx)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}
          >
            📦덱
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
        <div>
          <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>📦 카드</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {shopCards.map(function(c) {
              var cost = Math.floor((c.grade * 3 + (c.isCommon ? 2 : 0) + (c.keyword ? 5 : 0)) * discount);
              return (
                <div key={c.id} style={{ textAlign: "center" }}>
                  <CardView card={c} cls={classData} small />
                  <Btn onClick={function() { buyCard(c, cost); }} disabled={gold < cost} style={{ fontSize: "var(--fs-md)", padding: "5px 12px", marginTop: 4 }}>
                    💰{cost}
                  </Btn>
                </div>
              );
            })}
          </div>
        </div>
        {shopRelic && (
          <div>
            <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>🔮 유물</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ padding: 10, background: "var(--cd)", borderRadius: 10, border: "1px solid " + relicBorderColor(shopRelic.tier), textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>{shopRelic.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{shopRelic.name}</div>
                <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>{shopRelic.desc}</div>
              </div>
              <Btn onClick={function() { buyRelic(shopRelic, relicCost); }} disabled={gold < relicCost} color="var(--pu)">💰{relicCost}</Btn>
            </div>
          </div>
        )}
        <div>
          <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>❤️ 회복 (1회 한정)</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 10, background: "var(--cd)", borderRadius: 10, border: "1px solid var(--bd)", textAlign: "center", minWidth: 100 }}>
              <div style={{ fontSize: 20 }}>🧪</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>회복 물약</div>
              <div style={{ fontSize: 13, color: "var(--dm)" }}>HP +15</div>
            </div>
            <Btn
              onClick={function() {
                if (shopHealed || gold < healCost || hp >= MAX_HP) return;
                sfx.heal();
                setGold(function(g) { return g - healCost; });
                setHp(function(h) { return Math.min(MAX_HP, h + 15); });
                setShopHealed(true);
              }}
              disabled={shopHealed || gold < healCost || hp >= MAX_HP}
              color="var(--gn)"
            >
              {shopHealed ? "완료" : hp >= MAX_HP ? "만탄" : "💰" + healCost}
            </Btn>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>🗑️ 제거 (💰{removeCost}, {SHOP_MAX_REMOVE - shopRemoved}회 남음)</h3>
          {deck.length <= 10 && (
            <div style={{ fontSize: 12, color: "var(--rd)", marginBottom: 6 }}>덱 10장 이하 — 제거 불가</div>
          )}
          {shopRemoved >= SHOP_MAX_REMOVE && (
            <div style={{ fontSize: 12, color: "var(--rd)", marginBottom: 6 }}>제거 횟수 소진</div>
          )}
          {deck.length > 10 && shopRemoved < SHOP_MAX_REMOVE && gold < removeCost && (
            <div style={{ fontSize: 12, color: "var(--rd)", marginBottom: 6 }}>골드 부족</div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {sortedDeck.map(function(c) {
              var canRemove = gold >= removeCost && deck.length > 10 && shopRemoved < SHOP_MAX_REMOVE;
              return (
                <div
                  key={c.id}
                  onClick={function() { removeCard(c, removeCost); }}
                  style={{ cursor: canRemove ? "pointer" : "default", opacity: canRemove ? 1 : 0.3 }}
                >
                  <CardView card={c} cls={classData} small />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ padding: "clamp(8px, 1.5vh, 14px)", borderTop: "1px solid var(--bd)", textAlign: "center" }}>
        <Btn onClick={leaveShop} color="var(--rd)" style={{ fontSize: "var(--fs-md)", padding: "clamp(8px, 1.5vh, 14px) 36px" }}>
          {floor >= 5 ? "🏆 클리어!" : "다음 층 →"}
        </Btn>
      </div>
      <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
    </div>
  );
}


const BASE_HP = 70;
const SHOP_MAX_REMOVE = 2;

// === MAIN GAME ===
export default function DungeonHand() {
  var s = useState;
  var [screen, setScreen] = s("menu");
  var [classId, setClassId] = s(null);
  var [floor, setFloor] = s(1);
  var [battleNum, setBattleNum] = s(1);
  var [gold, setGold] = s(99999);
  var [hp, setHp] = s(BASE_HP);
  // Meta progression (persists across runs)
  var [metaPoints, setMetaPoints] = s(99999);
  var [upgradeLevels, setUpgradeLevels] = s(function() {
    var init = {};
    SKILL_TREES.forEach(function(t) { t.nodes.forEach(function(n) { init[n.id] = 0; }); });
    init[ULTIMATE_SKILL.id] = 0;
    return init;
  });
  var [resetCount, setResetCount] = s(0);
  var [skillTab, setSkillTab] = s("common");
  var [bossesKilled, setBossesKilled] = s([]); // track boss kills this run for points
  const MAX_HP = BASE_HP + upgradeLevels.hp * 5;
  var [relics, setRelics] = s([]);
  var [deck, setDeck] = s([]);
  var [drawPile, setDrawPile] = s([]);
  var [hand, setHand] = s([]);
  var [discardPile, setDiscardPile] = s([]);
  var [selected, setSelected] = s([]);
  var [monster, setMonster_] = s(null);
  var monsterRef = useRef(null);
  function setMonster(val) {
    if (typeof val === "function") {
      setMonster_(function(prev) { var next = val(prev); monsterRef.current = next; return next; });
    } else {
      monsterRef.current = val; setMonster_(val);
    }
  }
  var [discards, setDiscards] = s(2);
  var [roundNum, setRoundNum] = s(1);
  var [damageInfo, setDamageInfo] = s(null);
  var [currentHand, setCurrentHand] = s(null);
  var [monShake, setMonShake] = s(false);
  var [monShakeHard, setMonShakeHard] = s(false);
  var [playerShake, setPlayerShake] = s(false);
  var [enemyAttacking, setEnemyAttacking] = s(false);
  var [busy, setBusy] = s(false);
  var [rewardCards, setRewardCards] = s([]);
  var [rewardRelics, setRewardRelics] = s([]);
  var [shopCards, setShopCards] = s([]);
  var [shopRelic, setShopRelic] = s(null);
  var [shopHealed, setShopHealed] = s(false);
  var [shopRemoved, setShopRemoved] = s(0);
  var [campEvent, setCampEvent] = s(null); // current campfire event
  var [stolenCard, setStolenCard] = s(null); // card stolen by thief
  var [campPhase, setCampPhase] = s(1); // 1=arrive, 2=rest, 3=event
  var [overlay, setOverlay] = s(null);
  var [enemyDmgShow, setEnemyDmgShow] = s(null);
  var [audioOn, setAudioOn] = s(false);
  // Passive state
  var [passiveState, setPassiveState] = s({ stacks: 0 });
  var passiveStateRef = useRef(passiveState);
  passiveStateRef.current = passiveState;
  var [aimedBonus, setAimedBonus] = s(0); // aimed shot: next turn submit +1
  var [gambleBuff, setGambleBuff] = s(0); // dice relic: +1 or -0.5 mult
  var [gambleAnim, setGambleAnim] = s(null); // roulette animation text
  var [poison, setPoison] = s(0); // poison on monster: dmg per turn
  var [erodedIds, setErodedIds] = s([]); // eroded card ids (grade temporarily -1)
  var [tenacityUsed, setTenacityUsed] = s(false); // tenacity: revive once per run
  var tenacityUsedRef = useRef(false);
  var [frozenIds, setFrozenIds] = s([]); // frozen card ids
  var [bossDialogue, setBossDialogue] = s(null); // boss/miniboss dialogue text
  var [encounterOverlay, setEncounterOverlay] = s(null); // boss encounter overlay { emoji, name, boss }
  var [book2Used, setBook2Used] = s(false); // book2: once per battle submit bonus
  var gambitPendingRef = useRef(false); // gambit: next draw shows 3-pick-1 (ref for setTimeout closure)
  var [gambitChoices, setGambitChoices] = s([]); // gambit: 3 cards to choose from
  var [splitMon, setSplitMon_] = s(null); // split monster waiting
  var splitMonRef = useRef(null);
  function setSplitMon(val) { splitMonRef.current = val; setSplitMon_(val); }
  var [passiveMsg, setPassiveMsg] = s(null); // passive trigger message
  var [deckView, setDeckView] = s(false);
  var [deckSort, setDeckSort] = s("type");
  var [newCardIds, setNewCardIds] = s([]);
  var [discardedRelicIds, setDiscardedRelicIds] = s([]); // 영구 삭제된 유물 id
  var [pendingRelic, setPendingRelic] = s(null);          // 교체 대기 중인 유물
  var [pendingRelicCost, setPendingRelicCost] = s(0);     // 상점 교체 대기 중 미차감 비용
  var [relicSwapContext, setRelicSwapContext] = s(null);   // "boss" | "shop"

  const HAND_SIZE = 5 + (upgradeLevels.deft || 0);
  const MAX_HAND = 7;
  const RELIC_SLOTS = 3 + (upgradeLevels.inventory || 0);
  const BASE_SUBMIT = 3;
  const MONSTERS_PER_FLOOR = 4;
  const BATTLE_TO_SLOT = { 1: 0, 2: 1, 4: 2, 5: 3 };

  var classData = CLASSES.find(function(c) { return c.id === classId; }) || CLASSES[0];

  function getRewardPool() {
    return floor < 2 ? REWARD_COMMONS.filter(function(c) { return c.fx !== "gambit" && c.fx !== "reclaim"; }) : REWARD_COMMONS;
  }

  function rollGrade(base, bossBonus) {
    var roll = Math.random();
    var g;
    if (roll < 0.50) g = base;
    else if (roll < 0.80) g = base + 1;
    else if (roll < 0.95) g = base + 2;
    else g = base + 3;
    if (bossBonus) g += 1;
    return Math.max(1, Math.min(g, 10));
  }

  function scaleMonsterHp(baseHp, fl) { return Math.floor(baseHp * (1 + (fl - 1) * 0.45)); }
  function scaleMonsterAtk(baseAtk, fl) { return Math.floor(baseAtk * (1 + (fl - 1) * 0.1)); }
  function rollEnemyDmg(baseAtk) { return baseAtk + Math.floor(Math.random() * 3); }

  function resetBattleState() {
    setFrozenIds([]);
    setSplitMon(null);
    setAimedBonus(0);
    setBook2Used(false);
    setBossDialogue(null);
    setPoison(0);
    setErodedIds([]);
    setGambleBuff(0);
    setGambleAnim(null);
    setNewCardIds([]);
  }

  function buildPState() {
    return Object.assign({}, passiveState, {
      stealthBonus: upgradeLevels.stealth * 5,
      gambleBuff: gambleBuff,
      shadowBurst: upgradeLevels.shadowBurst > 0,
      chainBoost: upgradeLevels.chainBoost > 0,
      critMastery: upgradeLevels.critMastery || 0,
      quickStrike: upgradeLevels.quickStrike > 0,
      critDamage: upgradeLevels.critDamage > 0,
      fatedDice: upgradeLevels.fatedDice > 0,
      roundNum: roundNum,
    });
  }
  var book2Bonus = (!book2Used && relics.some(function(r) { return r.id === "book2"; })) ? 1 : 0;
  var submitLimit = BASE_SUBMIT + aimedBonus + book2Bonus;

  function toggleAudio() {
    var val = sfx.toggle();
    setAudioOn(val);
  }

  function startRun(cid) {
    setClassId(cid);
    var d = makeDeck(cid);
    // 🗡️ 강화: all common cards grade + level
    var sharpLv = upgradeLevels.sharp;
    if (sharpLv > 0) {
      d = d.map(function(c) {
        if (c.isCommon) {
          return Object.assign({}, c, { grade: c.grade + sharpLv });
        }
        return c;
      });
    }
    d = shuffle(d);
    setDeck(d);
    setGold(99999); // 테스트: 재화 무제한
    setHp(MAX_HP);
    setRelics([]);
    setDiscardedRelicIds([]);
    setPendingRelic(null);
    setRelicSwapContext(null);
    setFloor(1);
    setBattleNum(1);
    setBossesKilled([]);
    // 🔥 각성: init passive via hook
    var cDef = CLASSES.find(function(c) { return c.id === cid; });
    setPassiveState(cDef.passive.init(upgradeLevels.awaken > 0));
    setPoison(0);
    setErodedIds([]);
    setTenacityUsed(false); tenacityUsedRef.current = false;
    gambitPendingRef.current = false;
    setGambitChoices([]);
    beginBattle(d, [], 1, 1);
  }

  function beginBattle(curDeck, curRelics, fl, bn) {
    // battleNum: 1,2=normal 3=campfire 4=miniboss 5=boss
    // Monster index mapping: bn1→0, bn2→1, bn4→2, bn5→3
    var mi = BATTLE_TO_SLOT[bn];
    if (mi === undefined) return; // campfire, no monster
    var idx = (fl - 1) * MONSTERS_PER_FLOOR + mi;
    var m = MONSTERS[idx] || MONSTERS[0];
    var mhp = scaleMonsterHp(m.hp, fl);
    var matk = scaleMonsterAtk(m.atk, fl);
    setMonster({ name: m.name, emoji: m.emoji, img: m.img, hp: mhp, maxHp: mhp, atk: matk, boss: m.boss, miniboss: m.miniboss, freeze: m.freeze || 0, erode: m.erode || 0, burn: m.burn || 0, split: m.split || false, hasSplit: false });
    var discBonus = curRelics.reduce(function(sum, r) {
      return r.eff.type === "disc" ? sum + r.eff.val : sum;
    }, 0);
    setDiscards(2 + discBonus + (upgradeLevels.nimble || 0));
    setRoundNum(1);
    setDamageInfo(null);
    setCurrentHand(null);
    setSelected([]);
    setBusy(false);
    setEnemyDmgShow(null);
    resetBattleState();
    // === 전투 시작 시퀀스: encounter → dialogue → ambush → dice → draw ===
    var shuffled = shuffle(curDeck);
    var initialHand = shuffled.slice(0, HAND_SIZE);
    setDrawPile(shuffled.slice(HAND_SIZE));
    setDiscardPile([]);
    setScreen("battle");
    setBusy(true);
    setHand([]);
    setNewCardIds([]);
    setEncounterOverlay(null);

    if (sfx.getOn()) sfx.bgmOn("battle");

    var t = 0; // running delay (ms)
    var laterTimers = []; // Phase 4/5 timer IDs, cleared on ambush death

    // Phase 1: Encounter overlay (boss/miniboss only)
    if (m.boss || m.miniboss) {
      setEncounterOverlay({ emoji: m.emoji, name: m.name, boss: !!m.boss, img: m.img });
      setTimeout(function() { setEncounterOverlay(null); }, 1800);
      t += 2000;
    }

    // Phase 2: Dialogue (boss/miniboss only)
    if ((m.boss || m.miniboss) && BOSS_DIALOGUES[m.name]) {
      var lines = BOSS_DIALOGUES[m.name];
      var line = lines[Math.floor(Math.random() * lines.length)];
      setTimeout(function() { setBossDialogue(line); }, t);
      setTimeout(function() { setBossDialogue(null); }, t + 1200);
      t += 1300;
    }

    // Phase 3: Ambush check
    var ambushChance = m.boss ? 30 : m.miniboss ? 20 : 10;
    var isAmbush = Math.random() * 100 < ambushChance;
    if (isAmbush) {
      var ambushDmg = rollEnemyDmg(matk);
      setTimeout(function() {
        showPassive("⚡ 기습! " + m.name + "의 선제 공격!");
        sfx.enemy();
        setEnemyAttacking(true);
        setPlayerShake(true);
        setEnemyDmgShow(ambushDmg);
        setHp(function(prev) {
          if (prev - ambushDmg <= 0) {
            if (upgradeLevels.tenacity > 0 && !tenacityUsedRef.current) {
              setTenacityUsed(true); tenacityUsedRef.current = true;
              laterTimers.forEach(function(tid) { clearTimeout(tid); });
              showPassive("💀 집념! 기습에도 쓰러지지 않는다!");
              return 1;
            }
            laterTimers.forEach(function(tid) { clearTimeout(tid); });
            setTimeout(function() { sfx.bgmOff(); sfx.lose(); setScreen("defeat"); }, 500);
            return 0;
          }
          return prev - ambushDmg;
        });
        setTimeout(function() {
          setEnemyAttacking(false);
          setPlayerShake(false);
          setEnemyDmgShow(null);
        }, 800);
      }, t);
      t += 1000;
    }

    // Phase 4: Dice (gamble relic)
    var gambleRelic = curRelics.find(function(r) { return r.eff.type === "gamble"; });
    if (gambleRelic) {
      var gWin = gambleRelic.eff.win;
      var gLose = gambleRelic.eff.lose;
      var roll = Math.random() < 0.5 ? gWin : gLose;
      var options = ["+" + gWin, "" + gLose, "+" + gWin, "" + gLose, "+" + gWin, "" + gLose];
      laterTimers.push(setTimeout(function() {
        var tick = 0;
        var interval = setInterval(function() {
          setGambleAnim("🎲 " + options[tick % options.length]);
          tick++;
          if (tick >= 8) {
            clearInterval(interval);
            setGambleBuff(roll);
            setGambleAnim(roll > 0 ? "🎲 배율+" + gWin + "! 🎉" : "🎲 배율" + gLose + "... 💀");
            laterTimers.push(setTimeout(function() { setGambleAnim(null); }, 1200));
          }
        }, 100);
      }, t));
      t += 1000;
    } else {
      setGambleBuff(0);
    }

    // Phase 5: Draw cards
    initialHand.forEach(function(card, idx) {
      laterTimers.push(setTimeout(function() {
        setHand(function(prev) { return prev.concat([card]); });
        setNewCardIds(function(prev) { return prev.concat([card.id]); });
      }, t + (idx + 1) * 150));
    });
    laterTimers.push(setTimeout(function() {
      setNewCardIds([]);
      setBusy(false);
    }, t + (HAND_SIZE + 1) * 150 + 100));
  }

  function toggleCard(id) {
    if (busy) return;
    setSelected(function(prev) {
      if (prev.indexOf(id) >= 0) {
        sfx.card();
        return prev.filter(function(x) { return x !== id; });
      }
      if (prev.length >= submitLimit) return prev;
      sfx.card();
      return prev.concat([id]);
    });
  }

  var selectedCards = hand.filter(function(c) { return selected.indexOf(c.id) >= 0; });
  var previewCards = selectedCards.filter(function(c) { return !c.burning; });
  var preview = previewCards.length > 0 ? detectHand(previewCards) : null;
  var previewDmg = null;
  if (preview && previewCards.length > 0) {
    previewDmg = calcDamage(previewCards, preview, relics, buildPState(), classData, true);
  }

  function showPassive(msg) {
    setPassiveMsg(msg);
    setTimeout(function() { setPassiveMsg(null); }, 2000);
  }

  function submitCards() {
    if (selected.length === 0 || busy) return;
    // Block if any selected card is frozen
    var hasFrozen = selected.some(function(id) { return frozenIds.indexOf(id) >= 0; });
    if (hasFrozen) {
      showPassive("❄️ 동결된 카드는 제출 불가! 버리기로 해제");
      return;
    }
    setBusy(true);
    if (relics.some(function(r) { return r.id === "book2"; })) setBook2Used(true);
    setFrozenIds([]); // clear freeze for next turn

    // === Restore eroded cards ===
    var played = hand.filter(function(c) { return selected.indexOf(c.id) >= 0; });
    if (erodedIds.length > 0) {
      // Restore original grades for eroded cards
      played = played.map(function(c) {
        if (c.eroded) {
          return Object.assign({}, c, { grade: c.grade + 1, eroded: false });
        }
        return c;
      });
      // Also restore in hand state
      setHand(function(prev) {
        return prev.map(function(c) {
          if (c.eroded) {
            return Object.assign({}, c, { grade: c.grade + 1, eroded: false });
          }
          return c;
        });
      });
      setErodedIds([]);
    }

    // === 집중타: check for aimed cards → next turn submit +1 ===
    var aimedCount = played.filter(function(c) { return c.isCommon && c.common.fx === "aimed"; }).length;
    // Consume current aimed bonus, then set new one
    setAimedBonus(aimedCount > 0 ? aimedCount : 0);

    // === Burn card penalty ===
    var burnPlayed = played.filter(function(c) { return c.burning; });
    if (burnPlayed.length > 0) {
      var burnDmg = burnPlayed.length * BURN_DAMAGE;
      setHp(function(prev) {
        if (prev - burnDmg <= 0) {
          if (upgradeLevels.tenacity > 0 && !tenacityUsedRef.current) {
            setTenacityUsed(true); tenacityUsedRef.current = true;
            showPassive("💀 집념! 화상에도 쓰러지지 않는다!");
            return 1;
          }
          setTimeout(function() { sfx.bgmOff(); sfx.lose(); setScreen("defeat"); }, 500);
          return 0;
        }
        return prev - burnDmg;
      });
      showPassive("🔥 화상 피해! -" + burnDmg + " HP");
    }
    // Filter out burn cards from played for damage calc (they contribute 0)
    var playedClean = played.filter(function(c) { return !c.burning; });

    var h = detectHand(playedClean.length > 0 ? playedClean : played);

    // Build passive state for damage calc
    var dmg = calcDamage(played, h, relics, buildPState(), classData);

    // === 투기(gambit): 다음 턴 3장 중 1장 선택 ===
    var gambitPlayed = played.filter(function(c) { return c.isCommon && c.common.fx === "gambit"; });
    if (gambitPlayed.length > 0) {
      gambitPendingRef.current = true;
    }

    // === Poison keyword: accumulate poison on monster ===
    var poisonAmt = played.reduce(function(sum, c) {
      if (c.keyword && c.keyword.id === "poison") return sum + c.grade + (c.growthBonus || 0);
      return sum;
    }, 0);
    var newPoison = poison + poisonAmt;
    if (poisonAmt > 0) {
      setPoison(newPoison);
    }

    // === Update passive state via hook ===
    var passiveResult = classData.passive.onSubmit(passiveState, played);
    setPassiveState(passiveResult.state);
    if (passiveResult.msg) showPassive(passiveResult.msg);

    setCurrentHand(h);
    setDamageInfo(dmg);
    sfx.hit(h.tier);
    if (h.tier >= 3 || dmg.isCrit) {
      setMonShake(true);
      setMonShakeHard(h.tier >= 4 || dmg.isCrit);
    }

    // Suit bonus: ⭐ crit
    if (dmg.isCrit) {
      var critMultMsg = upgradeLevels.critDamage > 0 ? "x2.0" : "x1.5";
      showPassive("💥 급소! 치명타 " + critMultMsg + "!");
    }

    // Build suit bonus message (via passive hook)
    var suitMsgs = classData.passive.suitMessages(dmg.suitBonuses, dmg.critChance, dmg.hasRed);

    // Show relic triggers and suit bonuses
    var allTriggers = (dmg.relicTriggers || []).concat(suitMsgs);
    if (allTriggers.length > 0) {
      setTimeout(function() {
        showPassive(allTriggers.join(" | "));
      }, 600);
    }
    // === 투기 결과 표시 ===
    if (gambitPlayed.length > 0) {
      showPassive("🎰 투기! 다음 턴 3장 중 1장 선택");
    }

    // === Keyword: Growth - permanently increase grade ===
    if (dmg.hasGrowth) {
      played.forEach(function(c) {
        if (c.keyword && c.keyword.id === "growth") {
          setDeck(function(d) {
            return d.map(function(dc) {
              return dc.id === c.id ? Object.assign({}, dc, { growthBonus: Math.min((dc.growthBonus || 0) + 1, 5) }) : dc;
            });
          });
        }
      });
    }

    setTimeout(function() {
      sfx.dmg();
      setMonShake(false);
      setMonShakeHard(false);

      setMonster(function(prev) {
        var newHp = Math.max(0, prev.hp - dmg.total);

        // === Split mechanic: boss splits at 50% HP ===
        if (prev.split && !prev.hasSplit && newHp > 0 && newHp <= prev.maxHp * 0.5) {
          var splitHp = newHp;
          var spawnHp = Math.floor(prev.maxHp * 0.4);
          setSplitMon({ name: "마법 골렘", emoji: "🗿", img: "golem", hp: spawnHp, maxHp: spawnHp, atk: Math.floor(prev.atk * 0.6), freeze: 1 });
          showPassive("💥 분열! 마법 골렘 출현!");
          setTimeout(function() { enemyTurn(Object.assign({}, prev, { hp: splitHp, hasSplit: true }), played, dmg, newPoison); }, 800);
          return Object.assign({}, prev, { hp: splitHp, hasSplit: true });
        }

        // Monster killed
        if (newHp <= 0) {
          // Check if split monster is waiting
          if (splitMonRef.current) {
            var sm = splitMonRef.current;
            setMonster(sm);
            setSplitMon(null);
            showPassive("⚔️ " + sm.name + " 등장!");
            setTimeout(function() { enemyTurn(sm, played, dmg, newPoison); }, 800);
            return sm;
          }
          setTimeout(function() { onMonsterDied(); }, 400);
          return Object.assign({}, prev, { hp: 0 });
        }
        setTimeout(function() { enemyTurn(Object.assign({}, prev, { hp: newHp }), played, dmg, newPoison); }, 800);
        return Object.assign({}, prev, { hp: newHp });
      });
    }, 700);
  }

  function enemyTurn(mon, played, dmgResult, poisonOverride) {
    // === ☠️ Poison tick ===
    var effectivePoison = poisonOverride !== undefined ? poisonOverride : poison;
    if (effectivePoison > 0) {
      setMonster(function(prev) {
        var newHp = Math.max(0, prev.hp - effectivePoison);
        if (newHp <= 0) {
          setTimeout(function() { onMonsterDied(); }, 300);
          return Object.assign({}, prev, { hp: 0 });
        }
        return Object.assign({}, prev, { hp: newHp });
      });
      showPassive("☠️ 독 데미지 " + effectivePoison + "!");
    }

    var atkDmg = rollEnemyDmg(mon.atk);

    // === damage reduction (passive hook) ===
    if (dmgResult && dmgResult.dmgReduction > 0) {
      atkDmg = Math.max(0, atkDmg - dmgResult.dmgReduction);
    }

    // === Rogue 🔺 red: evasion ===
    var evaded = false;
    if (dmgResult && dmgResult.evasionChance > 0) {
      var roll = Math.random() * 100;
      if (roll < dmgResult.evasionChance) {
        evaded = true;
        atkDmg = 0;
      }
    }

    setEnemyAttacking(true);
    sfx.enemy();
    var thorns = relics.reduce(function(sum, r) {
      return r.eff.type === "thorns" ? sum + r.eff.val : sum;
    }, 0);
    if (thorns > 0 && !evaded) {
      setMonster(function(p) { return Object.assign({}, p, { hp: Math.max(0, p.hp - thorns) }); });
    }

    setTimeout(function() {
      setEnemyAttacking(false);
      if (evaded) {
        setPlayerShake(false);
        setEnemyDmgShow("MISS");
        var evadeResult = classData.passive.onEvade(passiveStateRef.current);
        setPassiveState(evadeResult.state);
        if (evadeResult.msg) showPassive(evadeResult.msg);
      } else {
        setPlayerShake(true);
        setEnemyDmgShow(atkDmg);
        var hitResult = classData.passive.onHit(passiveStateRef.current);
        setPassiveState(hitResult.state);
        if (hitResult.msg) showPassive(hitResult.msg);
        setHp(function(prev) {
          if (prev - atkDmg <= 0) {
            // 💀 Tenacity: revive once
            if (upgradeLevels.tenacity > 0 && !tenacityUsedRef.current) {
              setTenacityUsed(true); tenacityUsedRef.current = true;
              showPassive("💀 집념! 쓰러지지 않는다!");
              return 1;
            }
            setTimeout(function() { sfx.bgmOff(); sfx.lose(); setScreen("defeat"); }, 500);
            return 0;
          }
          return prev - atkDmg;
        });
      }

      setTimeout(function() {
        setPlayerShake(false);
        setEnemyDmgShow(null);

        var remain = hand.filter(function(c) { return selected.indexOf(c.id) < 0; });
        var used = hand.filter(function(c) { return selected.indexOf(c.id) >= 0; });
        // Remove burn cards (1-time use) and strip eroded flag before recycling
        var usedClean = used.filter(function(c) { return !c.burning; }).map(function(c) {
          if (c.eroded) return Object.assign({}, c, { grade: c.grade + 1, eroded: false });
          return c;
        });
        // glass 카드 소멸: discardPile로 보내지 않고 덱에서 영구 제거
        var glassIds = usedClean.filter(function(c) { return c.isCommon && c.common.fx === "glass"; }).map(function(c) { return c.id; });
        if (glassIds.length > 0) {
          usedClean = usedClean.filter(function(c) { return glassIds.indexOf(c.id) < 0; });
          setDeck(function(d) { return d.filter(function(dc) { return glassIds.indexOf(dc.id) < 0; }); });
          showPassive("🔮 유리 카드 " + glassIds.length + "장 소멸!");
        }
        var newDisc = discardPile.concat(usedClean);

        // === 회수(reclaim): 버린 카드 더미에서 드로우 더미로 복귀 ===
        var reclaimAmt = played.reduce(function(sum, c) {
          if (c.isCommon && c.common.fx === "reclaim") return sum + c.grade + (c.growthBonus || 0);
          return sum;
        }, 0);
        var reclaimedCards = [];
        if (reclaimAmt > 0 && newDisc.length > 0) {
          var reclaimPool = shuffle(newDisc.filter(function(c) {
            return !(c.isCommon && c.common.fx === "reclaim");
          }));
          reclaimedCards = reclaimPool.slice(0, Math.min(reclaimAmt, reclaimPool.length));
          var reclaimedIds = reclaimedCards.map(function(c) { return c.id; });
          newDisc = newDisc.filter(function(c) { return reclaimedIds.indexOf(c.id) < 0; });
        }
        if (reclaimedCards.length > 0) {
          showPassive("🔁 회수! " + reclaimedCards.length + "장 덱으로 복귀");
        }

        var extraDraw = 0;
        // Keyword: chain draw
        if (dmgResult && dmgResult.extraDraw) {
          extraDraw += dmgResult.extraDraw;
        }
        extraDraw += relics.reduce(function(sum, r) {
          return r.eff.type === "drawAdd" ? sum + r.eff.val : sum;
        }, 0);
        var needed = selected.length + extraDraw;
        // MAX_HAND 캡 적용
        var maxDraw = MAX_HAND - remain.length;
        if (needed > maxDraw) needed = maxDraw;
        if (needed < 0) needed = 0;
        var tempDraw = reclaimedCards.concat(drawPile.slice());
        var tempDisc = newDisc.slice();
        var drawn = tempDraw.splice(0, needed);
        if (drawn.length < needed && tempDisc.length > 0) {
          tempDraw = shuffle(tempDisc);
          tempDisc = [];
          drawn = drawn.concat(tempDraw.splice(0, needed - drawn.length));
        }
        setDrawPile(tempDraw);
        setDiscardPile(tempDisc);
        setSelected([]);
        setDamageInfo(null);
        setCurrentHand(null);

        // Animate cards one by one
        setHand(remain);
        setNewCardIds([]);
        var ids = drawn.map(function(c) { return c.id; });
        drawn.forEach(function(card, idx) {
          setTimeout(function() {
            setHand(function(prev) { return prev.concat([card]); });
            setNewCardIds(function(prev) { return prev.concat([card.id]); });
          }, (idx + 1) * 120);
        });

        // Clear animation flags & unlock after all drawn
        var allNewHand = remain.concat(drawn);
        setTimeout(function() {
          setNewCardIds([]);

          // === Freeze mechanic ===
          var mon = monsterRef.current;
          var freezeCount = mon ? (mon.freeze || 0) : 0;
          if (freezeCount > 0) {
            var freezable = allNewHand.filter(function(c) { return selected.indexOf(c.id) < 0; });
            var toFreeze = pickN(freezable, freezeCount);
            var fIds = toFreeze.map(function(c) { return c.id; });
            setFrozenIds(fIds);
            if (fIds.length > 0) {
              showPassive("❄️ " + fIds.length + "장 동결!");
            }
          } else {
            setFrozenIds([]);
          }

          // === Erode mechanic (심연) ===
          var erodeCount = mon ? (mon.erode || 0) : 0;
          if (erodeCount > 0) {
            var erodable = allNewHand.filter(function(c) { return !c.isCommon; });
            var toErode = pickN(erodable, erodeCount);
            var eIds = toErode.map(function(c) { return c.id; });
            setErodedIds(eIds);
            // Temporarily reduce grade in hand
            setHand(function(prev) {
              return prev.map(function(c) {
                if (eIds.indexOf(c.id) >= 0) {
                  return Object.assign({}, c, { grade: Math.max(1, c.grade - 1), eroded: true });
                }
                return c;
              });
            });
            if (eIds.length > 0) {
              showPassive("🌑 침식! " + eIds.length + "장 등급 하락!");
            }
          } else {
            setErodedIds([]);
          }

          // === Burn mechanic (드래곤) ===
          var burnCount = mon ? (mon.burn || 0) : 0;
          if (burnCount > 0 && allNewHand.length < MAX_HAND) {
            var actualBurn = Math.min(burnCount, MAX_HAND - allNewHand.length);
            var burnCards = [];
            for (var bi = 0; bi < actualBurn; bi++) {
              burnCards.push({ id: getNextId(), suitId: "red", suitColor: "#c0392b", grade: 0, isCommon: false, burning: true, growthBonus: 0, keyword: null });
            }
            setHand(function(prev) { return prev.concat(burnCards); });
            showPassive("🔥 화상! " + actualBurn + "장 주입!");
          }

          // === Gambit: 3장 중 1장 선택 ===
          if (gambitPendingRef.current) {
            var gpDraw = tempDraw.slice();
            var gpDisc = tempDisc.slice();
            var gpCards = gpDraw.splice(0, 3);
            if (gpCards.length < 3 && gpDisc.length > 0) {
              gpDraw = shuffle(gpDisc);
              gpDisc = [];
              gpCards = gpCards.concat(gpDraw.splice(0, 3 - gpCards.length));
            }
            setDrawPile(gpDraw);
            setDiscardPile(gpDisc);
            if (gpCards.length > 0) {
              setGambitChoices(gpCards);
              gambitPendingRef.current = false;
              // busy stays true until player picks
              setRoundNum(function(r) { return r + 1; });
              return; // don't setBusy(false) yet
            }
            gambitPendingRef.current = false;
          }

          setBusy(false);
          setRoundNum(function(r) { return r + 1; });
        }, (drawn.length + 1) * 120 + 100);
      }, 500);
    }, 300);
  }

  function pickGambitCard(card) {
    var rejected = gambitChoices.filter(function(c) { return c.id !== card.id; });
    setDiscardPile(function(d) { return d.concat(rejected); });
    if (hand.length < MAX_HAND) {
      setHand(function(h) { return h.concat([card]); });
      showPassive("🎰 투기! " + getCardName(card, classData) + " 획득");
    } else {
      setDiscardPile(function(d) { return d.concat([card]); });
      showPassive("🎰 투기! 손패 가득 — 버린카드로 이동");
    }
    setGambitChoices([]);
    setBusy(false);
  }

  function doDiscard() {
    if (discards <= 0 || selected.length === 0 || busy) return;
    sfx.card();
    // Remove frozen status from discarded cards
    setFrozenIds(function(prev) {
      return prev.filter(function(fid) { return selected.indexOf(fid) < 0; });
    });
    var remain = hand.filter(function(c) { return selected.indexOf(c.id) < 0; });
    var tossed = hand.filter(function(c) { return selected.indexOf(c.id) >= 0; });
    // Remove burn cards, restore eroded cards before recycling
    var tossedClean = tossed.filter(function(c) { return !c.burning; }).map(function(c) {
      if (c.eroded) return Object.assign({}, c, { grade: c.grade + 1, eroded: false });
      return c;
    });
    var tempDraw = drawPile.slice();
    var tempDisc = discardPile.concat(tossedClean);
    var drawn = tempDraw.splice(0, tossed.length);
    if (drawn.length < tossed.length && tempDisc.length > 0) {
      tempDraw = shuffle(tempDisc);
      tempDisc = [];
      drawn = drawn.concat(tempDraw.splice(0, tossed.length - drawn.length));
    }
    setHand(remain.concat(drawn));
    setDrawPile(tempDraw);
    setDiscardPile(tempDisc);
    setDiscards(function(d) { return d - 1; });
    setSelected([]);
  }

  function onMonsterDied() {
    sfx.bgmOff();
    sfx.win();
    // Track boss kills for meta points
    var mi = BATTLE_TO_SLOT[battleNum];
    var monIdx = (floor - 1) * MONSTERS_PER_FLOOR + (mi || 0);
    if (battleNum === 5 && BOSS_POINTS[monIdx] !== undefined) {
      var pts = BOSS_POINTS[monIdx];
      setBossesKilled(function(prev) { return prev.concat([pts]); });
    }
    var isBoss = battleNum === 5;
    var lootBonus = upgradeLevels.loot * 3;
    var earned = (isBoss ? 10 : battleNum === 4 ? 7 : 4) + Math.floor(Math.random() * 5) + lootBonus;
    setGold(function(g) { return g + earned; });
    if (isBoss) {
      var avail = RELICS.filter(function(r) {
        if (r.classId != null && r.classId !== classId) return false;
        if (relics.find(function(o) { return o.id === r.id; })) return false;
        if (discardedRelicIds.indexOf(r.id) >= 0) return false;
        if (r.id === "hero" && Math.random() > 0.5) return false;
        return true;
      });
      if (avail.length === 0) {
        setRewardRelics([]);
      } else {
        setRewardRelics(pickN(avail, Math.min(3, avail.length)));
      }
      setScreen("relicReward");
    } else {
      generateRewardCards();
      setScreen("reward");
    }
  }

  function generateRewardCards() {
    var pool = [];
    var isBoss = battleNum === 5 || battleNum === 4;
    var kwChance = isBoss ? 0.3 : 0.15;
    // 문양수집: 보장할 문양 목록
    var collectSuits = [];
    if (upgradeLevels.redCollect > 0) collectSuits.push("red");
    if (upgradeLevels.blueCollect > 0) collectSuits.push("blue");
    if (upgradeLevels.yellowCollect > 0) collectSuits.push("yellow");
    for (var i = 0; i < 2; i++) {
      var s2;
      if (i < collectSuits.length) {
        s2 = SUITS.find(function(ss) { return ss.id === collectSuits[i]; });
      } else {
        s2 = pickN(SUITS, 1)[0];
      }
      var g2 = rollGrade(floor, isBoss);
      var kw = Math.random() < kwChance ? pickKw(g2) : null;
      pool.push(makeCard(s2.id, g2, classId, null, kw));
    }
    var ct = pickN(getRewardPool(), 1)[0];
    var s3 = collectSuits.length > 2 ? SUITS.find(function(ss) { return ss.id === collectSuits[2]; }) : pickN(SUITS, 1)[0];
    var g3 = rollGrade(floor, isBoss);
    if (ct && (ct.fx === "reclaim" || ct.fx === "gambit") && g3 < 2) g3 = 2;
    var kw2 = Math.random() < kwChance ? pickKw(g3) : null;
    pool.push(makeCard(s3.id, g3, classId, ct, kw2));
    setRewardCards(pool);
  }

  // Pick keyword, filtering growth to grade 1-4 only
  function pickKw(grade) {
    var available = KEYWORDS.filter(function(k) {
      if (k.id === "growth" && grade >= 5) return false;
      return true;
    });
    return available.length > 0 ? pickN(available, 1)[0] : null;
  }

  function addCardToDeck(card) {
    var newDeck = deck.concat([Object.assign({}, card, { id: getNextId() })]);
    setDeck(newDeck);
    advanceBattle(newDeck);
  }

  function skipReward() {
    advanceBattle(deck);
  }

  function advanceBattle(d) {
    if (battleNum < 5) {
      var nb = battleNum + 1;
      setBattleNum(nb);
      if (nb === 3) {
        // Campfire
        setCampPhase(1);
        setCampEvent(null);
        setScreen("campfire");
        if (sfx.getOn()) sfx.bgmOn("campfire");
      } else {
        beginBattle(d, relics, floor, nb);
      }
    }
  }

  function pickRelic(r) {
    if (relics.length < RELIC_SLOTS) {
      var newRelics = relics.concat([r]);
      setRelics(newRelics);
      openShop(newRelics);
    } else {
      setPendingRelic(r);
      setRelicSwapContext("boss");
    }
  }

  function swapRelic(oldRelic) {
    if (relicSwapContext === "shop") {
      sfx.gold();
      setGold(function(g) { return g - pendingRelicCost; });
    }
    var newRelics = relics.filter(function(r) { return r.id !== oldRelic.id; }).concat([pendingRelic]);
    setDiscardedRelicIds(function(prev) { return prev.concat([oldRelic.id]); });
    setRelics(newRelics);
    resolveRelicSwap(newRelics);
  }

  function discardPendingRelic() {
    setDiscardedRelicIds(function(prev) { return prev.concat([pendingRelic.id]); });
    resolveRelicSwap(relics);
  }

  function resolveRelicSwap(finalRelics) {
    var ctx = relicSwapContext;
    setPendingRelic(null);
    setPendingRelicCost(0);
    setRelicSwapContext(null);
    if (ctx === "boss") {
      openShop(finalRelics);
    }
  }

  function openShop(currentRelics) {
    var pool = [];
    for (var i = 0; i < 3; i++) {
      var s2 = pickN(SUITS, 1)[0];
      var g = rollGrade(floor + 1, false); // shop premium: base = floor+1
      var kw = (i < 2 && Math.random() < 0.25) ? pickKw(g) : null;
      if (Math.random() < 0.3) {
        pool.push(makeCard(s2.id, g, classId, pickN(getRewardPool(), 1)[0], kw));
      } else {
        pool.push(makeCard(s2.id, g, classId, null, kw));
      }
    }
    setShopCards(pool);
    var rels = currentRelics || relics;
    var avail = RELICS.filter(function(r) {
      if (r.classId != null && r.classId !== classId) return false;
      if (rels.find(function(o) { return o.id === r.id; })) return false;
      if (discardedRelicIds.indexOf(r.id) >= 0) return false;
      if (r.id === "hero" && Math.random() > 0.5) return false;
      return true;
    });
    setShopRelic(avail.length > 0 ? pickN(avail, 1)[0] : null);
    setShopHealed(false);
    setShopRemoved(0);
    setScreen("shop");
    if (sfx.getOn()) sfx.bgmOn("shop");
  }

  function buyCard(card, cost) {
    if (gold < cost) return;
    sfx.gold();
    setGold(function(g) { return g - cost; });
    setDeck(function(d) { return d.concat([Object.assign({}, card, { id: getNextId() })]); });
    setShopCards(function(p) { return p.filter(function(x) { return x.id !== card.id; }); });
  }

  function buyRelic(r, cost) {
    if (gold < cost) return;
    if (relics.length < RELIC_SLOTS) {
      sfx.gold();
      setGold(function(g) { return g - cost; });
      setRelics(function(p) { return p.concat([r]); });
      setShopRelic(null);
    } else {
      setPendingRelic(r);
      setPendingRelicCost(cost);
      setRelicSwapContext("shop");
      setShopRelic(null);
    }
  }

  function removeCard(card, cost) {
    if (gold < cost || deck.length <= 10 || shopRemoved >= SHOP_MAX_REMOVE) return;
    setGold(function(g) { return g - cost; });
    setDeck(function(d) { return d.filter(function(x) { return x.id !== card.id; }); });
    setShopRemoved(function(n) { return n + 1; });
  }

  function leaveShop() {
    if (floor >= 5) {
      sfx.bgmOff();
      sfx.win();
      setScreen("victory");
      return;
    }
    var nextFloor = floor + 1;
    setFloor(nextFloor);
    setBattleNum(1);
    beginBattle(deck, relics, nextFloor, 1);
  }

  function enhanceCard(card) {
    var newDeck = deck.map(function(c) {
      return c.id === card.id ? Object.assign({}, c, { grade: c.grade + 1, enhanceCount: (c.enhanceCount || 0) + 1 }) : c;
    });
    setDeck(newDeck);
    advanceBattle(newDeck);
  }

  // === CAMPFIRE FUNCTIONS (hoisted from campfire screen) ===
  function enterPhase2() {
    setHp(function(h) { return Math.min(MAX_HP, h + CAMP_HEAL); });
    setCampPhase(2);
  }

  function enterPhase3() {
    var roll = Math.random();
    if (roll < 0.5) {
      setCampEvent({ id: "none" });
    } else {
      var evt = CAMPFIRE_EVENTS[Math.floor(Math.random() * CAMPFIRE_EVENTS.length)];
      setCampEvent(evt);
    }
    setCampPhase(3);
  }

  function leaveCampfire() {
    setCampEvent(null);
    setCampPhase(1);
    var nb = 4;
    setBattleNum(nb);
    beginBattle(deck, relics, floor, nb);
  }

  function resolveCampfire() {
    if (!campEvent) return;
    var evtId = campEvent.id;

    if (evtId === "fairy") {
      var campResult = classData.passive.onCamp(passiveStateRef.current);
      setPassiveState(campResult.state);
    }
    if (evtId === "rest") {
      setHp(function(h) { return Math.min(MAX_HP, h + CAMP_REST_HEAL); });
    }
    if (evtId === "thief") {
      setDeck(function(d) {
        if (d.length <= 10) { setStolenCard(null); return d; }
        var ri = Math.floor(Math.random() * d.length);
        setStolenCard(d[ri]);
        return d.filter(function(_, i) { return i !== ri; });
      });
    }
    if (evtId === "ambush") {
      setCampEvent(null);
      setCampPhase(1);
      var ambushIdx = (floor - 1) * MONSTERS_PER_FLOOR;
      var am = MONSTERS[ambushIdx];
      var amhp = scaleMonsterHp(am.hp, floor);
      var amatk = scaleMonsterAtk(am.atk, floor);
      setMonster({ name: am.name, emoji: am.emoji, img: am.img, hp: amhp, maxHp: amhp, atk: amatk, boss: false, freeze: am.freeze || 0, erode: am.erode || 0, burn: am.burn || 0, split: false, hasSplit: false });
      var discBonus = relics.reduce(function(sum, r) { return r.eff.type === "disc" ? sum + r.eff.val : sum; }, 0);
      setDiscards(2 + discBonus + (upgradeLevels.nimble || 0));
      setRoundNum(1);
      setDamageInfo(null);
      setCurrentHand(null);
      setSelected([]);
      setBusy(false);
      setEnemyDmgShow(null);
      resetBattleState();
      var shuffled = shuffle(deck);
      setDrawPile(shuffled.slice(HAND_SIZE));
      setHand(shuffled.slice(0, HAND_SIZE));
      setDiscardPile([]);
      setScreen("battle");
      if (sfx.getOn()) sfx.bgmOn("battle");
      var ambushDmg = rollEnemyDmg(amatk);
      setTimeout(function() {
        showPassive("⚡ 기습! " + am.name + "의 선제 공격!");
        sfx.enemy();
        setEnemyAttacking(true);
        setPlayerShake(true);
        setEnemyDmgShow(ambushDmg);
        setHp(function(prev) {
          if (prev - ambushDmg <= 0) {
            if (upgradeLevels.tenacity > 0 && !tenacityUsedRef.current) {
              setTenacityUsed(true); tenacityUsedRef.current = true;
              showPassive("💀 집념! 기습에도 쓰러지지 않는다!");
              return 1;
            }
            setTimeout(function() { sfx.bgmOff(); sfx.lose(); setScreen("defeat"); }, 500);
            return 0;
          }
          return prev - ambushDmg;
        });
        setTimeout(function() {
          setEnemyAttacking(false);
          setPlayerShake(false);
          setEnemyDmgShow(null);
        }, 800);
      }, 600);
      return;
    }
    if (evtId === "merchant") {
      return;
    }
    leaveCampfire();
  }

  function sellCard(card) {
    var earnedGold = card.grade * 3;
    setGold(function(g) { return g + earnedGold; });
    setDeck(function(d) { return d.filter(function(c) { return c.id !== card.id; }); });
    sfx.gold();
    setCampEvent(null);
    setCampPhase(1);
    var nb = 4;
    setBattleNum(nb);
    beginBattle(deck.filter(function(c) { return c.id !== card.id; }), relics, floor, nb);
  }

  // === WRAPPER STYLE ===
  var bgKey = screen === "classSelect" ? "menu"
    : screen === "reward" || screen === "enhance" || screen === "relicReward" ? "battle"
    : screen === "victory" || screen === "defeat" ? "menu"
    : screen;
  var bgPath = bgKey === "battle" ? getBattleBg(floor, battleNum)
    : bgKey === "campfire" ? getCampfireBg(floor)
    : SCREEN_BG[bgKey] || SCREEN_BG.menu;
  var bgUrl = import.meta.env.BASE_URL + bgPath;

  var wrapStyle = {
    width: "min(100vw, calc(100vh * 9 / 16), 960px)",
    height: "min(100vh, calc(min(100vw, 960px) * 16 / 9))",
    margin: "auto",
    background: "radial-gradient(ellipse at 50% 30%, rgba(26,21,16,0.55) 0%, rgba(15,12,8,0.7) 70%), url(" + bgUrl + ") center 65%/cover no-repeat",
    color: "var(--tx)",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: "clamp(15px, calc(var(--gw) * 0.025 + 5px), 22px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 0 60px rgba(0,0,0,0.6)",
    imageRendering: "pixelated",
  };

  // === AUDIO BUTTON ===
  var audioButton = (
    <div
      onClick={toggleAudio}
      style={{
        position: "absolute", top: 10, right: 10, zIndex: 999,
        background: "var(--pn)", border: "1px solid var(--bd)",
        borderRadius: "50%", width: 38, height: 38,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 14,
      }}
    >
      {audioOn ? "🔊" : "🔇"}
    </div>
  );

  // Compute earned points for this run
  var runPoints = bossesKilled.reduce(function(sum, p) { return sum + p; }, 0);
  var isVictory = screen === "victory";
  if (isVictory) runPoints += 3; // clear bonus

  function claimAndGo(dest) {
    if (bossesKilled.length > 0 || isVictory) {
      setMetaPoints(function(p) { return p + runPoints; });
    }
    setBossesKilled([]);
    if (dest === "restart") {
      startRun(classId);
      return;
    }
    setScreen(dest);
    if (dest === "menu") sfx.bgmOn("home");
  }

  // === GAME PROPS OBJECT ===
  var game = {
    wrapStyle: wrapStyle, audioButton: audioButton, CSS: CSS, sfx: sfx,
    screen: screen, classId: classId, classData: classData,
    floor: floor, battleNum: battleNum, gold: gold, hp: hp, MAX_HP: MAX_HP,
    metaPoints: metaPoints, upgradeLevels: upgradeLevels, resetCount: resetCount, skillTab: skillTab,
    relics: relics, deck: deck, hand: hand, selected: selected,
    monster: monster, discards: discards, roundNum: roundNum,
    damageInfo: damageInfo, currentHand: currentHand,
    monShake: monShake, monShakeHard: monShakeHard,
    playerShake: playerShake, enemyAttacking: enemyAttacking, busy: busy,
    rewardCards: rewardCards, rewardRelics: rewardRelics,
    shopCards: shopCards, shopRelic: shopRelic, shopHealed: shopHealed, shopRemoved: shopRemoved, SHOP_MAX_REMOVE: SHOP_MAX_REMOVE,
    campEvent: campEvent, stolenCard: stolenCard, campPhase: campPhase,
    overlay: overlay, enemyDmgShow: enemyDmgShow,
    passiveState: passiveState, gambleBuff: gambleBuff, gambleAnim: gambleAnim,
    poison: poison, frozenIds: frozenIds, tenacityUsed: tenacityUsed,
    bossDialogue: bossDialogue, encounterOverlay: encounterOverlay,
    gambitChoices: gambitChoices, splitMon: splitMon, passiveMsg: passiveMsg,
    deckView: deckView, deckSort: deckSort, newCardIds: newCardIds,
    pendingRelic: pendingRelic, runPoints: runPoints,
    submitLimit: submitLimit, preview: preview, previewDmg: previewDmg,
        // Setters
    setScreen: setScreen, setMetaPoints: setMetaPoints, setUpgradeLevels: setUpgradeLevels,
    setResetCount: setResetCount, setSkillTab: setSkillTab,
    setGold: setGold, setHp: setHp, setShopHealed: setShopHealed,
    setOverlay: setOverlay, setDeckView: setDeckView, setDeckSort: setDeckSort,
    // Functions
    startRun: startRun, toggleCard: toggleCard, submitCards: submitCards, doDiscard: doDiscard,
    pickGambitCard: pickGambitCard, addCardToDeck: addCardToDeck, skipReward: skipReward,
    enhanceCard: enhanceCard, pickRelic: pickRelic, swapRelic: swapRelic,
    discardPendingRelic: discardPendingRelic,
    buyCard: buyCard, buyRelic: buyRelic, removeCard: removeCard, leaveShop: leaveShop,
    claimAndGo: claimAndGo,
    enterPhase2: enterPhase2, enterPhase3: enterPhase3,
    leaveCampfire: leaveCampfire, resolveCampfire: resolveCampfire, sellCard: sellCard,
  };

  // === SCREEN ROUTING ===
  if (pendingRelic) return <PendingRelicOverlay game={game} />;
  if (screen === "village") return <VillageScreen game={game} />;
  if (screen === "menu") return <MenuScreen game={game} />;
  if (screen === "classSelect") return <ClassSelectScreen game={game} />;
  if (screen === "campfire") return <CampfireScreen game={game} />;
  if (screen === "battle") return <BattleScreen game={game} />;
  if (screen === "reward") return <RewardScreen game={game} />;
  if (screen === "enhance") return <EnhanceScreen game={game} />;
  if (screen === "relicReward") return <RelicRewardScreen game={game} />;
  if (screen === "shop") return <ShopScreen game={game} />;
  if (screen === "victory") return <VictoryScreen game={game} />;
  if (screen === "defeat") return <DefeatScreen game={game} />;

  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      <div style={{ padding: 40, textAlign: "center" }}>로딩중...</div>
    </div>
  );
}
