import { sfx } from "../audio.js";
import { relicBorderColor } from "../components.jsx";
import { CardView, Btn, DeckViewer } from "../components.jsx";

export function ShopScreen({ game }) {
  var {
    wrapStyle, CSS, audioButton,
    hp, MAX_HP, gold, deck, classData, relics, floor,
    shopCards, shopRelic, shopHealed, shopRemoved, SHOP_MAX_REMOVE,
    upgradeLevels, deckView, deckSort,
    buyCard, buyRelic, removeCard, leaveShop,
    setGold, setHp, setShopHealed, setDeckView, setDeckSort,
  } = game;

  var discount = upgradeLevels.merchant > 0 ? 0.8 : 1;

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
                  <div style={{ padding: 10, background: "var(--cd)", borderRadius: 10, border: "1px solid " + relicBorderColor(shopRelic.tier), textAlign: "center" }}>
                    <div style={{ fontSize: 20 }}>{shopRelic.emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{shopRelic.name}</div>
                    <div style={{ fontSize: 16, color: "var(--dm)" }}>{shopRelic.desc}</div>
                  </div>
                  <Btn onClick={function() { buyRelic(shopRelic, relicCost); }} disabled={gold < relicCost} color="var(--pu)">💰{relicCost}</Btn>
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
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>🗑️ 제거 (💰{removeCost}, {SHOP_MAX_REMOVE - shopRemoved}회 남음)</h3>
          {deck.length <= 10 && (
            <div style={{ fontSize: 12, color: "var(--rd)", marginBottom: 6 }}>덱 10장 이하 — 제거 불가</div>
          )}
          {shopRemoved >= SHOP_MAX_REMOVE && (
            <div style={{ fontSize: 12, color: "var(--rd)", marginBottom: 6 }}>제거 횟수 소진</div>
          )}
          {deck.length > 10 && shopRemoved < SHOP_MAX_REMOVE && gold < removeCost && (
            <div style={{ fontSize: 12, color: "var(--rd)", marginBottom: 6 }}>골드 부족</div>
          )}
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
              var canRemove = gold >= removeCost && deck.length > 10 && shopRemoved < SHOP_MAX_REMOVE;
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
      <div style={{ padding: "clamp(8px, 1.5vh, 14px)", borderTop: "1px solid var(--bd)", textAlign: "center" }}>
        <Btn onClick={leaveShop} color="var(--rd)" style={{ fontSize: 14, padding: "clamp(8px, 1.5vh, 14px) 36px" }}>
          {floor >= 5 ? "🏆 클리어!" : "다음 층 →"}
        </Btn>
      </div>
      <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
    </div>
  );
}
