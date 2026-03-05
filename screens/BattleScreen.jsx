import { useState } from "react";
import { FLOOR_NAMES } from "../data.js";
import { CardView, HpBar, Btn, DeckViewer } from "../components.jsx";

export function BattleScreen({ game }) {
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
            <div style={{ fontSize: 72, animation: "floatY 2s ease infinite", marginBottom: 12 }}>
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", gap: "clamp(4px, 1vh, 8px)", paddingBottom: "clamp(50px, 10vh, 80px)" }}>
        <div style={{ textAlign: "center", padding: "2px 0", flexShrink: 0, position: "relative" }}>
          {monster && (
            <div>
              <HpBar current={monster.hp} max={monster.maxHp} name={monster.name} boss={monster.boss} miniboss={monster.miniboss} />
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 3, visibility: monster.hp > 0 ? "visible" : "hidden" }}>
                <span style={{ fontSize: "clamp(14px, calc(var(--gw) * 0.028), 22px)", color: "var(--rd)", fontWeight: 700, animation: "intentPulse 2s ease infinite" }}>
                  ⚔️{monster.atk}~{monster.atk + 2}
                </span>
                {monster.freeze > 0 && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--fr)", fontWeight: 700 }}>❄️{monster.freeze}</span>}
                {monster.erode > 0 && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--ac)", fontWeight: 700 }}>🌑{monster.erode}</span>}
                {monster.burn > 0 && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--or)", fontWeight: 700 }}>🔥{monster.burn}</span>}
                {monster.split && !monster.hasSplit && <span style={{ fontSize: "clamp(13px, calc(var(--gw) * 0.026), 20px)", color: "var(--or)", fontWeight: 700 }}>💥분열</span>}
              </div>
              <div style={{ fontSize: monster.boss ? "clamp(48px, calc(var(--gw) * 0.096), 88px)" : "clamp(40px, calc(var(--gw) * 0.08), 72px)", marginTop: 3, animation: monShake ? (monShakeHard ? "shakeHard 0.6s ease" : "shake 0.4s ease") : enemyAttacking ? "enemyAtk 0.5s ease" : "floatY 3s ease infinite" }}>
                {monster.emoji}
              </div>
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
              <div style={{ width: hpPct + "%", height: "100%", background: "linear-gradient(180deg, " + hpColor + "cc, " + hpColor + ", " + hpColor + "88)", borderRadius: 6, transition: "width 0.5s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)" }} />
            </div>
            <span style={{ fontSize: "clamp(15px, calc(var(--gw) * 0.03), 24px)", color: "var(--gd)", fontWeight: 700 }}>💰{gold}</span>
          </div>
        </div>

        {/* === 손패 고정 영역 === */}
        <div style={{ padding: "clamp(8px, calc(var(--gw) * 0.016), 14px) clamp(4px, calc(var(--gw) * 0.008), 8px) clamp(2px, calc(var(--gw) * 0.004), 4px)", display: "flex", justifyContent: "center", alignItems: "flex-end", overflow: "visible", flexShrink: 0, height: "clamp(110px, calc(var(--gw) * 0.22), 200px)" }}>
          {hand.map(function(c, idx) {
            var isNew = newCardIds.indexOf(c.id) >= 0;
            var isFrozen = frozenIds.indexOf(c.id) >= 0;
            var isEroded = c.eroded;
            var isBurning = c.burning;
            var baseOverlap = hand.length > 7 ? -10 : hand.length > 6 ? -6 : hand.length > 5 ? -2 : 3;
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
