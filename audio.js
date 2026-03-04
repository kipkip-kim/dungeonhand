// === AUDIO ===
const sfx = (() => {
  let ctx = null;
  let isOn = false;
  let bgmId = null;
  let mIdx = 0;

  // BGM melodies by type
  const melodies = {
    battle: {
      notes: [330, 392, 494, 440, 392, 330, 294, 262, 330, 392, 440, 494],
      tempo: 250, wave: "triangle", vol: 0.04,
    },
    campfire: {
      notes: [523, 659, 784, 659, 523, 784, 1047, 784, 659, 523, 659, 784],
      tempo: 400, wave: "sine", vol: 0.03,
    },
    shop: {
      notes: [392, 494, 523, 494, 392, 330, 392, 494, 523, 659, 523, 494],
      tempo: 300, wave: "triangle", vol: 0.035,
    },
  };

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // iOS Safari unlock: 무음 버퍼 재생으로 오디오 잠금 해제
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!isOn) return;
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.value = vol || 0.1;
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (delay || 0) + (dur || 0.1));
      o.connect(g);
      g.connect(c.destination);
      o.start(c.currentTime + (delay || 0));
      o.stop(c.currentTime + (delay || 0) + (dur || 0.1) + 0.05);
    } catch (e) { /* silent */ }
  }

  function noise(dur, vol) {
    if (!isOn) return;
    try {
      const c = getCtx();
      const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * vol;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  return {
    getOn: () => isOn,
    toggle: () => {
      isOn = !isOn;
      if (isOn) { getCtx(); sfx.bgmOn("battle"); } else { sfx.bgmOff(); }
      return isOn;
    },
    bgmOn: (type) => {
      sfx.bgmOff();
      if (!isOn) return;
      var m = melodies[type] || melodies.battle;
      mIdx = 0;
      bgmId = setInterval(() => {
        tone(m.notes[mIdx % m.notes.length], m.tempo * 0.8 / 1000, m.wave, m.vol);
        mIdx++;
      }, m.tempo);
    },
    bgmOff: () => {
      if (bgmId) { clearInterval(bgmId); bgmId = null; }
    },
    card: () => tone(523, 0.05),
    hit: (tier) => {
      const notes = [262, 330, 392];
      if (tier >= 3) notes.push(523);
      if (tier >= 4) notes.push(659);
      notes.forEach((f, i) => tone(f, 0.12, "square", 0.06, i * 0.06));
    },
    dmg: () => { noise(0.08, 0.06); },
    enemy: () => { tone(110, 0.1, "sawtooth", 0.08); tone(82, 0.1, "sawtooth", 0.06, 0.08); },
    win: () => { [262, 330, 392, 523].forEach((f, i) => tone(f, 0.2, "triangle", 0.08, i * 0.12)); },
    lose: () => { [330, 294, 262, 247].forEach((f, i) => tone(f, 0.3, "triangle", 0.07, i * 0.2)); },
    click: () => { tone(1200, 0.03, "sine", 0.04); tone(1600, 0.02, "sine", 0.03, 0.02); },
    gold: () => { tone(1319, 0.04, "sine", 0.05); tone(1568, 0.04, "sine", 0.05, 0.04); },
    heal: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.08, "sine", 0.05, i * 0.06)); },
  };
})();

export { sfx };
