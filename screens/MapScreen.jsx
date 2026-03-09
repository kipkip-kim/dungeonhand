import { FLOOR_NAMES, NODE_TYPES, MAP_EVENTS } from "../data.js";
import { Btn } from "../components.jsx";

function MapScreen({ game }) {
  var g = game;
  var map = g.floorMap;
  if (!map) return null;

  var rows = map.rows;
  var currentRow = map.currentRow;

  // 선택 가능한 노드 인덱스 계산
  var selectableIndices = [];
  if (currentRow > 0 && currentRow < rows.length) {
    var prevRow = rows[currentRow - 1];
    var prevNode = prevRow[map.currentNodeIdx] || prevRow[0];
    selectableIndices = prevNode.edges || [];
  } else if (currentRow === 0) {
    // 시작점: row1 전부 선택 가능
    selectableIndices = rows[1] ? rows[1].map(function(_, i) { return i; }) : [];
  }

  // 열 위치 계산 (가로 배치)
  var colWidth = 56;
  var rowGap = 12;
  var nodeSize = 42;

  function getNodePos(ri, ni, rowLen) {
    var x = ri * (colWidth + rowGap) + 10;
    var totalH = rowLen * (nodeSize + 16) - 16;
    var startY = (220 - totalH) / 2;
    var y = startY + ni * (nodeSize + 16);
    return { x: x, y: y };
  }

  // 연결선 SVG
  var lines = [];
  for (var ri = 0; ri < rows.length - 1; ri++) {
    var srcRow = rows[ri];
    var dstRow = rows[ri + 1];
    for (var si = 0; si < srcRow.length; si++) {
      var srcNode = srcRow[si];
      var srcPos = getNodePos(ri, si, srcRow.length);
      for (var ei = 0; ei < (srcNode.edges || []).length; ei++) {
        var di = srcNode.edges[ei];
        var dstPos = getNodePos(ri + 1, di, dstRow.length);
        var dstNode = dstRow[di];
        var isActive = ri === currentRow - 1 && si === map.currentNodeIdx;
        var isVisited = srcNode.visited && dstNode.visited;
        lines.push({
          key: ri + "-" + si + "-" + di,
          x1: srcPos.x + nodeSize / 2,
          y1: srcPos.y + nodeSize / 2,
          x2: dstPos.x + nodeSize / 2,
          y2: dstPos.y + nodeSize / 2,
          active: isActive,
          visited: isVisited,
        });
      }
    }
  }

  var mapWidth = rows.length * (colWidth + rowGap) + 20;

  return (
    <div style={g.wrapStyle}>
      <style>{g.CSS}</style>
      {g.audioButton}

      {/* Header */}
      <div style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--bd)" }}>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700 }}>
          {"🗺️ " + g.floor + "층 — " + (FLOOR_NAMES[g.floor] || "")}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4, fontSize: "var(--fs-sm)" }}>
          <span>{"❤️ " + g.hp + "/" + g.MAX_HP}</span>
          <span>{"💰 " + g.gold + "G"}</span>
        </div>
      </div>

      {/* Map area - horizontal scroll */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <div style={{ position: "relative", width: mapWidth, height: 240, margin: "10px auto" }}>

          {/* SVG lines */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {lines.map(function(l) {
              return (
                <line
                  key={l.key}
                  x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke={l.active ? "var(--gd)" : l.visited ? "#555" : "#333"}
                  strokeWidth={l.active ? 2.5 : 1.5}
                  strokeDasharray={l.active || l.visited ? "none" : "4 4"}
                  opacity={l.visited ? 0.5 : 1}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {rows.map(function(row, ri) {
            return row.map(function(node, ni) {
              var pos = getNodePos(ri, ni, row.length);
              var isCurrent = ri === currentRow && ni === map.currentNodeIdx && ri > 0;
              var isSelectable = ri === currentRow && selectableIndices.indexOf(ni) >= 0;
              var isVisited = node.visited;
              var nodeInfo = NODE_TYPES[node.type] || { icon: "●", name: "" };

              var bg = isVisited ? "#2a2a2a"
                : isSelectable ? "#1a2a3a"
                : isCurrent ? "#2a1a0a"
                : "#151515";
              var border = isCurrent ? "var(--gd)"
                : isSelectable ? "var(--ac)"
                : isVisited ? "#555"
                : "#333";
              var opacity = isVisited ? 0.45 : isSelectable ? 1 : 0.35;

              return (
                <div
                  key={node.id}
                  onClick={isSelectable ? function() { g.selectNode(ni); } : undefined}
                  style={{
                    position: "absolute",
                    left: pos.x, top: pos.y,
                    width: nodeSize, height: nodeSize,
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                    background: bg,
                    border: "2px solid " + border,
                    opacity: opacity,
                    cursor: isSelectable ? "pointer" : "default",
                    transition: "all 0.2s",
                    boxShadow: isSelectable ? "0 0 8px " + border : "none",
                    animation: isSelectable ? "pulse 1.5s infinite" : "none",
                  }}
                >
                  {node.type === "start" ? "●" : isVisited ? "✓" : nodeInfo.icon}
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: "8px 16px", borderTop: "1px solid var(--bd)", fontSize: "var(--fs-sm)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <span>⚔️전투</span>
          <span>💪정예</span>
          <span>🔥캠프</span>
          <span>🏪상점</span>
          <span>❓이벤트</span>
          <span>👑보스</span>
        </div>
        <div style={{ marginTop: 6, color: "#888" }}>
          빛나는 노드를 터치하여 경로를 선택하세요
        </div>
      </div>
    </div>
  );
}

// === EVENT SCREEN (맵 이벤트 처리) ===
function EventScreen({ game }) {
  var g = game;
  var evt = g.mapEvent;
  if (!evt) return null;

  function resolveEvent(choice) {
    if (evt.effect === "gold") {
      g.setGold(function(v) { return v + evt.val; });
    } else if (evt.effect === "heal") {
      g.setHp(function(h) { return Math.min(g.MAX_HP, h + evt.val); });
    } else if (evt.effect === "gamble") {
      if (choice === "accept" && g.gold >= evt.cost) {
        g.setGold(function(v) { return v - evt.cost; });
        if (Math.random() < 0.5) {
          g.setGold(function(v) { return v + evt.winGold; });
          g.setOverlay("🎰 승리! +" + evt.winGold + "G");
        } else {
          g.setOverlay("🎰 패배... -" + evt.cost + "G");
        }
      }
    } else if (evt.effect === "enhance") {
      // 랜덤 카드 1장 등급 +1
      if (g.deck.length > 0) {
        var ri = Math.floor(Math.random() * g.deck.length);
        var target = g.deck[ri];
        g.setOverlay("🔨 " + (target.isCommon ? target.common.name : "카드") + " 등급 +1!");
      }
    } else if (evt.effect === "cursedWell") {
      g.setHp(function(h) { return Math.max(1, h - evt.hpCost); });
      // 랜덤 카드 등급 +2
      g.setOverlay("🪦 HP -" + evt.hpCost + ", 카드 등급 +2!");
    } else if (evt.effect === "relicOffer") {
      // 간단 처리: 골드 보상으로 대체
      g.setGold(function(v) { return v + 10; });
      g.setOverlay("🧙 방랑자가 10G를 건네주었다.");
    }
    setTimeout(function() { g.setOverlay(null); }, 1500);
    g.goToMap();
  }

  return (
    <div style={g.wrapStyle}>
      <style>{g.CSS}</style>
      {g.audioButton}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{evt.icon}</div>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, marginBottom: 8 }}>{evt.name}</div>
        <div style={{ fontSize: "var(--fs-md)", color: "#ccc", marginBottom: 24, lineHeight: 1.5 }}>{evt.desc}</div>

        {evt.effect === "gamble" ? (
          <div style={{ display: "flex", gap: 12 }}>
            <Btn
              label={"도전! (-" + evt.cost + "G)"}
              onClick={function() { resolveEvent("accept"); }}
              disabled={g.gold < evt.cost}
            />
            <Btn label="거절" onClick={function() { g.goToMap(); }} />
          </div>
        ) : (
          <Btn
            label={evt.effect === "cursedWell" ? "마신다 (HP -" + evt.hpCost + ")" : "확인"}
            onClick={function() { resolveEvent(); }}
          />
        )}

        {evt.effect === "cursedWell" && (
          <div style={{ marginTop: 8 }}>
            <Btn label="지나친다" onClick={function() { g.goToMap(); }} />
          </div>
        )}
      </div>
    </div>
  );
}

export { MapScreen, EventScreen };
