import { useState } from "react";

// === AUDIO ===
const sfx = (() => {
  let ctx = null;
  let isOn = false;
  let bgmId = null;
  const melody = [330, 392, 494, 440, 392, 330, 294, 262, 330, 392, 440, 494];
  let mIdx = 0;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // iOS Safari unlock: 무음 버퍼 재생으로 오디오 잠금 해제
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!isOn) return;
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.value = vol || 0.1;
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (delay || 0) + (dur || 0.1));
      o.connect(g);
      g.connect(c.destination);
      o.start(c.currentTime + (delay || 0));
      o.stop(c.currentTime + (delay || 0) + (dur || 0.1) + 0.05);
    } catch (e) { /* silent */ }
  }

  return {
    getOn: () => isOn,
    toggle: () => {
      isOn = !isOn;
      if (isOn) { getCtx(); sfx.bgmOn(); } else { sfx.bgmOff(); }
      return isOn;
    },
    bgmOn: () => {
      sfx.bgmOff();
      if (!isOn) return;
      mIdx = 0;
      bgmId = setInterval(() => {
        tone(melody[mIdx % melody.length], 0.2, "triangle", 0.04);
        mIdx++;
      }, 250);
    },
    bgmOff: () => {
      if (bgmId) { clearInterval(bgmId); bgmId = null; }
    },
    card: () => tone(523, 0.05),
    hit: (tier) => {
      const notes = [262, 330, 392];
      if (tier >= 3) notes.push(523);
      if (tier >= 4) notes.push(659);
      notes.forEach((f, i) => tone(f, 0.12, "square", 0.06, i * 0.06));
    },
    dmg: () => {
      if (!isOn) return;
      try {
        const c = getCtx();
        const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.06;
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start();
      } catch (e) { /* silent */ }
    },
    enemy: () => { tone(110, 0.1, "sawtooth", 0.08); tone(82, 0.1, "sawtooth", 0.06, 0.08); },
    win: () => { [262, 330, 392, 523].forEach((f, i) => tone(f, 0.2, "triangle", 0.08, i * 0.12)); },
    lose: () => { [330, 294, 262, 247].forEach((f, i) => tone(f, 0.3, "triangle", 0.07, i * 0.2)); },
    gold: () => { tone(1319, 0.04, "sine", 0.05); tone(1568, 0.04, "sine", 0.05, 0.04); },
    heal: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.08, "sine", 0.05, i * 0.06)); },
  };
})();

// === DATA ===
var SUITS = [
  { id: "red", emoji: "🔺", color: "#e64b35" },
  { id: "blue", emoji: "🔷", color: "#4e79a7" },
  { id: "yellow", emoji: "⭐", color: "#f0b930" },
];

const CLASSES = [
  { id: "warrior", icon: "⚔️", name: "전사", suits: { red: "강타", blue: "베기", yellow: "함성" } },
  { id: "ranger", icon: "🗡️", name: "도적", suits: { red: "습격", blue: "연계", yellow: "급소" } },
];

const COMMONS = [
  { id: "fortress", icon: "🛡️", name: "보루", fx: "fortress" },
  { id: "aimed", icon: "🎯", name: "집중타", fx: "aimed" },
  { id: "wild", icon: "🃏", name: "변환", fx: "wild" },
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
  { id: "whet", name: "낡은 숫돌", emoji: "🗡️", desc: "카드당 공격력 +1", tier: 1, eff: { type: "atk", val: 1 } },
  { id: "glove", name: "가죽 장갑", emoji: "🧤", desc: "버리기 횟수 +1", tier: 1, eff: { type: "disc", val: 1 } },
  { id: "dice", name: "도박사의 주사위", emoji: "🎲", desc: "매 전투 시작 시 50% 배율+1 / 50% 배율-0.5", tier: 1, eff: { type: "gamble" } },
  { id: "thorn", name: "가시 갑옷", emoji: "🦔", desc: "피격 시 적에게 2 반사", tier: 1, eff: { type: "thorns", val: 2 } },
  { id: "ruby", name: "루비 반지", emoji: "💍", desc: "🔺카드 공격력 x2", tier: 2, eff: { type: "suitMul", suit: "red", val: 2 } },
  { id: "chain", name: "연쇄의 고리", emoji: "⛓️", desc: "스트레이트 배율 +2", tier: 2, eff: { type: "handAdd", hand: "스트레이트", val: 2 } },
  { id: "eye", name: "감정사의 눈", emoji: "👁️", desc: "등급4↑ 카드 1장당 배율 +2", tier: 2, eff: { type: "gradeAdd", grade: 4, val: 2 } },
  { id: "book2", name: "전쟁의 서", emoji: "📖", desc: "매 전투 첫 제출 시 한도 +1", tier: 3, eff: { type: "submitOnce", val: 1 } },
  { id: "hero", name: "영웅의 증표", emoji: "🏅", desc: "스트레이트 플러시 배율 x2", tier: 3, eff: { type: "handMul", hand: "스트레이트 플러시", val: 2 } },
  { id: "inf", name: "무한의 덱", emoji: "♾️", desc: "매 턴 드로우 +1", tier: 3, eff: { type: "drawAdd", val: 1 } },
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

// Keywords that can be attached to cards
var KEYWORDS = [
  { id: "poison", icon: "☠️", name: "맹독", desc: "등급만큼 매턴 독 데미지" },
  { id: "chain", icon: "⛓️", name: "연쇄", desc: "제출 시 드로우 +1" },
  { id: "growth", icon: "🌱", name: "성장", desc: "제출마다 등급 영구 +1" },
  { id: "resonance", icon: "🔔", name: "공명", desc: "같은 문양 2장+ 시 배율 +0.5" },
];

let nextId = 0;
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

function getEffectiveSuit(card, allCards) {
  if (card.isCommon && card.common.fx === "wild") {
    // Conditional wild: only if 2+ same suit among other cards
    if (allCards) {
      var otherSuits = {};
      allCards.forEach(function(c) {
        if (c.id !== card.id && !c.isCommon) {
          otherSuits[c.suitId] = (otherSuits[c.suitId] || 0) + 1;
        }
      });
      var hasPair = Object.values(otherSuits).some(function(v) { return v >= 2; });
      if (hasPair) return "wild";
    }
    return card.suitId; // fallback: treated as its base suit
  }
  return card.suitId;
}

function detectHand(cards) {
  var len = cards.length;
  if (len === 0) return null;
  if (len === 1) return { name: "하이카드", mult: 1, tier: 1, emoji: "👊" };

  // Use effective grade (grade + growthBonus) for hand detection
  var grades = cards.map(function(c) { return c.grade + (c.growthBonus || 0); }).sort(function(a, b) { return a - b; });
  // Common cards have NO suit for flush/SF purposes (except wild)
  var suits = cards.map(function(c) {
    if (c.isCommon) {
      if (c.common.fx === "wild") return getEffectiveSuit(c, cards);
      return "none";
    }
    return getEffectiveSuit(c, cards);
  });

  var gradeCounts = {};
  grades.forEach(function(g) { gradeCounts[g] = (gradeCounts[g] || 0) + 1; });
  var counts = Object.values(gradeCounts).sort(function(a, b) { return b - a; });

  // Flush: ALL cards must be same suit. Common cards (suit "none") break flush.
  var suitCards = suits.filter(function(s) { return s !== "none" && s !== "wild"; });
  var wildCount = suits.filter(function(s) { return s === "wild"; }).length;
  var isFlush = len === 5 && (suitCards.length + wildCount) === 5 && suitCards.length > 0 && new Set(suitCards).size <= 1;

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
    // Class cards + wild common cards can form a straight flush
    var classCards = cards.filter(function(c) { return !c.isCommon || (c.isCommon && c.common.fx === "wild"); });
    if (classCards.length < 3) return false;
    var suitGroups = {};
    classCards.forEach(function(c) {
      var s = getEffectiveSuit(c, cards);
      if (!suitGroups[s]) suitGroups[s] = [];
      suitGroups[s].push(c.grade + (c.growthBonus || 0));
    });
    var wilds = suitGroups["wild"] || [];
    delete suitGroups["wild"];
    var found = false;
    Object.values(suitGroups).forEach(function(gradeArr) {
      var all = Array.from(new Set(gradeArr.concat(wilds))).sort(function(a, b) { return a - b; });
      if (all.length >= 3) {
        for (var i = 0; i <= all.length - 3; i++) {
          if (all[i + 2] - all[i] === 2) found = true;
        }
      }
    });
    return found;
  }

  if (checkStraightFlush()) return { name: "스트레이트 플러시", mult: 12, tier: 5, emoji: "🌟" };
  if (counts[0] >= 4) return { name: "포카", mult: 8, tier: 4, emoji: "👑" };
  if (len === 5 && uniqueGrades.length === 5 && hasConsecutive(5)) return { name: "스트레이트5", mult: 8, tier: 4, emoji: "⛓️" };
  if (counts[0] === 3 && counts[1] >= 2) return { name: "풀하우스", mult: 6, tier: 4, emoji: "🏠" };
  if (len >= 4 && hasConsecutive(4)) return { name: "스트레이트4", mult: 6, tier: 4, emoji: "🔗" };
  if (isFlush) return { name: "플러시", mult: 5, tier: 3, emoji: "💎" };
  if (counts[0] >= 3) return { name: "트리플", mult: 4, tier: 3, emoji: "🔺" };
  if (len >= 3 && hasConsecutive(3)) return { name: "스트레이트3", mult: 4, tier: 3, emoji: "🔗" };
  if (counts[0] >= 2 && counts[1] >= 2) return { name: "투페어", mult: 3, tier: 2, emoji: "✌️" };
  if (counts[0] >= 2) return { name: "원페어", mult: 2, tier: 2, emoji: "👯" };
  return { name: "하이카드", mult: 1, tier: 1, emoji: "👊" };
}

function calcDamage(cards, hand, relics, passiveState) {
  var atk = 0;
  var extraDraw = 0;
  var hasGrowth = false;
  var suitBonuses = { red: 0, blue: 0, yellow: 0 };
  var dmgReduction = 0;
  var cid = passiveState ? passiveState.classId : "warrior";

  cards.forEach(function(c) {
    var a = c.grade + (c.growthBonus || 0);

    // === Class-specific suit bonuses ===
    if (!c.isCommon) {
      if (cid === "warrior") {
        if (c.suitId === "red") { a += 2; suitBonuses.red += 1; }
        if (c.suitId === "blue") { dmgReduction += 1; suitBonuses.blue += 1; }
        if (c.suitId === "yellow") { suitBonuses.yellow += 1; } // fury bonus handled below
      }
      if (cid === "ranger") {
        if (c.suitId === "red") { suitBonuses.red += 1; }
        if (c.suitId === "blue") { suitBonuses.blue += 1; } // draw bonus handled below
        if (c.suitId === "yellow") { suitBonuses.yellow += 1; } // crit chance
      }
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

  // === Rogue: shadow-based evasion (base 10% + stealth upgrade + 5%/stack, cap 50%) ===
  var evasionChance = 0;
  if (cid === "ranger") {
    var baseEvasion = 10 + (passiveState ? (passiveState.stealthBonus || 0) : 0);
    evasionChance = Math.min(50, baseEvasion + (passiveState ? passiveState.shadow * 5 : 0));
  }

  // === Rogue: check if 1+ red class card submitted (for shadow stacking) ===
  var hasRed = false;
  if (cid === "ranger") {
    var redClassCards = cards.filter(function(c) { return !c.isCommon && c.suitId === "red"; }).length;
    hasRed = redClassCards >= 1;
  }

  // === Rogue 🔷 bonus: draw+1 if 2+ blue cards ===
  if (cid === "ranger" && suitBonuses.blue >= 2) {
    extraDraw += 1;
  }

  // Common card: focus
  cards.forEach(function(c) {
    if (c.isCommon && c.common.fx === "focus") mult += 0.5;
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

  // === Warrior passive: fury ===
  if (passiveState && cid === "warrior" && passiveState.fury > 0) {
    // ⭐ yellow bonus: fury +0.5 per yellow card
    var furyBonus = passiveState.fury + suitBonuses.yellow * 0.5;
    mult *= (1 + furyBonus * 0.15);
  } else if (passiveState && cid === "warrior" && suitBonuses.yellow > 0) {
    // Even without fury stacks, yellow doesn't do anything yet (needs fury > 0)
  }

  // === Rogue passive: shadow stacks → mult bonus ===
  if (passiveState && cid === "ranger" && passiveState.shadow > 0) {
    mult += passiveState.shadow * 0.5;
  }

  // === Gamble relic buff ===
  if (passiveState && passiveState.gambleBuff) {
    mult += passiveState.gambleBuff;
  }

  // === Ranger ⭐ critical hit ===
  var critChance = 0;
  if (cid === "ranger") {
    critChance = Math.min(90, suitBonuses.yellow * 15); // 15% per ⭐ card, cap 90%
  }
  var isCrit = critChance > 0 && Math.random() * 100 < critChance;
  var finalTotal = Math.floor(atk * mult);
  if (isCrit) finalTotal = Math.floor(finalTotal * 1.5);

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
  };
}

// === STYLES ===
var CSS = [
  "@import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Noto+Sans+KR:wght@400;700;900&display=swap');",
  "*{margin:0;padding:0;box-sizing:border-box}",
  ":root{--bg:#0c0c14;--pn:#151525;--cd:#1c1c32;--bd:#2a2a45;--tx:#e8e8f0;--dm:#6b6b8a;--gd:#fbbf24;--rd:#ef4444;--gn:#22c55e;--bl:#3b82f6}",
  "@keyframes popIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}",
  "@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes shake{0%,100%{transform:translateX(0) rotate(0)}10%{transform:translateX(-8px) rotate(-2deg)}30%{transform:translateX(10px) rotate(2deg)}50%{transform:translateX(-10px) rotate(-1deg)}70%{transform:translateX(8px) rotate(1deg)}90%{transform:translateX(-4px) rotate(0)}}",
  "@keyframes shakeHard{0%,100%{transform:translateX(0) rotate(0)}10%{transform:translateX(-14px) rotate(-4deg)}30%{transform:translateX(16px) rotate(3deg)}50%{transform:translateX(-16px) rotate(-3deg)}70%{transform:translateX(12px) rotate(2deg)}90%{transform:translateX(-6px) rotate(-1deg)}}",
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
].join("\n");

// === COMPONENTS ===
function CardView(props) {
  var c = props.card;
  var cls = props.cls;
  var selected = props.selected;
  var small = props.small;
  var disabled = props.disabled;
  var onClick = props.onClick;

  // Burn card special render
  if (c.burning) {
    var bw = small ? 55 : 70;
    var bh = small ? 77 : 98;
    return (
      <div
        onClick={disabled ? undefined : onClick}
        style={{
          width: bw, height: bh,
          background: "linear-gradient(145deg, #7f1d1d, #450a0a)",
          border: "2px solid " + (selected ? "#ef4444" : "#991b1b"),
          borderRadius: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
          cursor: disabled ? "default" : "pointer",
          transform: selected ? "translateY(-12px) scale(1.04)" : "none",
          boxShadow: selected ? "0 10px 22px #ef444433" : "0 0 8px #ef444422",
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: small ? 20 : 24 }}>🔥</span>
        <span style={{ fontSize: small ? 9 : 11, color: "#fca5a5", fontWeight: 700 }}>화상</span>
        <span style={{ fontSize: small ? 8 : 10, color: "#ef4444" }}>제출시 -3HP</span>
      </div>
    );
  }

  var nm = getCardName(c, cls);
  var w = small ? 55 : 70;
  var h = small ? 77 : 98;

  // Common cards get distinct styling
  var isC = c.isCommon;
  var commonBg = isC
    ? (selected ? "linear-gradient(145deg,#2d1f5e44,#1a1040)" : "linear-gradient(145deg,#1e1545,#120e2a)")
    : (selected ? "linear-gradient(145deg," + c.suitColor + "22," + c.suitColor + "11)" : "linear-gradient(145deg,var(--cd),#12121f)");

  var borderColor = c.keyword ? "#a855f7" : isC ? "#7c3aed" : (selected ? c.suitColor : "var(--bd)");
  var transform = selected ? "translateY(-12px) scale(1.04)" : "none";
  var shadow = selected ? "0 10px 22px " + (isC ? "#a855f7" : c.suitColor) + "33" : "0 2px 6px rgba(0,0,0,0.4)";

  // Effect descriptions for common cards
  var fxText = "";
  if (isC) {
    var fxMap = { fortress: "방어막+" + (c.grade + (c.growthBonus || 0)), aimed: "다음턴 제출+1", wild: "조건부 와일드", focus: "배율+0.5", reclaim: "회수" + (c.grade + (c.growthBonus || 0)) + "장", gambit: "50% 배율+1/-0.5" };
    fxText = fxMap[c.common.fx] || "";
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
        gap: small ? 2 : 4,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.15s",
        transform: transform,
        boxShadow: c.keyword ? "0 0 10px #a855f733, " + shadow : shadow,
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
          fontSize: small ? 8 : 10,
          color: "#a78bfa",
          fontWeight: 700,
          letterSpacing: 1,
        }}>
          공용
        </div>
      )}
      {/* Keyword badge */}
      {c.keyword && (
        <div style={{
          position: "absolute",
          top: small ? 2 : 4,
          right: small ? 3 : 5,
          fontSize: small ? 10 : 13,
        }} title={c.keyword.name + ": " + c.keyword.desc}>
          {c.keyword.icon}
        </div>
      )}
      <span style={{ fontSize: small ? 14 : 18 }}>{isC ? c.common.icon : c.suitEmoji}</span>
      <span style={{
        fontSize: small ? 20 : 28,
        fontWeight: 900,
        fontFamily: "'Silkscreen', cursive",
        color: isC ? "#c4b5fd" : c.suitColor,
        lineHeight: 1,
      }}>
        {c.grade + (c.growthBonus || 0)}{(c.enhanceCount || 0) >= 2 ? "⬆⬆" : (c.enhanceCount || 0) >= 1 ? "⬆" : ""}
      </span>
      <span style={{
        fontSize: small ? 8 : 10,
        color: isC ? "#c4b5fd" : "var(--dm)",
        fontWeight: 700,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {nm}
      </span>
      {/* Effect text for common cards */}
      {isC && (
        <span style={{
          fontSize: small ? 8 : 10,
          color: "#94a3b8",
          fontFamily: "'Noto Sans KR', sans-serif",
          background: "#ffffff0a",
          borderRadius: 4,
          padding: "1px 5px",
        }}>
          {fxText}
        </span>
      )}
      {/* Suit indicator for common cards (small dot) */}
      {isC && (
        <span style={{ fontSize: small ? 8 : 10 }}>{c.suitEmoji}</span>
      )}
    </div>
  );
}

function HpBar(props) {
  var pct = Math.max(0, (props.current / props.max) * 100);
  var barColor = pct > 50 ? "var(--gn)" : pct > 25 ? "#f59e0b" : "var(--rd)";
  var anim = props.shaking ? (props.hardShake ? "shakeHard 0.5s ease" : "shake 0.4s ease") : props.enemyAttacking ? "enemyAtk 0.5s ease" : "none";
  var barWidth = props.isPlayer ? 200 : 240;
  var barHeight = props.isPlayer ? 14 : 16;
  var emojiSize = props.boss ? 48 : props.isPlayer ? 32 : 40;
  var nameSize = props.boss ? 18 : props.isPlayer ? 14 : 16;

  return (
    <div style={{ textAlign: "center", animation: anim }}>
      <div style={{
        fontSize: emojiSize,
        marginBottom: 3,
        animation: props.isPlayer ? "none" : "floatY 3s ease infinite",
      }}>
        {props.emoji}
      </div>
      <div style={{
        fontSize: nameSize,
        fontWeight: 700,
        marginBottom: 3,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {props.name}
        {props.boss && <span style={{ color: "var(--gd)", fontSize: 13, marginLeft: 4 }}>BOSS</span>}
        {props.miniboss && <span style={{ color: "#f97316", fontSize: 13, marginLeft: 4 }}>중간보스</span>}
      </div>
      <div style={{
        width: barWidth,
        height: barHeight,
        background: "#1a1a30",
        borderRadius: 7,
        overflow: "hidden",
        margin: "0 auto",
        border: "1px solid var(--bd)",
      }}>
        <div style={{
          width: pct + "%",
          height: "100%",
          background: "linear-gradient(90deg," + barColor + "," + barColor + "bb)",
          borderRadius: 7,
          transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{
        fontSize: 14,
        color: "var(--dm)",
        marginTop: 2,
        fontFamily: "'Silkscreen', cursive",
      }}>
        {Math.max(0, props.current)}/{props.max}
      </div>
    </div>
  );
}

function Btn(props) {
  var isDisabled = props.disabled;
  var color = props.color || "var(--bd)";
  return (
    <button
      onClick={isDisabled ? undefined : props.onClick}
      style={Object.assign({
        padding: "8px 16px",
        background: isDisabled ? "#1a1a2a" : color,
        border: "none",
        borderRadius: 10,
        color: "var(--tx)",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "'Noto Sans KR', sans-serif",
        cursor: isDisabled ? "default" : "pointer",
        opacity: isDisabled ? 0.3 : 1,
        transition: "all 0.15s",
        boxShadow: isDisabled ? "none" : "0 3px 8px rgba(0,0,0,0.25)",
      }, props.style || {})}
    >
      {props.children}
    </button>
  );
}

function DeckViewer(props) {
  var dk = props.deck;
  var cls = props.cls;
  var show = props.show;
  var onClose = props.onClose;
  var sortMode = props.sortMode;
  var onSort = props.onSort;

  if (!show) return null;

  var suitOrder = { red: 0, blue: 1, yellow: 2 };
  var sorted = dk.slice();

  if (sortMode === "grade") {
    sorted.sort(function(a, b) {
      var ga = a.grade + (a.growthBonus || 0);
      var gb = b.grade + (b.growthBonus || 0);
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
  var groups = [];
  var curGroup = null;
  sorted.forEach(function(c) {
    var key = "";
    var label = "";
    if (sortMode === "grade") {
      var g = c.grade + (c.growthBonus || 0);
      key = "g" + g;
      label = "등급 " + g;
    } else {
      if (c.isCommon) {
        key = "common-" + c.common.id;
        label = c.common.icon + " " + c.common.name;
      } else {
        key = "suit-" + c.suitId;
        var suit = SUITS.find(function(s) { return s.id === c.suitId; });
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
        style={{ background: "var(--pn)", borderRadius: 14, padding: 22, maxWidth: 860, width: "94%", maxHeight: "85vh", overflow: "auto", border: "1px solid var(--bd)" }}
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
                background: sortMode === "type" ? "#7c3aed" : "var(--bd)",
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
                background: sortMode === "grade" ? "#7c3aed" : "var(--bd)",
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

// === MAIN GAME ===
var UPGRADES = [
  { id: "hp", name: "생명력", icon: "❤️", desc: "HP +5", cost: 3, max: 2, tier: "basic" },
  { id: "sharp", name: "강화", icon: "🗡️", desc: "시작 시 중립카드 전체 등급+1", cost: 4, max: 1, tier: "basic" },
  { id: "stealth", name: "은신", icon: "🌑", desc: "기본 회피 +5%", cost: 3, max: 2, tier: "basic" },
  { id: "merchant", name: "노련한 상인", icon: "🏪", desc: "상점 가격 20% 할인", cost: 6, max: 1, tier: "advanced" },
  { id: "loot", name: "약탈", icon: "💰", desc: "매 전투 승리 골드 +3", cost: 6, max: 2, tier: "advanced" },
  { id: "awaken", name: "각성", icon: "🌑", desc: "시작 시 그림자 x1", cost: 10, max: 1, tier: "advanced" },
  { id: "tenacity", name: "집념", icon: "💀", desc: "HP 0 시 1회 HP 1로 부활", cost: 12, max: 1, tier: "advanced" },
];

var BOSS_POINTS = { 3: 1, 7: 2, 11: 3, 15: 4, 19: 6 }; // monster index (0-based) → points

export default function DungeonHand() {
  var s = useState;
  var [screen, setScreen] = s("menu");
  var [classId, setClassId] = s(null);
  var [floor, setFloor] = s(1);
  var [battleNum, setBattleNum] = s(1);
  var [gold, setGold] = s(0);
  var [hp, setHp] = s(70);
  // Meta progression (persists across runs)
  var [metaPoints, setMetaPoints] = s(0);
  var [upgradeLevels, setUpgradeLevels] = s({ hp: 0, sharp: 0, stealth: 0, merchant: 0, loot: 0, awaken: 0, tenacity: 0 });
  var [bossesKilled, setBossesKilled] = s([]); // track boss kills this run for points
  var MAX_HP = 70 + upgradeLevels.hp * 5;
  var [relics, setRelics] = s([]);
  var [deck, setDeck] = s([]);
  var [drawPile, setDrawPile] = s([]);
  var [hand, setHand] = s([]);
  var [discardPile, setDiscardPile] = s([]);
  var [selected, setSelected] = s([]);
  var [monster, setMonster] = s(null);
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
  var [fury, setFury] = s(0); // warrior: fury stacks
  var [lastSuit, setLastSuit] = s(null); // warrior: last submitted suit
  var [shadow, setShadow] = s(0); // rogue: shadow stacks (consecutive evades)
  var [aimedBonus, setAimedBonus] = s(0); // aimed shot: next turn submit +1
  var [shield, setShield] = s(0); // fortress: damage reduction next turn
  var [gambleBuff, setGambleBuff] = s(0); // dice relic: +1 or -0.5 mult
  var [gambleAnim, setGambleAnim] = s(null); // roulette animation text
  var [poison, setPoison] = s(0); // poison on monster: dmg per turn
  var [erodedIds, setErodedIds] = s([]); // eroded card ids (grade temporarily -1)
  var [tenacityUsed, setTenacityUsed] = s(false); // tenacity: revive once per run
  var [frozenIds, setFrozenIds] = s([]); // frozen card ids
  var [bossDialogue, setBossDialogue] = s(null); // boss/miniboss dialogue text
  var [encounterOverlay, setEncounterOverlay] = s(null); // boss encounter overlay { emoji, name, boss }
  var [book2Used, setBook2Used] = s(false); // book2: once per battle submit bonus
  var [splitMon, setSplitMon] = s(null); // split monster waiting
  var [passiveMsg, setPassiveMsg] = s(null); // passive trigger message
  var [deckView, setDeckView] = s(false);
  var [deckSort, setDeckSort] = s("type");
  var [newCardIds, setNewCardIds] = s([]);
  var [discardedRelicIds, setDiscardedRelicIds] = s([]); // 영구 삭제된 유물 id
  var [pendingRelic, setPendingRelic] = s(null);          // 교체 대기 중인 유물
  var [pendingRelicCost, setPendingRelicCost] = s(0);     // 상점 교체 대기 중 미차감 비용
  var [relicSwapContext, setRelicSwapContext] = s(null);   // "boss" | "shop"

  var HAND_SIZE = 5;
  var MAX_HAND = 7;
  var RELIC_SLOTS = 3;
  var BASE_SUBMIT = 3;

  var classData = CLASSES.find(function(c) { return c.id === classId; }) || CLASSES[0];
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
    setGold(0); // 약탈 효과는 매 전투 승리 시 적용
    var maxHp = 70 + upgradeLevels.hp * 5;
    setHp(maxHp);
    setRelics([]);
    setDiscardedRelicIds([]);
    setPendingRelic(null);
    setRelicSwapContext(null);
    setFloor(1);
    setBattleNum(1);
    setBossesKilled([]);
    // 🔥 각성: start with fury/shadow
    if (upgradeLevels.awaken > 0) {
      if (cid === "warrior") {
        setFury(1);
        setLastSuit(null); // first submit sets lastSuit, fury won't reset if same suit
      } else {
        setFury(0);
      }
      setShadow(cid === "ranger" ? 1 : 0);
    } else {
      setFury(0);
      setShadow(0);
    }
    setLastSuit(null);
    setPoison(0);
    setErodedIds([]);
    setTenacityUsed(false);
    beginBattle(d, [], 1, 1);
    if (sfx.getOn()) sfx.bgmOn();
  }

  function beginBattle(curDeck, curRelics, fl, bn) {
    // battleNum: 1,2=normal 3=campfire 4=miniboss 5=boss
    // Monster index mapping: bn1→0, bn2→1, bn4→2, bn5→3
    var monMap = { 1: 0, 2: 1, 4: 2, 5: 3 };
    var mi = monMap[bn];
    if (mi === undefined) return; // campfire, no monster
    var idx = (fl - 1) * 4 + mi;
    var m = MONSTERS[idx] || MONSTERS[0];
    var mhp = Math.floor(m.hp * (1 + (fl - 1) * 0.45));
    var matk = Math.floor(m.atk * (1 + (fl - 1) * 0.1));
    setMonster({ name: m.name, emoji: m.emoji, hp: mhp, maxHp: mhp, atk: matk, boss: m.boss, miniboss: m.miniboss, freeze: m.freeze || 0, erode: m.erode || 0, burn: m.burn || 0, split: m.split || false, hasSplit: false });
    var discBonus = curRelics.reduce(function(sum, r) {
      return r.eff.type === "disc" ? sum + r.eff.val : sum;
    }, 0);
    setDiscards(2 + discBonus);
    setRoundNum(1);
    setDamageInfo(null);
    setCurrentHand(null);
    setSelected([]);
    setBusy(false);
    setEnemyDmgShow(null);
    // Reset battle-scoped passives
    // (fury and lastSuit persist across battles)
    setFrozenIds([]);
    setSplitMon(null);
    setAimedBonus(0);
    setBook2Used(false);
    setBossDialogue(null);
    setShield(0);
    setPoison(0);
    setErodedIds([]);
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

    var t = 0; // running delay (ms)
    var laterTimers = []; // Phase 4/5 timer IDs, cleared on ambush death

    // Phase 1: Encounter overlay (boss/miniboss only)
    if (m.boss || m.miniboss) {
      setEncounterOverlay({ emoji: m.emoji, name: m.name, boss: !!m.boss });
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
      var ambushDmg = matk + Math.floor(Math.random() * 3);
      setTimeout(function() {
        showPassive("⚡ 기습! " + m.name + "의 선제 공격!");
        sfx.enemy();
        setEnemyAttacking(true);
        setPlayerShake(true);
        setEnemyDmgShow(ambushDmg);
        setHp(function(prev) {
          if (prev - ambushDmg <= 0) {
            if (upgradeLevels.tenacity > 0 && !tenacityUsed) {
              setTenacityUsed(true);
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
    var hasGamble = curRelics.some(function(r) { return r.eff.type === "gamble"; });
    if (hasGamble) {
      var roll = Math.random() < 0.5 ? 1 : -0.5;
      var options = ["+1", "-0.5", "+1", "-0.5", "+1", "-0.5"];
      laterTimers.push(setTimeout(function() {
        var tick = 0;
        var interval = setInterval(function() {
          setGambleAnim("🎲 " + options[tick % options.length]);
          tick++;
          if (tick >= 8) {
            clearInterval(interval);
            setGambleBuff(roll);
            setGambleAnim(roll > 0 ? "🎲 배율+1! 🎉" : "🎲 배율-0.5... 💀");
            setTimeout(function() { setGambleAnim(null); }, 1200);
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
        sfx.card();
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
    var pState2 = { classId: classId, fury: fury, shadow: shadow, stealthBonus: upgradeLevels.stealth * 5, gambleBuff: gambleBuff };
    previewDmg = calcDamage(previewCards, preview, relics, pState2);
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
      var burnDmg = burnPlayed.length * 3;
      setHp(function(prev) {
        if (prev - burnDmg <= 0) {
          if (upgradeLevels.tenacity > 0 && !tenacityUsed) {
            setTenacityUsed(true);
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
    var pState = { classId: classId, fury: fury, shadow: shadow, stealthBonus: upgradeLevels.stealth * 5, gambleBuff: gambleBuff };
    var dmg = calcDamage(played, h, relics, pState);

    // === 투기(gambit): 50% 배율+1.0, 50% 배율-0.5 ===
    var gambitPlayed = played.filter(function(c) { return c.isCommon && c.common.fx === "gambit"; });
    if (gambitPlayed.length > 0) {
      var gambitWin = Math.random() < 0.5;
      if (gambitWin) {
        dmg.mult = Math.round((dmg.mult + 1.0) * 10) / 10;
      } else {
        dmg.mult = Math.max(1, Math.round((dmg.mult - 0.5) * 10) / 10);
      }
      dmg.total = Math.floor(dmg.atk * dmg.mult);
      if (dmg.isCrit) dmg.total = Math.floor(dmg.total * 1.5);
    }

    // === Apply poison from previous turns ===
    // (poison damage applied before attack in submitCards)

    // === Poison keyword: accumulate poison on monster ===
    var poisonAmt = played.reduce(function(sum, c) {
      if (c.keyword && c.keyword.id === "poison") return sum + c.grade + (c.growthBonus || 0);
      return sum;
    }, 0);
    if (poisonAmt > 0) {
      setPoison(function(p) { return p + poisonAmt; });
    }

    // === Update Warrior Passive: Fury ===
    if (classId === "warrior") {
      var dominantSuit = null;
      var suitCounts = {};
      played.forEach(function(c) {
        if (!c.isCommon) {
          suitCounts[c.suitId] = (suitCounts[c.suitId] || 0) + 1;
          if (!dominantSuit || suitCounts[c.suitId] > suitCounts[dominantSuit]) dominantSuit = c.suitId;
        }
      });
      if (dominantSuit && lastSuit && dominantSuit === lastSuit) {
        var newFury = fury + 1;
        setFury(newFury);
        showPassive("🔥 분노 x" + newFury + "! 데미지 +" + Math.round(newFury * 15) + "%");
      } else if (dominantSuit && lastSuit) {
        if (dominantSuit !== lastSuit && fury > 0) {
          setFury(0);
          showPassive("💨 분노 초기화...");
        }
      }
      setLastSuit(dominantSuit);
    }

    // === Rogue: shadow stacking (2+ 🔺) or reset ===
    if (classId === "ranger") {
      if (dmg.hasRed) {
        var newShadow = shadow + 1;
        setShadow(newShadow);
        var evPct = Math.min(50, 10 + newShadow * 5);
        showPassive("🌑 그림자 x" + newShadow + "! 배율+" + (newShadow * 0.5).toFixed(1) + " 회피" + evPct + "%");
      } else if (shadow > 0) {
        setShadow(0);
        showPassive("💨 그림자 소멸... (🔺 포함 필요)");
      }
    }

    var fortressAmt = played.reduce(function(sum, c) {
      if (c.isCommon && c.common.fx === "fortress") return sum + c.grade + (c.growthBonus || 0);
      return sum;
    }, 0);
    // Fortress sets shield for NEXT turn (consumed this turn's shield already in enemyTurn)
    setShield(fortressAmt);
    setCurrentHand(h);
    setDamageInfo(dmg);
    sfx.hit(h.tier);
    if (h.tier >= 3 || dmg.isCrit) {
      setMonShake(true);
      setMonShakeHard(h.tier >= 4 || dmg.isCrit);
    }

    // Suit bonus: ⭐ crit
    if (dmg.isCrit) {
      showPassive("💥 급소! 치명타 x1.5!");
    }

    // Build suit bonus message (class-specific)
    var suitMsgs = [];
    if (classId === "warrior") {
      if (dmg.suitBonuses.red > 0) suitMsgs.push("🔺공격+" + (dmg.suitBonuses.red * 2));
      if (dmg.suitBonuses.blue > 0) suitMsgs.push("🔷방어-" + dmg.dmgReduction);
      if (dmg.suitBonuses.yellow > 0) suitMsgs.push("⭐분노 강화");
    }
    if (classId === "ranger") {
      if (dmg.hasRed) suitMsgs.push("🔺포함→그림자+1");
      if (dmg.suitBonuses.blue >= 2) suitMsgs.push("🔷드로우+1");
      if (dmg.suitBonuses.yellow > 0) suitMsgs.push("⭐급소" + dmg.critChance + "%");
    }

    // Show relic triggers and suit bonuses
    var allTriggers = (dmg.relicTriggers || []).concat(suitMsgs);
    if (allTriggers.length > 0) {
      setTimeout(function() {
        showPassive(allTriggers.join(" | "));
      }, 600);
    }
    if (fortressAmt > 0) {
      showPassive("🛡️ 보루! 다음 턴 피격 -" + fortressAmt);
    }
    // === 투기 결과 표시 ===
    if (gambitPlayed.length > 0) {
      if (gambitWin) {
        showPassive("🎰 투기 성공! 배율+1.0");
      } else {
        showPassive("🎰 투기 실패... 배율-0.5");
      }
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
          setSplitMon({ name: "마법 골렘", emoji: "🗿", hp: spawnHp, maxHp: spawnHp, atk: Math.floor(prev.atk * 0.6), freeze: 1 });
          showPassive("💥 분열! 마법 골렘 출현!");
          setTimeout(function() { enemyTurn(Object.assign({}, prev, { hp: splitHp, hasSplit: true }), played, dmg); }, 800);
          return Object.assign({}, prev, { hp: splitHp, hasSplit: true });
        }

        // Monster killed
        if (newHp <= 0) {
          // Check if split monster is waiting
          if (splitMon) {
            setMonster(splitMon);
            setSplitMon(null);
            showPassive("⚔️ " + splitMon.name + " 등장!");
            setTimeout(function() { enemyTurn(splitMon, played, dmg); }, 800);
            return splitMon;
          }
          setTimeout(function() { onMonsterDied(); }, 400);
          return Object.assign({}, prev, { hp: 0 });
        }
        setTimeout(function() { enemyTurn(Object.assign({}, prev, { hp: newHp }), played, dmg); }, 800);
        return Object.assign({}, prev, { hp: newHp });
      });
    }, 700);
  }

  function enemyTurn(mon, played, dmgResult) {
    // === ☠️ Poison tick ===
    if (poison > 0) {
      setMonster(function(prev) {
        var newHp = Math.max(0, prev.hp - poison);
        if (newHp <= 0) {
          setTimeout(function() { onMonsterDied(); }, 300);
          return Object.assign({}, prev, { hp: 0 });
        }
        return Object.assign({}, prev, { hp: newHp });
      });
      showPassive("☠️ 독 데미지 " + poison + "!");
    }

    var atkDmg = mon.atk + Math.floor(Math.random() * 3);

    // === Warrior 🔷 blue: damage reduction ===
    if (dmgResult && dmgResult.dmgReduction > 0) {
      atkDmg = Math.max(0, atkDmg - dmgResult.dmgReduction);
    }

    // === 🛡️ Fortress shield ===
    if (shield > 0) {
      atkDmg = Math.max(0, atkDmg - shield);
      showPassive("🛡️ 보루! 피격 -" + shield);
      setShield(0);
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
        setShadow(function(prev) {
          var ns = prev + 1;
          showPassive("🗡️ 회피! 그림자 x" + ns + " (배율+" + (ns * 0.5).toFixed(1) + ")");
          return ns;
        });
      } else {
        setPlayerShake(true);
        setEnemyDmgShow(atkDmg);
        if (shadow > 0 && classId === "ranger") {
          setShadow(0);
          showPassive("💨 피격! 그림자 소멸...");
        }
        setHp(function(prev) {
          if (prev - atkDmg <= 0) {
            // 💀 Tenacity: revive once
            if (upgradeLevels.tenacity > 0 && !tenacityUsed) {
              setTenacityUsed(true);
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
            sfx.card();
            setHand(function(prev) { return prev.concat([card]); });
            setNewCardIds(function(prev) { return prev.concat([card.id]); });
          }, (idx + 1) * 120);
        });

        // Clear animation flags & unlock after all drawn
        var allNewHand = remain.concat(drawn);
        setTimeout(function() {
          setNewCardIds([]);

          // === Freeze mechanic ===
          var freezeCount = monster ? (monster.freeze || 0) : 0;
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
          var erodeCount = monster ? (monster.erode || 0) : 0;
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
          var burnCount = monster ? (monster.burn || 0) : 0;
          if (burnCount > 0 && allNewHand.length < MAX_HAND) {
            var burnCards = [];
            for (var bi = 0; bi < burnCount; bi++) {
              burnCards.push({ id: nextId++, suitId: "red", suitColor: "#e64b35", grade: 0, isCommon: false, burning: true, growthBonus: 0, keyword: null });
            }
            setHand(function(prev) { return prev.concat(burnCards); });
            showPassive("🔥 화상! " + burnCount + "장 주입!");
          }

          setBusy(false);
          setRoundNum(function(r) { return r + 1; });
        }, (drawn.length + 1) * 120 + 100);
      }, 500);
    }, 300);
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
    var monMap = { 1: 0, 2: 1, 4: 2, 5: 3 };
    var mi = monMap[battleNum];
    var monIdx = (floor - 1) * 4 + (mi || 0);
    if (battleNum === 5 && BOSS_POINTS[monIdx] !== undefined) {
      var pts = BOSS_POINTS[monIdx];
      setBossesKilled(function(prev) { return prev.concat([pts]); });
    }
    var isBoss = battleNum === 5;
    var lootBonus = upgradeLevels.loot * 3;
    var earned = (isBoss ? 15 : battleNum === 4 ? 10 : 6) + Math.floor(Math.random() * 8) + lootBonus;
    setGold(function(g) { return g + earned; });
    sfx.gold();
    if (isBoss) {
      var avail = RELICS.filter(function(r) {
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
    var kwChance = isBoss ? 0.6 : 0.3;
    // Floor-scaled grade with weighted distribution
    // 50% base, 30% base+1, 15% base+2, 5% base+3 (rare)
    function rollGrade() {
      var base = floor;
      var roll = Math.random();
      var g;
      if (roll < 0.50) g = base;
      else if (roll < 0.80) g = base + 1;
      else if (roll < 0.95) g = base + 2;
      else g = base + 3;
      if (isBoss) g += 1;
      return Math.max(1, Math.min(g, 10));
    }
    for (var i = 0; i < 2; i++) {
      var s2 = pickN(SUITS, 1)[0];
      var g2 = rollGrade();
      var kw = Math.random() < kwChance ? pickKw(g2) : null;
      pool.push(makeCard(s2.id, g2, classId, null, kw));
    }
    var ct = pickN(REWARD_COMMONS, 1)[0];
    var s3 = pickN(SUITS, 1)[0];
    var g3 = rollGrade();
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
    var newDeck = deck.concat([Object.assign({}, card, { id: nextId++ })]);
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
      } else {
        beginBattle(d, relics, floor, nb);
        if (sfx.getOn()) sfx.bgmOn();
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
      // Weighted: 50% base, 30% +1, 15% +2, 5% +3
      var base = floor + 1; // shop premium
      var roll = Math.random();
      var g;
      if (roll < 0.50) g = base;
      else if (roll < 0.80) g = base + 1;
      else if (roll < 0.95) g = base + 2;
      else g = base + 3;
      g = Math.max(1, Math.min(g, 10));
      var kw = (i < 2 && Math.random() < 0.5) ? pickKw(g) : null;
      if (Math.random() < 0.3) {
        pool.push(makeCard(s2.id, g, classId, pickN(REWARD_COMMONS, 1)[0], kw));
      } else {
        pool.push(makeCard(s2.id, g, classId, null, kw));
      }
    }
    setShopCards(pool);
    var rels = currentRelics || relics;
    var avail = RELICS.filter(function(r) {
      if (rels.find(function(o) { return o.id === r.id; })) return false;
      if (discardedRelicIds.indexOf(r.id) >= 0) return false;
      if (r.id === "hero" && Math.random() > 0.5) return false;
      return true;
    });
    setShopRelic(avail.length > 0 ? pickN(avail, 1)[0] : null);
    setShopHealed(false);
    setShopRemoved(0);
    setScreen("shop");
  }

  function buyCard(card, cost) {
    if (gold < cost) return;
    sfx.gold();
    setGold(function(g) { return g - cost; });
    setDeck(function(d) { return d.concat([Object.assign({}, card, { id: nextId++ })]); });
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
    if (gold < cost || deck.length <= 10 || shopRemoved >= 2) return;
    setGold(function(g) { return g - cost; });
    setDeck(function(d) { return d.filter(function(x) { return x.id !== card.id; }); });
    setShopRemoved(function(n) { return n + 1; });
  }

  function leaveShop() {
    if (floor >= 5) {
      sfx.win();
      setScreen("victory");
      return;
    }
    var nextFloor = floor + 1;
    setFloor(nextFloor);
    setBattleNum(1);
    beginBattle(deck, relics, nextFloor, 1);
    if (sfx.getOn()) sfx.bgmOn();
  }

  function enhanceCard(card) {
    var newDeck = deck.map(function(c) {
      return c.id === card.id ? Object.assign({}, c, { grade: c.grade + 1, enhanceCount: (c.enhanceCount || 0) + 1 }) : c;
    });
    setDeck(newDeck);
    advanceBattle(newDeck);
  }

  // === WRAPPER STYLE (iPhone 14 Pro Portrait: 393x852 CSS px) ===
  var wrapStyle = {
    width: "100%",
    height: "100vh",
    maxHeight: "100vh",
    margin: "0 auto",
    background: "var(--bg)",
    color: "var(--tx)",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: 15,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  // === AUDIO BUTTON ===
  var audioButton = (
    <div
      onClick={toggleAudio}
      style={{
        position: "fixed", top: 10, right: 10, zIndex: 999,
        background: "var(--pn)", border: "1px solid var(--bd)",
        borderRadius: "50%", width: 38, height: 38,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 14,
      }}
    >
      {audioOn ? "🔊" : "🔇"}
    </div>
  );

  // === RELIC SWAP OVERLAY ===
  if (pendingRelic) {
    var prBorder = pendingRelic.tier >= 3 ? "var(--gd)" : pendingRelic.tier >= 2 ? "#a855f7" : "var(--bd)";
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--cd)", border: "1px solid var(--bd)", borderRadius: 16, padding: 24, maxWidth: 340, width: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>인벤토리가 가득 찼습니다!</div>
            <div style={{ fontSize: 13, color: "var(--dm)" }}>새 유물을 장착하려면 기존 유물 하나를 교체하세요</div>
            <div style={{ padding: 14, background: "linear-gradient(145deg,var(--cd),#12121f)", border: "2px solid " + prBorder, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: "80%" }}>
              <span style={{ fontSize: 28 }}>{pendingRelic.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{pendingRelic.name}</span>
              <span style={{ fontSize: 13, color: "var(--dm)", textAlign: "center" }}>{pendingRelic.desc}</span>
              <span style={{ fontSize: 11, color: "#22c55e" }}>NEW</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>교체할 유물을 선택하세요:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {relics.map(function(r) {
                var bCol = r.tier >= 3 ? "var(--gd)" : r.tier >= 2 ? "#a855f7" : "var(--bd)";
                return (
                  <div
                    key={r.id}
                    onClick={function() { swapRelic(r); }}
                    style={{ width: 90, padding: 10, background: "linear-gradient(145deg,var(--cd),#12121f)", border: "2px solid " + bCol, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 22 }}>{r.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{r.name}</span>
                    <span style={{ fontSize: 10, color: "var(--dm)", textAlign: "center" }}>{r.desc}</span>
                  </div>
                );
              })}
            </div>
            <Btn onClick={discardPendingRelic} style={{ marginTop: 6, background: "#7f1d1d" }}>버리기 (영구 삭제)</Btn>
          </div>
        </div>
      </div>
    );
  }

  // === SCREENS ===
  if (screen === "village") {
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflow: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16 }}>🏘️ 마을 상점</h2>
            <div style={{ fontSize: 14, color: "#f97316", fontWeight: 700 }}>⭐ {metaPoints} 포인트</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, color: "var(--dm)", marginBottom: 8 }}>기본 업그레이드</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {UPGRADES.filter(function(u) { return u.tier === "basic"; }).map(function(u) {
                var lv = upgradeLevels[u.id];
                var maxed = lv >= u.max;
                var actualCost = u.cost + lv * Math.ceil(u.cost * 0.5);
                var canBuy = metaPoints >= actualCost && !maxed;
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: maxed ? "#22c55e11" : "var(--cd)", border: "1px solid " + (maxed ? "#22c55e44" : "var(--bd)"), borderRadius: 8, padding: "8px 12px" }}>
                    <div>
                      <span style={{ fontSize: 14 }}>{u.icon}</span>
                      <span style={{ fontWeight: 700, marginLeft: 6 }}>{u.name}</span>
                      <span style={{ color: "var(--dm)", fontSize: 13, marginLeft: 8 }}>{u.desc}</span>
                      <span style={{ color: "#a855f7", fontSize: 14, marginLeft: 8 }}>Lv.{lv}/{u.max}</span>
                    </div>
                    {maxed ? (
                      <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>MAX</span>
                    ) : (
                      <Btn
                        onClick={function() {
                          if (!canBuy) return;
                          setMetaPoints(function(p) { return p - actualCost; });
                          setUpgradeLevels(function(prev) {
                            var n = Object.assign({}, prev);
                            n[u.id] = (n[u.id] || 0) + 1;
                            return n;
                          });
                        }}
                        disabled={!canBuy}
                        style={{ padding: "4px 12px", fontSize: 13 }}
                      >
                        {actualCost}p
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, color: "var(--dm)", marginBottom: 8 }}>고급 업그레이드</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {UPGRADES.filter(function(u) { return u.tier === "advanced"; }).map(function(u) {
                var lv = upgradeLevels[u.id];
                var maxed = lv >= u.max;
                var actualCost = u.cost + lv * Math.ceil(u.cost * 0.5);
                var canBuy = metaPoints >= actualCost && !maxed;
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: maxed ? "#22c55e11" : "var(--cd)", border: "1px solid " + (maxed ? "#22c55e44" : "var(--bd)"), borderRadius: 8, padding: "8px 12px" }}>
                    <div>
                      <span style={{ fontSize: 14 }}>{u.icon}</span>
                      <span style={{ fontWeight: 700, marginLeft: 6 }}>{u.name}</span>
                      <span style={{ color: "var(--dm)", fontSize: 13, marginLeft: 8 }}>{u.desc}</span>
                      <span style={{ color: "#a855f7", fontSize: 14, marginLeft: 8 }}>Lv.{lv}/{u.max}</span>
                    </div>
                    {maxed ? (
                      <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>MAX</span>
                    ) : (
                      <Btn
                        onClick={function() {
                          if (!canBuy) return;
                          setMetaPoints(function(p) { return p - actualCost; });
                          setUpgradeLevels(function(prev) {
                            var n = Object.assign({}, prev);
                            n[u.id] = (n[u.id] || 0) + 1;
                            return n;
                          });
                        }}
                        disabled={!canBuy}
                        style={{ padding: "4px 12px", fontSize: 13 }}
                      >
                        ⭐{actualCost}
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Btn onClick={function() { setScreen("menu"); }} color="var(--rd)" style={{ padding: "10px 32px" }}>⚔️ 던전으로</Btn>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "menu") {
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 48, animation: "popIn 0.5s ease" }}>🗡️</div>
          <h1 style={{ fontSize: 28, fontFamily: "'Silkscreen', cursive", background: "linear-gradient(135deg,#fbbf24,#ef4444,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textAlign: "center", lineHeight: 1.5 }}>
            DUNGEON HAND
          </h1>
          <p style={{ color: "var(--dm)", fontSize: 13 }}>도적의 카드로 던전을 정복하라!</p>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Btn onClick={function() { setScreen("classSelect"); }} color="var(--rd)" style={{ fontSize: 14, padding: "14px 32px" }}>
              ⚔️ 던전 입장
            </Btn>
            <Btn onClick={function() { setScreen("village"); }} color="#22c55e" style={{ fontSize: 14, padding: "14px 32px" }}>
              🏘️ 마을
            </Btn>
          </div>
          {metaPoints > 0 && (
            <div style={{ color: "#f97316", fontSize: 14 }}>⭐ {metaPoints} 포인트 보유</div>
          )}
        </div>
      </div>
    );
  }

  if (screen === "classSelect") {
    var rangerClass = CLASSES.find(function(c) { return c.id === "ranger"; });
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <h2 style={{ fontSize: 16 }}>🗡️ 도적으로 던전에 입장</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {CLASSES.map(function(c) {
              var isLocked = c.id === "warrior";
              var passiveDesc = { warrior: "🔥 같은 색 연속 → 분노", ranger: "🌑 🔺포함 → 그림자" };
              var suitLines = {
                warrior: ["🔺 공격+2", "🔷 방어-1", "⭐ 분노강화"],
                ranger: ["🔺 그림자+1", "🔷 드로우+1", "⭐ 급소 15%/장"],
              };
              return (
                <div
                  key={c.id}
                  onClick={isLocked ? undefined : function() { startRun(c.id); }}
                  style={{ width: 200, background: isLocked ? "#1a1a2a" : "linear-gradient(145deg,var(--cd),#12121f)", border: "2px solid " + (isLocked ? "#333" : "var(--bd)"), borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: isLocked ? "not-allowed" : "pointer", opacity: isLocked ? 0.4 : 1, padding: "16px 12px" }}
                >
                  <span style={{ fontSize: 42 }}>{isLocked ? "🔒" : c.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                  {isLocked ? (
                    <div style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
                      확장팩에서 해금
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: "#a855f7", textAlign: "center", lineHeight: 1.4 }}>
                        {passiveDesc[c.id]}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--dm)", textAlign: "center", lineHeight: 1.6 }}>
                        {suitLines[c.id].join("  ")}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "campfire") {

    // Generate event once when entering phase 3
    function enterPhase2() {
      setHp(function(h) { return Math.min(MAX_HP, h + 10); });
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
      if (sfx.getOn()) sfx.bgmOn();
    }

    function resolveCampfire() {
      if (!campEvent) return;
      var evtId = campEvent.id;

      if (evtId === "fairy") {
        if (classId === "warrior") {
          setFury(function(f) { return f + 1; });
        } else {
          setShadow(function(s2) { return s2 + 1; });
        }
      }
      if (evtId === "rest") {
        setHp(function(h) { return Math.min(MAX_HP, h + 5); });
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
        var ambushIdx = (floor - 1) * 4;
        var am = MONSTERS[ambushIdx];
        var amhp = Math.floor(am.hp * (1 + (floor - 1) * 0.45));
        var amatk = Math.floor(am.atk * (1 + (floor - 1) * 0.1));
        setMonster({ name: am.name, emoji: am.emoji, hp: amhp, maxHp: amhp, atk: amatk, boss: false, freeze: am.freeze || 0, erode: am.erode || 0, burn: am.burn || 0, split: false, hasSplit: false });
        var discBonus = relics.reduce(function(sum, r) { return r.eff.type === "disc" ? sum + r.eff.val : sum; }, 0);
        setDiscards(2 + discBonus);
        setRoundNum(1);
        setDamageInfo(null);
        setCurrentHand(null);
        setSelected([]);
        setBusy(false);
        setEnemyDmgShow(null);
        setFrozenIds([]);
        setSplitMon(null);
        setBook2Used(false);
        setNewCardIds([]);
        var shuffled = shuffle(deck);
        setDrawPile(shuffled.slice(HAND_SIZE));
        setHand(shuffled.slice(0, HAND_SIZE));
        setDiscardPile([]);
        setScreen("battle");
        if (sfx.getOn()) sfx.bgmOn();
        return;
      }
      if (evtId === "merchant") {
        return; // merchant UI handles its own flow
      }
      // All other events: go to next battle
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
      if (sfx.getOn()) sfx.bgmOn();
    }

    var classData = CLASSES.find(function(c) { return c.id === classId; });

    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 16 }}>

          {/* Phase 1: Arrival */}
          {campPhase === 1 && (
            <div style={{ textAlign: "center", animation: "slideUp 0.5s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🔥</div>
              <div style={{ fontSize: 14, color: "var(--dm)", marginBottom: 4 }}>{floor}층 {FLOOR_NAMES[floor]}</div>
              <h2 style={{ fontSize: 15, color: "#f97316", marginBottom: 12 }}>화톳불을 발견했다</h2>
              <div style={{ background: "#ffffff08", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                <p style={{ color: "var(--dm)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  저 앞에 따뜻한 빛이 보인다.
                  <br />지친 몸을 이끌고 불 옆에 다가간다.
                </p>
              </div>
              <div style={{ fontSize: 14, color: "var(--dm)", marginBottom: 8 }}>❤️ {hp}/{MAX_HP}</div>
              <Btn onClick={enterPhase2} color="#f97316" style={{ padding: "10px 28px", fontSize: 13 }}>
                불 옆에 앉다 →
              </Btn>
            </div>
          )}

          {/* Phase 2: Rest & Heal */}
          {campPhase === 2 && (
            <div style={{ textAlign: "center", animation: "slideUp 0.5s ease" }}>
              <div style={{ fontSize: 48, marginBottom: 12, animation: "victBounce 2s ease infinite" }}>🔥</div>
              <h2 style={{ fontSize: 15, color: "#f97316", marginBottom: 12 }}>휴식</h2>
              <div style={{ background: "#22c55e11", border: "1px solid #22c55e44", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                <p style={{ color: "#d4d4d8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  따뜻한 불빛이 몸을 감싼다.
                  <br />잠시 눈을 감고 상처를 돌본다.
                </p>
                <div style={{ marginTop: 10, fontSize: 14, color: "#22c55e", fontWeight: 700 }}>
                  ❤️ HP +10 회복!
                </div>
                <div style={{ fontSize: 13, color: "var(--dm)", marginTop: 4 }}>
                  {hp}/{MAX_HP}
                </div>
              </div>
              <Btn onClick={enterPhase3} color="#f97316" style={{ padding: "10px 28px", fontSize: 13 }}>
                눈을 뜨다 →
              </Btn>
            </div>
          )}

          {/* Phase 3: Event */}
          {campPhase === 3 && campEvent && (
            <div style={{ textAlign: "center", animation: "slideUp 0.5s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🔥</div>

              {/* No event */}
              {campEvent.id === "none" && (
                <div style={{ background: "#ffffff08", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                  <p style={{ color: "#d4d4d8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    고요한 밤이었다.
                    <br />충분히 쉬었으니 발걸음을 옮긴다.
                  </p>
                  <Btn onClick={leaveCampfire} color="#f97316" style={{ marginTop: 14, padding: "10px 28px", fontSize: 13 }}>
                    출발 →
                  </Btn>
                </div>
              )}

              {/* Fairy */}
              {campEvent.id === "fairy" && (
                <div style={{ background: "#a855f722", border: "1px solid #a855f7", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🧚</div>
                  <p style={{ color: "#d4d4d8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    잠에서 깨니 작은 빛이 주위를 맴돌고 있다.
                    <br />요정이 손끝으로 이마를 어루만졌다.
                    <br />몸 안에서 힘이 솟아오른다!
                  </p>
                  <div style={{ marginTop: 10, fontSize: 14, color: "#a855f7", fontWeight: 700 }}>
                    {classId === "warrior" ? "🔥 분노 +1!" : "🌑 그림자 +1!"}
                  </div>
                  <Btn onClick={resolveCampfire} color="#a855f7" style={{ marginTop: 12, padding: "8px 24px", fontSize: 14 }}>
                    감사히 받다 →
                  </Btn>
                </div>
              )}

              {/* Rest */}
              {campEvent.id === "rest" && (
                <div style={{ background: "#22c55e11", border: "1px solid #22c55e44", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>😴</div>
                  <p style={{ color: "#d4d4d8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    깊고 편안한 잠에 빠졌다.
                    <br />꿈속에서 따뜻한 빛이 상처를 감싸안았다.
                  </p>
                  <div style={{ marginTop: 10, fontSize: 14, color: "#22c55e", fontWeight: 700 }}>
                    ❤️ 추가 HP +5 회복! (총 +15)
                  </div>
                  <Btn onClick={resolveCampfire} color="#22c55e" style={{ marginTop: 12, padding: "8px 24px", fontSize: 14 }}>
                    개운하다 →
                  </Btn>
                </div>
              )}

              {/* Ambush */}
              {campEvent.id === "ambush" && (
                <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🐺</div>
                  <p style={{ color: "#d4d4d8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    갑자기 덤불에서 바스락거리는 소리가 들린다!
                    <br />눈을 떠보니 적이 다가오고 있다!
                  </p>
                  <div style={{ marginTop: 10, fontSize: 14, color: "var(--rd)", fontWeight: 700 }}>
                    ⚔️ 전투 발생!
                  </div>
                  <Btn onClick={resolveCampfire} color="var(--rd)" style={{ marginTop: 12, padding: "8px 24px", fontSize: 14 }}>
                    ⚔️ 맞서 싸운다!
                  </Btn>
                </div>
              )}

              {/* Thief */}
              {campEvent.id === "thief" && (
                <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🤡</div>
                  <p style={{ color: "#d4d4d8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    잠에서 깨니 뭔가 허전하다...
                    <br />도둑이 카드를 훔쳐 달아났다!
                  </p>
                  {stolenCard ? (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 14, color: "var(--rd)", fontWeight: 700 }}>빼앗긴 카드:</div>
                      <CardView card={stolenCard} cls={classData} small />
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, fontSize: 16, color: "var(--dm)" }}>
                      덱이 너무 적어 훔치지 못했다!
                    </div>
                  )}
                  <Btn onClick={resolveCampfire} color="var(--rd)" style={{ marginTop: 12, padding: "8px 24px", fontSize: 14 }}>
                    어쩔 수 없다... →
                  </Btn>
                </div>
              )}

              {/* Merchant */}
              {campEvent.id === "merchant" && (
                <div style={{ background: "#fbbf2422", border: "1px solid #fbbf24", borderRadius: 12, padding: "14px 16px", maxWidth: 400, marginBottom: 16 }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>🏪</div>
                  <p style={{ color: "#d4d4d8", fontSize: 16, lineHeight: 1.6, margin: 0 }}>
                    "좋은 카드가 있으면 제값에 사겠소."
                  </p>
                  <div style={{ fontSize: 14, color: "var(--dm)", margin: "6px 0" }}>탭하여 판매 (등급×3 골드)</div>
                  <div style={{ maxHeight: 280, overflow: "auto", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", padding: "4px 0" }}>
                    {deck.map(function(c) {
                      return (
                        <div key={c.id} onClick={function() { sellCard(c); }} style={{ cursor: "pointer", position: "relative" }}>
                          <CardView card={c} cls={classData} small={true} />
                          <div style={{ position: "absolute", bottom: 2, right: 2, background: "#fbbf24", color: "#000", borderRadius: 4, padding: "1px 4px", fontSize: 11, fontWeight: 700 }}>
                            💰{c.grade * 3}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Btn onClick={function() { leaveCampfire(); }} style={{ marginTop: 8, fontSize: 16, padding: "8px 20px" }}>
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

  if (screen === "battle") {
    var handTierColor = "var(--tx)";
    if (currentHand && currentHand.tier >= 4) handTierColor = "var(--gd)";
    else if (currentHand && currentHand.tier >= 3) handTierColor = "var(--rd)";

    return (
      <div style={Object.assign({}, wrapStyle, { height: "100vh", minHeight: "auto", overflow: "hidden", position: "relative" })}>
        <style>{CSS}</style>
        {audioButton}
        {encounterOverlay && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: encounterOverlay.boss
              ? "radial-gradient(circle, #2d1040 0%, #0c0c14 70%)"
              : "radial-gradient(circle, #1a2040 0%, #0c0c14 70%)",
            animation: "encounterIn 0.6s ease",
          }}>
            <div style={{ fontSize: 72, animation: "floatY 2s ease infinite", marginBottom: 12 }}>
              {encounterOverlay.emoji}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: encounterOverlay.boss ? "#fbbf24" : "#a855f7", textShadow: "0 0 20px currentColor", letterSpacing: 2 }}>
              {encounterOverlay.name}
            </div>
            <div style={{ fontSize: 14, color: "var(--dm)", marginTop: 6, fontWeight: 700 }}>
              {encounterOverlay.boss ? "⚠️ BOSS ⚠️" : "⚔️ MINI BOSS ⚔️"}
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", background: "var(--pn)", borderBottom: "1px solid var(--bd)", flexShrink: 0 }}>
          <div style={{ fontSize: 13 }}>
            <b>{classData.icon} {floor}층 {FLOOR_NAMES[floor]}</b>
            <span style={{ color: "var(--dm)", fontSize: 12, marginLeft: 4 }}>{battleNum === 3 ? "⚔️습격!" : "전투" + battleNum + "/5"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, color: "var(--gd)", fontWeight: 700 }}>💰{gold}</span>
            <div style={{ display: "flex", gap: 1 }}>
              {relics.map(function(r) {
                return <span key={r.id} title={r.name + ": " + r.desc} style={{ fontSize: 16 }}>{r.emoji}</span>;
              })}
            </div>
            <div
              onClick={function() { setOverlay("deck"); }}
              style={{ background: "var(--bd)", borderRadius: 4, padding: "1px 5px", fontSize: 13, cursor: "pointer", color: "var(--dm)" }}
            >
              덱{deck.length}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "6px 0" }}>
          {/* Gamble Roulette Animation */}
          {gambleAnim && (
            <div style={{ textAlign: "center", padding: "4px 0", animation: "popIn 0.2s ease" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: gambleAnim.includes("🎉") ? "#22c55e" : gambleAnim.includes("💀") ? "#ef4444" : "#fbbf24", background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 16px" }}>
                {gambleAnim}
              </span>
            </div>
          )}
          {/* Passive Status */}
          <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "2px 0", flexWrap: "wrap", flexShrink: 0 }}>
            {classId === "warrior" && (
              <div style={{ background: fury > 0 ? "#ef444422" : "#1a1a2e", border: "1px solid " + (fury > 0 ? "#ef4444" : "var(--bd)"), borderRadius: 6, padding: "2px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                {fury > 0 ? (
                  <span>🔥x{fury} <span style={{ color: "var(--dm)", fontSize: 11 }}>+{Math.round(fury * 15)}%</span></span>
                ) : (
                  <span style={{ color: "var(--dm)" }}>🔥대기</span>
                )}
                {lastSuit && (
                  <span style={{ background: fury > 0 ? "#ef444433" : "#ffffff0a", borderRadius: 4, padding: "0px 4px", fontSize: 12 }}>
                    {SUITS.find(function(s2) { return s2.id === lastSuit; }).emoji}→유지
                  </span>
                )}
              </div>
            )}
            {classId === "ranger" && (
              <div style={{ background: shadow > 0 ? "#7c3aed22" : "#1a1a2e", border: "1px solid " + (shadow > 0 ? "#7c3aed" : "var(--bd)"), borderRadius: 6, padding: "2px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                {shadow > 0 ? (
                  <span>🌑x{shadow} <span style={{ color: "#a855f7", fontSize: 11 }}>+{(shadow * 0.5).toFixed(1)} 회피{Math.min(50, 10 + shadow * 5)}%</span></span>
                ) : (
                  <span style={{ color: "var(--dm)" }}>🌑회피{10 + upgradeLevels.stealth * 5}%</span>
                )}
              </div>
            )}
            {poison > 0 && (
              <div style={{ background: "#a855f722", border: "1px solid #a855f7", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                ☠️독{poison}
              </div>
            )}
            {gambleBuff !== 0 && (
              <div style={{ background: gambleBuff > 0 ? "#22c55e22" : "#ef444422", border: "1px solid " + (gambleBuff > 0 ? "#22c55e" : "#ef4444"), borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                🎲{gambleBuff > 0 ? "+" : ""}{gambleBuff}
              </div>
            )}
            {shield > 0 && (
              <div style={{ background: "#3b82f622", border: "1px solid #3b82f6", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                🛡️{shield}
              </div>
            )}
            {upgradeLevels.tenacity > 0 && !tenacityUsed && (
              <div style={{ background: "#78716c22", border: "1px solid #78716c", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                💀집념
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", padding: "2px 0", flexShrink: 0 }}>
            {monster && (
              <div>
                <HpBar current={monster.hp} max={monster.maxHp} name={monster.name} emoji={monster.emoji} boss={monster.boss} miniboss={monster.miniboss} shaking={monShake} hardShake={monShakeHard} enemyAttacking={enemyAttacking} />
                {monster.hp > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 13, color: "var(--rd)", animation: "intentPulse 2s ease infinite" }}>
                      ⚔️{monster.atk}~{monster.atk + 2}
                    </span>
                    {monster.freeze > 0 && <span style={{ fontSize: 12, color: "#60a5fa" }}>❄️{monster.freeze}</span>}
                    {monster.erode > 0 && <span style={{ fontSize: 12, color: "#a855f7" }}>🌑{monster.erode}</span>}
                    {monster.burn > 0 && <span style={{ fontSize: 12, color: "#f97316" }}>🔥{monster.burn}</span>}
                    {monster.split && !monster.hasSplit && <span style={{ fontSize: 12, color: "#f97316" }}>💥분열</span>}
                  </div>
                )}
                {splitMon && (
                  <div style={{ marginTop: 2, fontSize: 12, color: "var(--dm)", background: "var(--cd)", borderRadius: 4, padding: "1px 6px", display: "inline-block" }}>
                    대기: {splitMon.emoji} HP{splitMon.hp}
                  </div>
                )}
              </div>
            )}
          </div>

          {bossDialogue && (
            <div style={{ textAlign: "center", padding: "4px 0", flexShrink: 0, animation: "slideUp 0.4s ease" }}>
              <span style={{ display: "inline-block", background: "#1c1c32ee", border: "1px solid #a855f7", borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700, color: "#e0d0ff", maxWidth: "80%" }}>
                "{bossDialogue}"
              </span>
            </div>
          )}

          {damageInfo && currentHand ? (
            <div style={{ height: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, flexShrink: 0 }}>
              <div style={{ fontSize: currentHand.tier >= 4 ? 18 : 16, fontWeight: 900, color: handTierColor, animation: "popIn 0.4s ease" }}>
                {currentHand.emoji} {currentHand.name}! {currentHand.emoji}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'Silkscreen', cursive", position: "relative" }}>
                {damageInfo.isCrit && (
                  <div style={{ position: "absolute", inset: -12, background: "radial-gradient(circle, #f0b93044 0%, transparent 70%)", animation: "critFlash 0.8s ease", borderRadius: "50%", pointerEvents: "none" }} />
                )}
                <span style={{ fontSize: 16, color: "var(--bl)", animation: "multIn 0.3s ease 0.2s both" }}>{damageInfo.atk}</span>
                <span style={{ fontSize: 14, color: "var(--dm)", animation: "multIn 0.3s ease 0.4s both" }}>x{damageInfo.mult}</span>
                <span style={{ fontSize: 14, color: "var(--dm)" }}>=</span>
                <span style={{ fontSize: damageInfo.isCrit ? 28 : (currentHand.tier >= 4 ? 24 : 18), color: damageInfo.isCrit ? "#f0b930" : handTierColor, animation: damageInfo.isCrit ? "critBurst 0.7s ease 0.3s both" : "dmgPop 0.5s ease 0.3s both", textShadow: damageInfo.isCrit ? "0 0 20px #f0b930aa" : "none" }}>{damageInfo.total}</span>
                <span style={{ fontSize: 18, animation: "dmgPop 0.3s ease 0.5s both" }}>{damageInfo.isCrit ? "💥⭐" : "💥"}</span>
              </div>
            </div>
          ) : (
            <div style={{ height: 56, flexShrink: 0 }} />
          )}}

          {/* Passive Trigger Message */}
          {passiveMsg && (
            <div style={{ textAlign: "center", flexShrink: 0, animation: "passivePop 0.4s ease, passiveFade 2s ease forwards" }}>
              <span style={{ display: "inline-block", background: "#a855f733", border: "1px solid #a855f7", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700, color: "#e0d0ff" }}>
                {passiveMsg}
              </span>
            </div>
          )}

          <div style={{ textAlign: "center", position: "relative", flexShrink: 0, padding: "2px 0" }}>
            <div style={{ animation: playerShake ? "playerHit 0.5s ease" : "none", display: "inline-block" }}>
              <HpBar current={hp} max={MAX_HP} name={classData.name} emoji={classData.icon} isPlayer />
            </div>
            {enemyDmgShow !== null && (
              <>
                {enemyDmgShow === "MISS" && (
                  <div style={{ position: "absolute", inset: -20, background: "radial-gradient(circle, #22c55e33 0%, transparent 70%)", animation: "missFlash 0.6s ease", borderRadius: "50%", pointerEvents: "none" }} />
                )}
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: enemyDmgShow === "MISS" ? 22 : 20, fontWeight: 900, color: enemyDmgShow === "MISS" ? "#22c55e" : "var(--rd)", fontFamily: "'Silkscreen', cursive", animation: enemyDmgShow === "MISS" ? "missBounce 0.7s ease, dmgFloat 1.4s ease 0.7s forwards" : "dmgPop 0.4s ease, dmgFloat 1.2s ease 0.4s forwards", textShadow: enemyDmgShow === "MISS" ? "0 0 15px #22c55eaa" : "0 0 10px #ef444488" }}>
                  {enemyDmgShow === "MISS" ? "✨MISS!✨" : "-" + enemyDmgShow}
                </div>
              </>
            )}
          </div>

          <div style={{ padding: "2px 6px", display: "flex", justifyContent: "center", alignItems: "flex-end", overflow: "hidden", flex: 1 }}>
            {hand.map(function(c, idx) {
              var isNew = newCardIds.indexOf(c.id) >= 0;
              var isFrozen = frozenIds.indexOf(c.id) >= 0;
              var isEroded = c.eroded;
              var isBurning = c.burning;
              var overlap = hand.length > 7 ? -10 : hand.length > 6 ? -6 : hand.length > 5 ? -2 : 3;
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

          <div style={{ padding: "2px 8px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 38, flexShrink: 0 }}>
            <div style={{ fontSize: 12, overflow: "hidden", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
              {preview ? (
                <span>
                  {preview.emoji}{" "}
                  <b style={{ color: preview.tier >= 3 ? "var(--gd)" : "var(--tx)" }}>{preview.name}</b>
                  <span style={{ color: "var(--dm)", marginLeft: 2 }}>x{preview.mult}</span>
                  {previewDmg && (
                    <span style={{ marginLeft: 4 }}>
                      <span style={{ color: "#3b82f6" }}>{previewDmg.atk}</span>
                      <span style={{ color: "var(--dm)" }}>×</span>
                      <span style={{ color: "#f97316" }}>{previewDmg.mult}</span>
                      <span style={{ color: "var(--dm)" }}>=</span>
                      <span style={{ color: "var(--rd)", fontWeight: 700, fontSize: 14 }}>{previewDmg.total}</span>
                      {previewDmg.critChance > 0 && (
                        <span style={{ color: "#f0b930", fontSize: 10, marginLeft: 2 }}>⭐{previewDmg.critChance}%</span>
                      )}
                    </span>
                  )}
                </span>
              ) : (
                <span style={{ color: "var(--dm)" }}>최대 {submitLimit}장 R{roundNum}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <Btn onClick={doDiscard} disabled={discards <= 0 || selected.length === 0 || busy} style={{ padding: "4px 10px", fontSize: 13 }}>
                🔄{discards}
              </Btn>
              <Btn onClick={submitCards} disabled={selected.length === 0 || busy} color="var(--rd)" style={{ padding: "6px 16px", fontSize: 15 }}>
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
      </div>
    );
  }

  if (screen === "reward") {
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ fontSize: 38, animation: "popIn 0.4s ease" }}>⚔️ 승리!</div>
          <h3 style={{ fontSize: 15 }}>보상 카드 선택</h3>
          <div style={{ display: "flex", gap: 10 }}>
            {rewardCards.map(function(c) {
              return (
                <div key={c.id} style={{ cursor: "pointer", textAlign: "center" }} onClick={function() { addCardToDeck(c); }}>
                  <CardView card={c} cls={classData} />
                  {c.keyword && (
                    <div style={{ fontSize: 14, color: "#a855f7", marginTop: 4 }}>
                      {c.keyword.icon} {c.keyword.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={function() { setScreen("enhance"); }} color="#7c3aed">⬆️강화</Btn>
            <Btn onClick={function() { setDeckView(true); }}>📦덱 보기</Btn>
            <Btn onClick={skipReward}>건너뛰기</Btn>
          </div>
        </div>
        <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
      </div>
    );
  }

  if (screen === "enhance") {
    var enhanceable = deck.filter(function(c) { return (c.enhanceCount || 0) < 2; });
    var suitOrder = { red: 0, blue: 1, yellow: 2 };
    var sorted = enhanceable.slice().sort(function(a, b) {
      // Class cards first, then common cards
      if (a.isCommon !== b.isCommon) return a.isCommon ? 1 : -1;
      // Within class cards: group by suit, then grade
      if (!a.isCommon && !b.isCommon) {
        if (a.suitId !== b.suitId) return (suitOrder[a.suitId] || 0) - (suitOrder[b.suitId] || 0);
        return a.grade - b.grade;
      }
      // Within common cards: group by type, then grade
      if (a.isCommon && b.isCommon) {
        if (a.common.id !== b.common.id) return a.common.id.localeCompare(b.common.id);
        return a.grade - b.grade;
      }
      return 0;
    });
    // Group into sections for visual separation
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
          <h3 style={{ fontSize: 14 }}>강화할 카드 (등급+1, 카드당 최대2회)</h3>
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

  if (screen === "relicReward") {
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ fontSize: 24, animation: "popIn 0.4s ease" }}>👑 보스 처치!</div>
          <h3 style={{ fontSize: 15 }}>유물 선택</h3>
          <div style={{ display: "flex", gap: 10 }}>
            {rewardRelics.map(function(r) {
              var borderCol = r.tier >= 3 ? "var(--gd)" : r.tier >= 2 ? "#a855f7" : "var(--bd)";
              return (
                <div
                  key={r.id}
                  onClick={function() { pickRelic(r); }}
                  style={{ width: 170, padding: 20, background: "linear-gradient(145deg,var(--cd),#12121f)", border: "2px solid " + borderCol, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}
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

  if (screen === "shop") {
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ padding: "12px 14px", background: "var(--pn)", borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16 }}>🏪 대장간</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>❤️{hp}/{MAX_HP}</span>
            <span style={{ color: "var(--gd)", fontWeight: 700 }}>💰{gold}</span>
            <button
              onClick={function() { setDeckView(true); }}
              style={{ background: "var(--bd)", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "var(--tx)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}
            >
              📦덱
            </button>
          </div>
        </div>
        {(function() { var discount = upgradeLevels.merchant > 0 ? 0.8 : 1; return (
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
          <div>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>📦 카드</h3>
            <div style={{ display: "flex", gap: 8 }}>
              {shopCards.map(function(c) {
                var cost = Math.floor((c.grade * 3 + (c.isCommon ? 2 : 0) + (c.keyword ? 5 : 0)) * discount);
                return (
                  <div key={c.id} style={{ textAlign: "center" }}>
                    <CardView card={c} cls={classData} small />
                    <Btn onClick={function() { buyCard(c, cost); }} disabled={gold < cost} style={{ fontSize: 14, padding: "5px 12px", marginTop: 4 }}>
                      💰{cost}
                    </Btn>
                  </div>
                );
              })}
            </div>
          </div>
          {shopRelic && (
            <div>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>🔮 유물</h3>
              {(function() {
                var relicCost = Math.floor((shopRelic.tier === 1 ? 30 : shopRelic.tier === 2 ? 50 : 75) * discount);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ padding: 10, background: "var(--cd)", borderRadius: 10, border: "1px solid " + (shopRelic.tier >= 3 ? "#f97316" : shopRelic.tier >= 2 ? "#a855f7" : "var(--bd)"), textAlign: "center" }}>
                      <div style={{ fontSize: 20 }}>{shopRelic.emoji}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{shopRelic.name}</div>
                      <div style={{ fontSize: 16, color: "var(--dm)" }}>{shopRelic.desc}</div>
                    </div>
                    <Btn onClick={function() { buyRelic(shopRelic, relicCost); }} disabled={gold < relicCost} color="#7c3aed">💰{relicCost}</Btn>
                  </div>
                );
              })()}
            </div>
          )}
          {(function() { var healCost = Math.floor(10 * discount); return (
          <div>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>❤️ 회복 (1회 한정)</h3>
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
                color="#22c55e"
              >
                {shopHealed ? "완료" : hp >= MAX_HP ? "만탄" : "💰" + healCost}
              </Btn>
            </div>
          </div>
          ); })()}
          {(function() { var removeCost = Math.floor(10 * discount); return (
          <div>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>🗑️ 제거 (💰{removeCost}, {2 - shopRemoved}회 남음)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {deck.slice().sort(function(a, b) {
                var suitOrd = { red: 0, blue: 1, yellow: 2 };
                if (a.isCommon !== b.isCommon) return a.isCommon ? 1 : -1;
                if (!a.isCommon && !b.isCommon) {
                  if (a.suitId !== b.suitId) return (suitOrd[a.suitId] || 0) - (suitOrd[b.suitId] || 0);
                  return a.grade - b.grade;
                }
                if (a.isCommon && b.isCommon) return a.common.id.localeCompare(b.common.id);
                return 0;
              }).map(function(c) {
                var canRemove = gold >= removeCost && deck.length > 10 && shopRemoved < 2;
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
          ); })()}
        </div>
        ); })()}
        <div style={{ padding: 12, borderTop: "1px solid var(--bd)", textAlign: "center" }}>
          <Btn onClick={leaveShop} color="var(--rd)" style={{ fontSize: 14, padding: "12px 36px" }}>
            {floor >= 5 ? "🏆 클리어!" : "다음 층 →"}
          </Btn>
        </div>
        <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
      </div>
    );
  }

  // Compute earned points for this run
  var runPoints = bossesKilled.reduce(function(sum, p) { return sum + p; }, 0);
  var isVictory = screen === "victory";
  if (isVictory) runPoints += 3; // clear bonus

  function claimAndGo(dest) {
    if (bossesKilled.length > 0 || isVictory) {
      setMetaPoints(function(p) { return p + runPoints; });
    }
    setBossesKilled([]);
    setScreen(dest);
  }

  if (screen === "victory") {
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: 48, animation: "victBounce 1.5s ease infinite" }}>🏆</div>
          <h1 style={{ fontSize: 16, fontFamily: "'Silkscreen', cursive", background: "linear-gradient(135deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            VICTORY!
          </h1>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gd)" }}>💰{gold}</div>
              <div style={{ fontSize: 14, color: "var(--dm)" }}>골드</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#a855f7" }}>{relics.length}</div>
              <div style={{ fontSize: 14, color: "var(--dm)" }}>유물</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f97316" }}>+{runPoints}⭐</div>
              <div style={{ fontSize: 14, color: "var(--dm)" }}>포인트</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={function() { claimAndGo("village"); }} color="#22c55e">🏘️ 마을</Btn>
            <Btn onClick={function() { claimAndGo("menu"); }} color="var(--rd)">🃏 다시 도전</Btn>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "defeat") {
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: 44 }}>💀</div>
          <h1 style={{ fontSize: 18, fontFamily: "'Silkscreen', cursive", color: "var(--rd)" }}>DEFEAT</h1>
          <p style={{ color: "var(--dm)" }}>{floor}층에서 쓰러졌습니다...</p>
          {runPoints > 0 && (
            <div style={{ fontSize: 14, color: "#f97316", fontWeight: 700 }}>+{runPoints}⭐ 획득</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={function() { claimAndGo("village"); }} color="#22c55e">🏘️ 마을</Btn>
            <Btn onClick={function() { claimAndGo("menu"); }} color="var(--rd)">🃏 다시 도전</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      <div style={{ padding: 40, textAlign: "center" }}>로딩중...</div>
    </div>
  );
}
