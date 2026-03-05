// === AUDIO (File-based) ===
const sfx = (() => {
  const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let isOn = false;
  let currentBgm = null;
  let currentBgmType = null;
  let iosUnlocked = false;

  // --- iOS Audio Unlock ---
  function unlockIOS() {
    if (iosUnlocked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      ctx.resume();
      iosUnlocked = true;
    } catch (e) { /* silent */ }
  }

  // --- SFX preload ---
  const sfxNames = ["click", "card", "hit", "dmg", "enemy", "win", "lose", "gold", "heal"];
  const sounds = {};
  const sfxVolume = { click: 0.3, card: 0.3, win: 0.75, heal: 0.5 };
  sfxNames.forEach(function (name) {
    const a = new Audio();
    a.preload = "auto";
    a.src = BASE + "/audio/sfx/" + name + ".ogg";
    if (sfxVolume[name]) a.volume = sfxVolume[name];
    sounds[name] = a;
  });

  function playSfx(name) {
    if (!isOn) return;
    try {
      var a = sounds[name];
      if (!a) return;
      // Reset to start for rapid re-trigger
      a.currentTime = 0;
      a.play().catch(function () {});
    } catch (e) { /* silent */ }
  }

  // --- BGM ---
  const bgmCache = {};

  function getBgm(type) {
    if (!bgmCache[type]) {
      var a = new Audio();
      a.preload = "auto";
      a.loop = true;
      a.volume = 0.3;
      a.src = BASE + "/audio/bgm/" + type + ".ogg";
      bgmCache[type] = a;
    }
    return bgmCache[type];
  }

  return {
    getOn: function () { return isOn; },
    toggle: function () {
      isOn = !isOn;
      if (isOn) {
        unlockIOS();
        sfx.bgmOn(currentBgmType || "home");
      } else {
        sfx.bgmOff();
      }
      return isOn;
    },
    bgmOn: function (type) {
      sfx.bgmOff();
      var t = type || "battle";
      currentBgmType = t;
      if (!isOn) return;
      try {
        var a = getBgm(t);
        currentBgm = a;
        a.currentTime = 0;
        a.play().catch(function () {});
      } catch (e) { /* silent */ }
    },
    bgmOff: function () {
      if (currentBgm) {
        try {
          currentBgm.pause();
          currentBgm.currentTime = 0;
        } catch (e) { /* silent */ }
        currentBgm = null;
      }
    },
    click: function () { playSfx("click"); },
    card: function () { playSfx("card"); },
    hit: function (/* tier */) { playSfx("hit"); },
    dmg: function () { playSfx("dmg"); },
    enemy: function () { playSfx("enemy"); },
    win: function () { playSfx("win"); },
    lose: function () { playSfx("lose"); },
    gold: function () { playSfx("gold"); },
    heal: function () { playSfx("heal"); },
  };
})();

export { sfx };
