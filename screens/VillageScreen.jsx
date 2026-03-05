import { CLASSES, SKILL_TREES, ULTIMATE_SKILL } from "../data.js";
import { Btn } from "../components.jsx";
import { sfx } from "../audio.js";

export function VillageScreen({ game }) {
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
          <h2 style={{ fontSize: 16 }}>🌟 스킬 트리</h2>
          <div style={{ fontSize: 14, color: "var(--or)", fontWeight: 700 }}>⭐ {metaPoints} 포인트</div>
          <div style={{ fontSize: 12, color: "var(--dm)", marginTop: 2 }}>총 투자: {totalInvested}⭐</div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {visibleTrees.map(function(tree) {
            var isActive = skillTab === tree.id;
            var tColor = tree.color || "#888";
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
                        <span style={{ color: "var(--ac)", fontSize: 12, marginLeft: 6 }}>{lv}/{node.max}</span>
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
          <Btn onClick={function() { setScreen("menu"); sfx.bgmOn("home"); }} color="var(--rd)" style={{ padding: "10px 32px" }}>⚔️ 던전으로</Btn>
        </div>
      </div>
    </div>
  );
}
