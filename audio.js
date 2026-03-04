// === AUDIO ===
const sfx = (() => {
  let ctx = null;
  let isOn = false;
  let bgmId = null;
  const melody = [330, 392, 494, 440, 392, 330, 294, 262, 330, 392, 440, 494];
  let mIdx = 0;

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

  return {
    getOn: () => isOn,
    toggle: () => {
      isOn = !isOn;
      if (isOn) { getCtx(); sfx.bgmOn(); } else { sfx.bgmOff(); }
      return isOn;
    },
    bgmOn: () => {
      sfx.bgmOff();
      if (!isOn) return;
      mIdx = 0;
      bgmId = setInterval(() => {
        tone(melody[mIdx % melody.length], 0.2, "triangle", 0.04);
        mIdx++;
      }, 250);
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
    dmg: () => {
      if (!isOn) return;
      try {
        const c = getCtx();
        const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.06;
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start();
      } catch (e) { /* silent */ }
    },
    enemy: () => { tone(110, 0.1, "sawtooth", 0.08); tone(82, 0.1, "sawtooth", 0.06, 0.08); },
    win: () => { [262, 330, 392, 523].forEach((f, i) => tone(f, 0.2, "triangle", 0.08, i * 0.12)); },
    lose: () => { [330, 294, 262, 247].forEach((f, i) => tone(f, 0.3, "triangle", 0.07, i * 0.2)); },
    gold: () => { tone(1319, 0.04, "sine", 0.05); tone(1568, 0.04, "sine", 0.05, 0.04); },
    heal: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.08, "sine", 0.05, i * 0.06)); },
  };
})();

export { sfx };
