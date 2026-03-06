import { CLASSES, SUIT_ORDER } from "../data.js";
import { relicBorderColor, CardView, Btn, DeckViewer } from "../components.jsx";

// === RELIC SWAP OVERLAY ===
export function PendingRelicOverlay({ game }) {
  var { wrapStyle, CSS, pendingRelic, relics, swapRelic, discardPendingRelic } = game;
  var prBorder = relicBorderColor(pendingRelic.tier);
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ background: "var(--cd)", border: "1px solid var(--bd)", borderRadius: 16, padding: 24, maxWidth: 340, width: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--rd)" }}>인벤토리가 가득 찼습니다!</div>
          <div style={{ fontSize: 13, color: "var(--dm)" }}>새 유물을 장착하려면 기존 유물 하나를 교체하세요</div>
          <div style={{ padding: 14, background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid " + prBorder, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: "80%" }}>
            <span style={{ fontSize: 28 }}>{pendingRelic.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{pendingRelic.name}</span>
            <span style={{ fontSize: 13, color: "var(--dm)", textAlign: "center" }}>{pendingRelic.desc}</span>
            <span style={{ fontSize: 11, color: "var(--gn)" }}>NEW</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>교체할 유물을 선택하세요:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {relics.map(function(r) {
              var bCol = relicBorderColor(r.tier);
              return (
                <div
                  key={r.id}
                  onClick={function() { swapRelic(r); }}
                  style={{ width: 90, padding: 10, background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid " + bCol, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 22 }}>{r.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: "var(--dm)", textAlign: "center" }}>{r.desc}</span>
                </div>
              );
            })}
          </div>
          <Btn onClick={discardPendingRelic} style={{ marginTop: 6, background: "#5c1a0e" }}>버리기 (영구 삭제)</Btn>
        </div>
      </div>
    </div>
  );
}

// === MENU SCREEN ===
export function MenuScreen({ game }) {
  var { wrapStyle, CSS, audioButton, startRun, setScreen, metaPoints, sfx } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 48, animation: "popIn 0.5s ease" }}>🗡️</div>
        <h1 style={{ fontSize: "var(--fs-xl)", fontFamily: "'Silkscreen', cursive", background: "linear-gradient(135deg,#e8a820,#c0392b,#9b59b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textAlign: "center", lineHeight: 1.5 }}>
          DUNGEON HAND
        </h1>
        <p style={{ color: "var(--dm)", fontSize: "var(--fs-md)" }}>도적의 카드로 던전을 정복하라!</p>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Btn onClick={function() { if (CLASSES.length === 1) { startRun(CLASSES[0].id); } else { setScreen("classSelect"); } }} color="var(--rd)" style={{ fontSize: 14, padding: "14px 32px" }}>
            ⚔️ 던전 입장
          </Btn>
          <Btn onClick={function() { setScreen("village"); }} color="var(--gn)" style={{ fontSize: 14, padding: "14px 32px" }}>
            🌳 스킬 트리
          </Btn>
        </div>
        {metaPoints > 0 && (
          <div style={{ color: "var(--or)", fontSize: 14 }}>⭐ {metaPoints} 포인트 보유</div>
        )}
      </div>
    </div>
  );
}

// === CLASS SELECT SCREEN ===
export function ClassSelectScreen({ game }) {
  var { wrapStyle, CSS, audioButton, startRun } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>직업을 선택하세요</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {CLASSES.map(function(c) {
            return (
              <div
                key={c.id}
                onClick={function() { startRun(c.id); }}
                style={{ width: "clamp(160px, calc(var(--gw) * 0.4), 240px)", background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid var(--bd)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", padding: "16px 12px" }}
              >
                <span style={{ fontSize: 42 }}>{c.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                <div style={{ fontSize: 14, color: "var(--ac)", textAlign: "center", lineHeight: 1.4 }}>
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

// === REWARD SCREEN ===
export function RewardScreen({ game }) {
  var { wrapStyle, CSS, audioButton, rewardCards, classData, addCardToDeck, setScreen, skipReward, deck, deckView, setDeckView, deckSort, setDeckSort } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{ fontSize: 38, animation: "popIn 0.4s ease" }}>⚔️ 승리!</div>
        <h3 style={{ fontSize: "var(--fs-lg)" }}>보상 카드 선택</h3>
        <div style={{ display: "flex", gap: 10 }}>
          {rewardCards.map(function(c) {
            return (
              <div key={c.id} style={{ cursor: "pointer", textAlign: "center" }} onClick={function() { addCardToDeck(c); }}>
                <CardView card={c} cls={classData} />
                {c.keyword && (
                  <div style={{ fontSize: 14, color: "var(--ac)", marginTop: 4 }}>
                    {c.keyword.icon} {c.keyword.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={function() { setScreen("enhance"); }} color="var(--pu)">⬆️강화</Btn>
          <Btn onClick={function() { setDeckView(true); }}>📦덱 보기</Btn>
          <Btn onClick={skipReward}>건너뛰기</Btn>
        </div>
      </div>
      <DeckViewer deck={deck} cls={classData} show={deckView} sortMode={deckSort} onSort={function(m) { setDeckSort(m); }} onClose={function() { setDeckView(false); }} />
    </div>
  );
}

// === ENHANCE SCREEN ===
export function EnhanceScreen({ game }) {
  var { wrapStyle, CSS, audioButton, deck, classData, enhanceCard, skipReward, deckView, setDeckView, deckSort, setDeckSort } = game;
  var enhanceable = deck.filter(function(c) { return (c.enhanceCount || 0) < 2; });
  var suitOrder = SUIT_ORDER;
  var sorted = enhanceable.slice().sort(function(a, b) {
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
        <h3 style={{ fontSize: "var(--fs-lg)" }}>강화할 카드 (등급+1, 카드당 최대2회)</h3>
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

// === RELIC REWARD SCREEN ===
export function RelicRewardScreen({ game }) {
  var { wrapStyle, CSS, audioButton, rewardRelics, pickRelic, deck, classData, deckView, setDeckView, deckSort, setDeckSort } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{ fontSize: 24, animation: "popIn 0.4s ease" }}>👑 보스 처치!</div>
        <h3 style={{ fontSize: "var(--fs-lg)" }}>유물 선택</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", padding: "0 8px" }}>
          {rewardRelics.map(function(r) {
            var borderCol = relicBorderColor(r.tier);
            return (
              <div
                key={r.id}
                onClick={function() { pickRelic(r); }}
                style={{ width: "clamp(100px, calc(var(--gw) * 0.26), 180px)", padding: "14px 10px", background: "linear-gradient(145deg,var(--cd),var(--card-dark))", border: "2px solid " + borderCol, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}
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

// === VICTORY SCREEN ===
export function VictoryScreen({ game }) {
  var { wrapStyle, CSS, audioButton, gold, relics, runPoints, claimAndGo } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(10px, 1.8vh, 18px)" }}>
        <div style={{ fontSize: 48, animation: "victBounce 1.5s ease infinite" }}>🏆</div>
        <h1 style={{ fontSize: "var(--fs-xl)", fontFamily: "'Silkscreen', cursive", background: "linear-gradient(135deg,#e8a820,#d35400)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          VICTORY!
        </h1>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gd)" }}>💰{gold}</div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>골드</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ac)" }}>{relics.length}</div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>유물</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--or)" }}>+{runPoints}⭐</div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--dm)" }}>포인트</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Btn onClick={function() { claimAndGo("village"); }} color="var(--gn)">🏘️ 마을</Btn>
          <Btn onClick={function() { claimAndGo("menu"); }} color="var(--rd)">🃏 다시 도전</Btn>
        </div>
      </div>
    </div>
  );
}

// === DEFEAT SCREEN ===
export function DefeatScreen({ game }) {
  var { wrapStyle, CSS, audioButton, floor, runPoints, claimAndGo } = game;
  return (
    <div style={wrapStyle}>
      <style>{CSS}</style>
      {audioButton}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(10px, 1.8vh, 18px)" }}>
        <div style={{ fontSize: 44 }}>💀</div>
        <h1 style={{ fontSize: "var(--fs-xl)", fontFamily: "'Silkscreen', cursive", color: "var(--rd)" }}>DEFEAT</h1>
        <p style={{ color: "var(--dm)" }}>{floor}층에서 쓰러졌습니다...</p>
        {runPoints > 0 && (
          <div style={{ fontSize: 14, color: "var(--or)", fontWeight: 700 }}>+{runPoints}⭐ 획득</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Btn onClick={function() { claimAndGo("menu"); }} color="var(--gn)">🏠 홈으로</Btn>
          <Btn onClick={function() { claimAndGo("restart"); }} color="var(--rd)">🃏 다시 도전</Btn>
        </div>
      </div>
    </div>
  );
}
