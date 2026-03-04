import { useState, useRef } from "react";
import { sfx } from "./audio.js";
import { SUITS, CLASSES, REWARD_COMMONS, MONSTERS, CAMPFIRE_EVENTS, RELICS, FLOOR_NAMES, BOSS_DIALOGUES, KEYWORDS, SKILL_TREES, ULTIMATE_SKILL, BOSS_POINTS } from "./data.js";
import { shuffle, pickN, makeCard, makeDeck, getCardName, detectHand, calcDamage } from "./utils.js";
import { CSS } from "./styles.js";
import { CardView, HpBar, Btn, DeckViewer } from "./components.jsx";

// === MAIN GAME ===
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
  var [upgradeLevels, setUpgradeLevels] = s({
    // 공통
    hp: 0, sharp: 0, merchant: 0, loot: 0, tenacity: 0, inventory: 0,
    // 습격
    redCollect: 0, awaken: 0, stealth: 0, shadowBurst: 0,
    // 연계
    blueCollect: 0, deft: 0, nimble: 0, chainBoost: 0,
    // 급소
    yellowCollect: 0, critMastery: 0, quickStrike: 0, critDamage: 0,
    // 궁극기
    fatedDice: 0,
  });
  var [resetCount, setResetCount] = s(0);
  var [skillTab, setSkillTab] = s("common");
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
  var [passiveState, setPassiveState] = s({ stacks: 0 });
  var [aimedBonus, setAimedBonus] = s(0); // aimed shot: next turn submit +1
  var [gambleBuff, setGambleBuff] = s(0); // dice relic: +1 or -0.5 mult
  var [gambleAnim, setGambleAnim] = s(null); // roulette animation text
  var [poison, setPoison] = s(0); // poison on monster: dmg per turn
  var [erodedIds, setErodedIds] = s([]); // eroded card ids (grade temporarily -1)
  var [tenacityUsed, setTenacityUsed] = s(false); // tenacity: revive once per run
  var [frozenIds, setFrozenIds] = s([]); // frozen card ids
  var [bossDialogue, setBossDialogue] = s(null); // boss/miniboss dialogue text
  var [encounterOverlay, setEncounterOverlay] = s(null); // boss encounter overlay { emoji, name, boss }
  var [book2Used, setBook2Used] = s(false); // book2: once per battle submit bonus
  var gambitPendingRef = useRef(false); // gambit: next draw shows 3-pick-1 (ref for setTimeout closure)
  var [gambitChoices, setGambitChoices] = s([]); // gambit: 3 cards to choose from
  var [splitMon, setSplitMon] = s(null); // split monster waiting
  var [passiveMsg, setPassiveMsg] = s(null); // passive trigger message
  var [deckView, setDeckView] = s(false);
  var [deckSort, setDeckSort] = s("type");
  var [newCardIds, setNewCardIds] = s([]);
  var [discardedRelicIds, setDiscardedRelicIds] = s([]); // 영구 삭제된 유물 id
  var [pendingRelic, setPendingRelic] = s(null);          // 교체 대기 중인 유물
  var [pendingRelicCost, setPendingRelicCost] = s(0);     // 상점 교체 대기 중 미차감 비용
  var [relicSwapContext, setRelicSwapContext] = s(null);   // "boss" | "shop"

  var HAND_SIZE = 5 + (upgradeLevels.deft || 0);
  var MAX_HAND = 7;
  var RELIC_SLOTS = 3 + (upgradeLevels.inventory || 0);
  var BASE_SUBMIT = 3;

  var classData = CLASSES.find(function(c) { return c.id === classId; }) || CLASSES[0];

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
    var maxHp = 70 + upgradeLevels.hp * 5;
    setHp(maxHp);
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
    setTenacityUsed(false);
    gambitPendingRef.current = false;
    setGambitChoices([]);
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
    setDiscards(2 + discBonus + (upgradeLevels.nimble || 0));
    setRoundNum(1);
    setDamageInfo(null);
    setCurrentHand(null);
    setSelected([]);
    setBusy(false);
    setEnemyDmgShow(null);
    // Reset battle-scoped passives
    // (passiveState persists across battles)
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
    previewDmg = calcDamage(previewCards, preview, relics, buildPState(), classData);
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
    if (poisonAmt > 0) {
      setPoison(function(p) { return p + poisonAmt; });
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

    // 운명의 주사위 연출
    if (dmg.fatedRoll > 0) {
      var fatedMsg = "🎲 운명의 주사위 [" + dmg.fatedRoll + "] → x" + dmg.fatedMult;
      showPassive(fatedMsg);
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
        var evadeResult = classData.passive.onEvade(passiveState);
        setPassiveState(evadeResult.state);
        if (evadeResult.msg) showPassive(evadeResult.msg);
      } else {
        setPlayerShake(true);
        setEnemyDmgShow(atkDmg);
        var hitResult = classData.passive.onHit(passiveState);
        setPassiveState(hitResult.state);
        if (hitResult.msg) showPassive(hitResult.msg);
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
            var actualBurn = Math.min(burnCount, MAX_HAND - allNewHand.length);
            var burnCards = [];
            for (var bi = 0; bi < actualBurn; bi++) {
              burnCards.push({ id: nextId++, suitId: "red", suitColor: "#e64b35", grade: 0, isCommon: false, burning: true, growthBonus: 0, keyword: null });
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
    var monMap = { 1: 0, 2: 1, 4: 2, 5: 3 };
    var mi = monMap[battleNum];
    var monIdx = (floor - 1) * 4 + (mi || 0);
    if (battleNum === 5 && BOSS_POINTS[monIdx] !== undefined) {
      var pts = BOSS_POINTS[monIdx];
      setBossesKilled(function(prev) { return prev.concat([pts]); });
    }
    var isBoss = battleNum === 5;
    var lootBonus = upgradeLevels.loot * 3;
    var earned = (isBoss ? 10 : battleNum === 4 ? 7 : 4) + Math.floor(Math.random() * 5) + lootBonus;
    setGold(function(g) { return g + earned; });
    sfx.gold();
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
      var g2 = rollGrade();
      var kw = Math.random() < kwChance ? pickKw(g2) : null;
      pool.push(makeCard(s2.id, g2, classId, null, kw));
    }
    var rcPool = floor < 2 ? REWARD_COMMONS.filter(function(c) { return c.fx !== "gambit"; }) : REWARD_COMMONS;
    var ct = pickN(rcPool, 1)[0];
    var s3 = collectSuits.length > 2 ? SUITS.find(function(ss) { return ss.id === collectSuits[2]; }) : pickN(SUITS, 1)[0];
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
      var kw = (i < 2 && Math.random() < 0.25) ? pickKw(g) : null;
      if (Math.random() < 0.3) {
        var shopRc = floor < 2 ? REWARD_COMMONS.filter(function(c) { return c.fx !== "gambit"; }) : REWARD_COMMONS;
        pool.push(makeCard(s2.id, g, classId, pickN(shopRc, 1)[0], kw));
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
      return t.classId === null || t.classId === classId;
    });
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflow: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16 }}>🏘️ 스킬 트리</h2>
            <div style={{ fontSize: 14, color: "#f97316", fontWeight: 700 }}>⭐ {metaPoints} 포인트</div>
            <div style={{ fontSize: 12, color: "var(--dm)", marginTop: 2 }}>총 투자: {totalInvested}⭐</div>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {visibleTrees.map(function(tree) {
              var isActive = skillTab === tree.id;
              var tColor = tree.classId ? (tree.id.indexOf("red") >= 0 ? "#e64b35" : tree.id.indexOf("blue") >= 0 ? "#4e79a7" : "#f0b930") : "#888";
              return (
                <button key={tree.id} onClick={function() { setSkillTab(tree.id); }} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 700, border: "1px solid " + (isActive ? tColor : "var(--bd)"), borderRadius: 6, background: isActive ? tColor + "22" : "var(--cd)", color: isActive ? tColor : "var(--dm)", cursor: "pointer" }}>
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
                      <div key={node.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: maxed ? "#22c55e11" : "var(--cd)", border: "1px solid " + (maxed ? "#22c55e44" : "var(--bd)"), borderRadius: 8, padding: "6px 10px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13 }}>{node.icon}</span>
                          <span style={{ fontWeight: 700, marginLeft: 4, fontSize: 13 }}>{node.name}</span>
                          <span style={{ color: "var(--dm)", fontSize: 12, marginLeft: 6 }}>{node.desc}</span>
                          <span style={{ color: "#a855f7", fontSize: 12, marginLeft: 6 }}>{lv}/{node.max}</span>
                        </div>
                        {maxed ? (
                          <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>MAX</span>
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
                            style={{ padding: "3px 10px", fontSize: 12, whiteSpace: "nowrap" }}
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
          <div style={{ marginBottom: 14, padding: 10, background: ulUnlocked ? "#f59e0b11" : "#1a1a2e", border: "1px solid " + (ulUnlocked ? "#f59e0b44" : "var(--bd)"), borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ulUnlocked ? "#f59e0b" : "var(--dm)" }}>{ULTIMATE_SKILL.icon} {ULTIMATE_SKILL.name}</div>
            <div style={{ fontSize: 12, color: "var(--dm)", marginTop: 2 }}>{ULTIMATE_SKILL.desc}</div>
            {ulOwned ? (
              <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>활성화됨</span>
            ) : ulUnlocked ? (
              <Btn
                onClick={function() {
                  setUpgradeLevels(function(prev) {
                    return Object.assign({}, prev, { fatedDice: 1 });
                  });
                }}
                style={{ padding: "4px 14px", fontSize: 13, marginTop: 6 }}
                color="#f59e0b"
              >
                해금
              </Btn>
            ) : (
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{ULTIMATE_SKILL.unlockCost}⭐ 투자 시 해금 (현재 {totalInvested}⭐)</div>
            )}
          </div>
          {resetCount < 3 && (function() {
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
                  color="#ef4444"
                  style={{ padding: "6px 18px", fontSize: 12 }}
                >
                  🔄 스킬 초기화 ({resetCount + 1}/3회) — ⭐{resetCost}
                </Btn>
              </div>
            );
          })()}
          <div style={{ textAlign: "center", marginTop: 4 }}>
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
            <Btn onClick={function() { if (CLASSES.length === 1) { startRun(CLASSES[0].id); } else { setScreen("classSelect"); } }} color="var(--rd)" style={{ fontSize: 14, padding: "14px 32px" }}>
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
    return (
      <div style={wrapStyle}>
        <style>{CSS}</style>
        {audioButton}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <h2 style={{ fontSize: 16 }}>직업을 선택하세요</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {CLASSES.map(function(c) {
              return (
                <div
                  key={c.id}
                  onClick={function() { startRun(c.id); }}
                  style={{ width: 200, background: "linear-gradient(145deg,var(--cd),#12121f)", border: "2px solid var(--bd)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", padding: "16px 12px" }}
                >
                  <span style={{ fontSize: 42 }}>{c.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                  <div style={{ fontSize: 14, color: "#a855f7", textAlign: "center", lineHeight: 1.4 }}>
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
        var campResult = classData.passive.onCamp(passiveState);
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
        var ambushIdx = (floor - 1) * 4;
        var am = MONSTERS[ambushIdx];
        var amhp = Math.floor(am.hp * (1 + (floor - 1) * 0.45));
        var amatk = Math.floor(am.atk * (1 + (floor - 1) * 0.1));
        setMonster({ name: am.name, emoji: am.emoji, hp: amhp, maxHp: amhp, atk: amatk, boss: false, freeze: am.freeze || 0, erode: am.erode || 0, burn: am.burn || 0, split: false, hasSplit: false });
        var discBonus = relics.reduce(function(sum, r) { return r.eff.type === "disc" ? sum + r.eff.val : sum; }, 0);
        setDiscards(2 + discBonus + (upgradeLevels.nimble || 0));
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
                    {classData.passive.onCamp(passiveState).msg}
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
              {encounterOverlay.boss ? "⚠️ BOSS ⚠️" : "⚔️ 중간보스 ⚔️"}
            </div>
          </div>
        )}
        {gambitChoices.length > 0 && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", marginBottom: 16 }}>🎰 투기 — 1장을 선택하세요</div>
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
            {(function() {
              var badge = classData.passive.renderBadge(passiveState, upgradeLevels.stealth * 5);
              if (!badge) return null;
              return (
                <div style={{ background: badge.bg, border: "1px solid " + badge.border, borderRadius: 6, padding: "2px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{badge.label}</span>
                  {badge.detail && <span style={{ color: classData.passive.color, fontSize: 11 }}>{badge.detail}</span>}
                </div>
              );
            })()}
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
          )}

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
