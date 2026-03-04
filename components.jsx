import { SUITS } from "./data.js";
import { getCardName } from "./utils.js";

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
    var fxMap = { aimed: "다음턴 제출+1", wild: "문양 따라감", focus: "배율+0.5", reclaim: "회수" + (c.grade + (c.growthBonus || 0)) + "장", gambit: "3장 중 1장 선택" };
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
          중립
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

export { CardView, HpBar, Btn, DeckViewer };
