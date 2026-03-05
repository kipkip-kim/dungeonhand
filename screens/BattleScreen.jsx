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
            {encounterOverlay.boss ? "⚠️ BOSS ⚠️" : "⚔️ 엘리트 ⚔️"}
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
          <div style={{ height: damageInfo.fatedRoll > 0 ? 72 : 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, flexShrink: 0 }}>
            <div style={{ fontSize: currentHand.tier >= 4 ? 18 : 16, fontWeight: 900, color: handTierColor, animation: "popIn 0.4s ease" }}>
              {currentHand.emoji} {currentHand.name}! {currentHand.emoji}
            </div>
            {damageInfo.fatedRoll > 0 && (
              <div style={{ fontSize: 13, fontWeight: 700, color: damageInfo.fatedMult <= 0.5 ? "#e64b35" : damageInfo.fatedMult <= 1.5 ? "#4e79a7" : "#f0b930", animation: "dmgPop 0.4s ease 0.1s both" }}>
                🎲 [{damageInfo.fatedRoll}] → x{damageInfo.fatedMult}
              </div>
            )}
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
