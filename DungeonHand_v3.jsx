import { useState, useRef } from "react";
import { sfx } from "./audio.js";
import { SUITS, CLASSES, REWARD_COMMONS, MONSTERS, CAMPFIRE_EVENTS, RELICS, BOSS_DIALOGUES, KEYWORDS, SKILL_TREES, ULTIMATE_SKILL, BOSS_POINTS } from "./data.js";
import { shuffle, pickN, makeCard, makeDeck, getNextId, getCardName, detectHand, calcDamage } from "./utils.js";
import { CSS } from "./styles.js";
import { CardView, HpBar, Btn, DeckViewer } from "./components.jsx";
import { PendingRelicOverlay, MenuScreen, ClassSelectScreen, RewardScreen, EnhanceScreen, RelicRewardScreen, VictoryScreen, DefeatScreen } from "./screens/SmallScreens.jsx";
import { CampfireScreen } from "./screens/CampfireScreen.jsx";
import { VillageScreen } from "./screens/VillageScreen.jsx";
import { BattleScreen } from "./screens/BattleScreen.jsx";
import { ShopScreen } from "./screens/ShopScreen.jsx";

const BASE_HP = 70;
const SHOP_MAX_REMOVE = 2;

// === MAIN GAME ===
export default function DungeonHand() {
  var s = useState;
  var [screen, setScreen] = s("menu");
  var [classId, setClassId] = s(null);
  var [floor, setFloor] = s(1);
  var [battleNum, setBattleNum] = s(1);
  var [gold, setGold] = s(0);
  var [hp, setHp] = s(BASE_HP);
  // Meta progression (persists across runs)
  var [metaPoints, setMetaPoints] = s(0);
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
    setGold(0); // 약탈 효과는 매 전투 승리 시 적용
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
    setMonster({ name: m.name, emoji: m.emoji, hp: mhp, maxHp: mhp, atk: matk, boss: m.boss, miniboss: m.miniboss, freeze: m.freeze || 0, erode: m.erode || 0, burn: m.burn || 0, split: m.split || false, hasSplit: false });
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
      var burnDmg = burnPlayed.length * 3;
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

    // === Apply poison from previous turns ===
    // (poison damage applied before attack in submitCards)

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
          setSplitMon({ name: "마법 골렘", emoji: "🗿", hp: spawnHp, maxHp: spawnHp, atk: Math.floor(prev.atk * 0.6), freeze: 1 });
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
              burnCards.push({ id: getNextId(), suitId: "red", suitColor: "#e64b35", grade: 0, isCommon: false, burning: true, growthBonus: 0, keyword: null });
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
  }

  function resolveCampfire() {
    if (!campEvent) return;
    var evtId = campEvent.id;

    if (evtId === "fairy") {
      var campResult = classData.passive.onCamp(passiveStateRef.current);
      setPassiveState(campResult.state);
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
      var ambushIdx = (floor - 1) * MONSTERS_PER_FLOOR;
      var am = MONSTERS[ambushIdx];
      var amhp = scaleMonsterHp(am.hp, floor);
      var amatk = scaleMonsterAtk(am.atk, floor);
      setMonster({ name: am.name, emoji: am.emoji, hp: amhp, maxHp: amhp, atk: amatk, boss: false, freeze: am.freeze || 0, erode: am.erode || 0, burn: am.burn || 0, split: false, hasSplit: false });
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
  var wrapStyle = {
    width: "min(100vw, calc(100vh * 9 / 16), 960px)",
    height: "min(100vh, calc(min(100vw, 960px) * 16 / 9))",
    margin: "auto",
    background: "var(--bg)",
    color: "var(--tx)",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: "clamp(15px, calc(var(--gw) * 0.025 + 5px), 22px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 0 60px rgba(0,0,0,0.6)",
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
