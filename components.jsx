import { SUITS, SUIT_ORDER, BURN_DAMAGE } from "./data.js";
import { getCardName } from "./utils.js";
import { sfx } from "./audio.js";

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

  return (
    <div style={{ textAlign: "center", animation: anim }}>
      <div style={{
        fontSize: nameSize,
        fontWeight: 700,
        marginBottom: 3,
        fontFamily: "'Noto Sans KR', sans-serif",
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

export { CardView, HpBar, Btn, DeckViewer, relicBorderColor };
