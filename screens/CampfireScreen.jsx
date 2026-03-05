import { useState } from "react";
import { FLOOR_NAMES } from "../data.js";
import { CardView, Btn } from "../components.jsx";

export function CampfireScreen({ game }) {
  var { wrapStyle, CSS, audioButton, campPhase, campEvent, hp, MAX_HP, floor, classData, passiveState, stolenCard, deck, enterPhase2, enterPhase3, leaveCampfire, resolveCampfire, sellCard } = game;
  var [pendingSell, setPendingSell] = useState(null);

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
            <h2 style={{ fontSize: 15, color: "var(--or)", marginBottom: 12 }}>화톳불을 발견했다</h2>
            <div style={{ background: "#ffffff08", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
              <p style={{ color: "var(--dm)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                저 앞에 따뜻한 빛이 보인다.
                <br />지친 몸을 이끌고 불 옆에 다가간다.
              </p>
            </div>
            <div style={{ fontSize: 14, color: "var(--dm)", marginBottom: 8 }}>❤️ {hp}/{MAX_HP}</div>
            <Btn onClick={enterPhase2} color="var(--or)" style={{ padding: "10px 28px", fontSize: 13 }}>
              불 옆에 앉다 →
            </Btn>
          </div>
        )}

        {/* Phase 2: Rest & Heal */}
        {campPhase === 2 && (
          <div style={{ textAlign: "center", animation: "slideUp 0.5s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 12, animation: "victBounce 2s ease infinite" }}>🔥</div>
            <h2 style={{ fontSize: 15, color: "var(--or)", marginBottom: 12 }}>휴식</h2>
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
            <Btn onClick={enterPhase3} color="var(--or)" style={{ padding: "10px 28px", fontSize: 13 }}>
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
                <Btn onClick={leaveCampfire} color="var(--or)" style={{ marginTop: 14, padding: "10px 28px", fontSize: 13 }}>
                  출발 →
                </Btn>
              </div>
            )}

            {/* Fairy */}
            {campEvent.id === "fairy" && (
              <div style={{ background: "#a855f722", border: "1px solid var(--ac)", borderRadius: 12, padding: "16px 24px", maxWidth: 300, marginBottom: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🧚</div>
                <p style={{ color: "#d4d4d8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  잠에서 깨니 작은 빛이 주위를 맴돌고 있다.
                  <br />요정이 손끝으로 이마를 어루만졌다.
                  <br />몸 안에서 힘이 솟아오른다!
                </p>
                <div style={{ marginTop: 10, fontSize: 14, color: "var(--ac)", fontWeight: 700 }}>
                  {classData.passive.onCamp(passiveState).msg}
                </div>
                <Btn onClick={resolveCampfire} color="var(--ac)" style={{ marginTop: 12, padding: "8px 24px", fontSize: 14 }}>
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
                <div style={{ fontSize: 14, color: "var(--dm)", margin: "6px 0" }}>탭하여 선택 → 확인 후 판매 (등급×3 골드)</div>
                <div style={{ maxHeight: 220, overflow: "auto", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", padding: "4px 0" }}>
                  {deck.map(function(c) {
                    var isSelected = pendingSell && pendingSell.id === c.id;
                    return (
                      <div key={c.id} onClick={function() { setPendingSell(isSelected ? null : c); }} style={{ cursor: "pointer", position: "relative", border: isSelected ? "2px solid #fbbf24" : "2px solid transparent", borderRadius: 8 }}>
                        <CardView card={c} cls={classData} small={true} />
                        <div style={{ position: "absolute", bottom: 2, right: 2, background: "#fbbf24", color: "#000", borderRadius: 4, padding: "1px 4px", fontSize: 11, fontWeight: 700 }}>
                          💰{c.grade * 3}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pendingSell && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#fbbf2411", border: "1px solid #fbbf2444", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 700, marginBottom: 6 }}>
                      {pendingSell.isCommon ? pendingSell.common.name : (pendingSell.suitId + " " + pendingSell.grade)} 판매? 💰{pendingSell.grade * 3}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <Btn onClick={function() { sellCard(pendingSell); setPendingSell(null); }} color="#fbbf24" style={{ padding: "5px 16px", fontSize: 12 }}>
                        판매 확인
                      </Btn>
                      <Btn onClick={function() { setPendingSell(null); }} color="var(--dm)" style={{ padding: "5px 16px", fontSize: 12 }}>
                        취소
                      </Btn>
                    </div>
                  </div>
                )}
                <Btn onClick={function() { setPendingSell(null); leaveCampfire(); }} style={{ marginTop: 8, fontSize: 16, padding: "8px 20px" }}>
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
