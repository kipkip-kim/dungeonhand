import { sfx } from "../audio.js";
import { SUIT_ORDER } from "../data.js";
import { relicBorderColor, CardView, Btn, DeckViewer, GameWrap } from "../components.jsx";

export function ShopScreen({ game }) {
  var {
    wrapStyle, CSS, audioButton,
    hp, MAX_HP, gold, deck, classData, relics, floor, floorMap,
    shopCards, shopRelic, shopHealed, shopRemoved, SHOP_MAX_REMOVE,
    upgradeLevels, deckView, deckSort,
    buyCard, buyRelic, removeCard, leaveShop,
    setGold, setHp, setShopHealed, setDeckView, setDeckSort,
  } = game;

  var discount = upgradeLevels.merchant > 0 ? 0.8 : 1;
  var relicCost = shopRelic ? Math.floor((shopRelic.tier === 1 ? 30 : shopRelic.tier === 2 ? 50 : 75) * discount) : 0;
  var healCost = Math.floor(10 * discount);
  var removeCost = Math.floor(10 * discount);
  var sortedDeck = deck.slice().sort(function(a, b) {
    var suitOrd = SUIT_ORDER;
    if (a.isCommon !== b.isCommon) return a.isCommon ? 1 : -1;
    if (!a.isCommon && !b.isCommon) {
      if (a.suitId !== b.suitId) return (suitOrd[a.suitId] || 0) - (suitOrd[b.suitId] || 0);
      return a.grade - b.grade;
    }
    if (a.isCommon && b.isCommon) return a.common.id.localeCompare(b.common.id);
    return 0;
  });

  return (
    <GameWrap game={game}>
      {audioButton}
      <div style={{ padding: "12px 14px", background: "var(--pn)", borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>🏪 대장간</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: "var(--fs-md)" }}>❤️{hp}/{MAX_HP}</span>
          <span style={{ color: "var(--gd)", fontWeight: 700 }}>💰{gold}</span>
          <button
            onClick={function() { setDeckView(true); }}
            style={{ background: "var(--bd)", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 14, color: "var(--tx)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}
          >
            📦덱
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
        <div>
          <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>📦 카드</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {shopCards.map(function(c) {
              var cost = Math.floor((c.grade * 3 + (c.isCommon ? 2 : 0) + (c.keyword ? 5 : 0)) * discount);
              return (
                <div key={c.id} style={{ textAlign: "center" }}>
                  <CardView card={c} cls={classData} small />
                  <Btn onClick={function() { buyCard(c, cost); }} disabled={gold < cost} style={{ fontSize: "var(--fs-md)", padding: "5px 12px", marginTop: 4 }}>
                    💰{cost}
                  </Btn>
                </div>
              );
            })}
          </div>
        </div>
        {shopRelic && (
          <div>
            <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>🔮 유물</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ padding: 10, background: "var(--cd)", borderRadius: 10, border: "1px solid " + relicBorderColor(shopRelic.tier), textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>{shopRelic.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{shopRelic.name}</div>
                <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>{shopRelic.desc}</div>
              </div>
              <Btn onClick={function() { buyRelic(shopRelic, relicCost); }} disabled={gold < relicCost} color="var(--pu)">💰{relicCost}</Btn>
            </div>
          </div>
        )}
        <div>
          <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>❤️ 회복 (1회 한정)</h3>
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
              color="var(--gn)"
            >
              {shopHealed ? "완료" : hp >= MAX_HP ? "만탄" : "💰" + healCost}
            </Btn>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 8 }}>🗑️ 제거 (💰{removeCost}, {SHOP_MAX_REMOVE - shopRemoved}회 남음)</h3>
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
            {sortedDeck.map(function(c) {
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
      </div>
      <div style={{ padding: "clamp(8px, 1.5vh, 14px)", borderTop: "1px solid var(--bd)", textAlign: "center" }}>
        <Btn onClick={leaveShop} color="var(--rd)" style={{ fontSize: "var(--fs-md)", padding: "clamp(8px, 1.5vh, 14px) 36px" }}>
          {floorMap && floorMap.currentRow >= floorMap.rows.length - 1 ? (floor >= 5 ? "🏆 클리어!" : "⚔️ " + (floor + 1) + "층으로") : "🗺️ 맵으로"}
        </Btn>
      </div>
      <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
    </GameWrap>
  );
}
