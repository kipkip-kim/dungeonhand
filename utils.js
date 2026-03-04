import { SUITS, COMMONS } from "./data.js";

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

function calcDamage(cards, hand, relics, pState, classDef) {
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
  var hasRed = cards.some(function(c) { return !c.isCommon && c.suitId === "red"; });

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

  // === Passive: apply mult bonus ===
  mult = passive.applyMult(mult, pState || { stacks: 0 });

  // === Gamble relic buff ===
  if (pState && pState.gambleBuff) {
    mult += pState.gambleBuff;
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

export { shuffle, pickN, makeCard, makeDeck, getCardName, getEffectiveSuit, detectHand, calcDamage };
