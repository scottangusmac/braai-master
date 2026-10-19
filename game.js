/* ============================================================================
   BRAAI MASTER — a co-op braai survival game
   One fire. Six meats. Jennifer Aniston.
   ========================================================================== */
(() => {
"use strict";

/* ------------------------------------------------------------------ utils */
const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a || 1), 0, 1);
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const finite = (v, d = 0) => (Number.isFinite(v) ? v : d);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const fmtTime = (s) => {
  s = Math.max(0, Math.ceil(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* -------------------------------------------------------------- constants */
const VW = 1600, VH = 900;
const PARTY_TIME = 240;
const VIBE_START = 42;
const VIBE_GOAL = 100;

const BRAAI = {
  x0: 118, x1: 1422, top: 296, front: 506, faceY: 598,
  rows: [366, 446], cols: 12, zoneCount: 4,
};
const COL_W = (BRAAI.x1 - BRAAI.x0) / BRAAI.cols;
const SLOT_COUNT = BRAAI.rows.length * BRAAI.cols;
const ZONE_W = (BRAAI.x1 - BRAAI.x0) / BRAAI.zoneCount;
const WOODPILE = { x: 162, y: 702, r: 122 };
const BIN = { x: 812, y: 836, r: 92 };
const JEN = { x: 1452, y: 716 };
const PLAY = {
  minX: 64, maxX: 1536, minY: 648, maxY: 950, speed: 356,
  braaiY: 710, braaiReach: 150, guestReach: 150, slotReach: 190,
};
const FIRE = {
  decay: 0.0055, flameDecay: 0.105, ignite: 6.4, logCoal: 0.46, logFlame: 0.17,
  flare: 0.98, flareCd: 11, waterDrain: 0.27, waterRegen: 0.185, sprayFlame: 1.25, sprayCoal: 0.011,
};

const MEATS = [
  { id: "wors", name: "Boerewors", short: "Wors", lo: 0.60, hi: 0.82, rate: 0.074, raw: "#cf7272", done: "#74381c", accent: "#ffb24a", desc: "The people's champion" },
  { id: "steak", name: "Rump Steak", short: "Steak", lo: 0.50, hi: 0.69, rate: 0.060, raw: "#bd5a5d", done: "#65301b", accent: "#ff8a72", desc: "Juicy, with a crust" },
  { id: "kebab", name: "Chicken Kebab", short: "Kebab", lo: 0.80, hi: 1.00, rate: 0.063, raw: "#ead0a4", done: "#a55e24", accent: "#ffd56b", desc: "Must be cooked through" },
  { id: "corn", name: "Sweetcorn", short: "Corn", lo: 0.50, hi: 0.84, rate: 0.042, raw: "#f5d66d", done: "#c0882e", accent: "#ffe58a", desc: "Kernels in foil" },
  { id: "rashers", name: "Pork Rashers", short: "Rashers", lo: 0.72, hi: 0.95, rate: 0.108, raw: "#e39a9c", done: "#8b3f22", accent: "#ff9d8a", desc: "Crispy or nothing" },
  { id: "chops", name: "Lamb Chops", short: "Chops", lo: 0.58, hi: 0.79, rate: 0.061, raw: "#c96970", done: "#6d2f20", accent: "#ffb0a0", desc: "Fancy party meat" },
];

const PLAYER_COLORS = ["#ffb24a", "#78d9ff", "#a8d86b", "#ff8fa3", "#c7a0ff", "#ffd56b", "#71e7cf", "#ff9a5c"];
const GUEST_NAMES = [
  "Thandi", "Sipho", "Lerato", "Johan", "Nomsa", "Pieter", "Ayesha", "Bongani",
  "Chloe", "Riaan", "Zanele", "Kobus", "Priya", "Mandla", "Annelie", "Tshepo",
  "Sarah", "Dumi", "Elsa", "Vusi", "Naledi", "Willem", "Keshni", "Lwazi",
  "Megan", "Andile", "Carla", "Themba", "Elmarie", "Katlego", "Ryan", "Ntombi",
];
const GUEST_LOOKS = [
  { skin: "#7a4a30", hair: "#21140e", shirt: "#e0633d" }, { skin: "#c98b62", hair: "#3b2417", shirt: "#4fb0a0" },
  { skin: "#5c3522", hair: "#100b09", shirt: "#d8a23b" }, { skin: "#e0b28c", hair: "#b86a32", shirt: "#6e79d6" },
  { skin: "#8f5d3c", hair: "#2a1810", shirt: "#c8506f" }, { skin: "#f0c7a2", hair: "#e3c27a", shirt: "#7bb25b" },
  { skin: "#6a4029", hair: "#19100b", shirt: "#b45cc4" }, { skin: "#d3a075", hair: "#4b3020", shirt: "#e08a3e" },
  { skin: "#a86c47", hair: "#2c1a11", shirt: "#4b8bd0" }, { skin: "#efc39d", hair: "#c34f32", shirt: "#d7c05a" },
];
const JEN_LOOK = { skin: "#e7b48b", hair: "#e6c27a", dress: "#171014", accent: "#ff5b83" };
const JEN_QUOTES = [
  "That fire is looking good.", "I do love a man who can braai.", "Is that boerewors? I'm listening.",
  "Don't burn it, champion.", "The way you handle those tongs…", "I've dated actors, you know.",
  "Keep them coming, braai master.", "This party is actually fun.", "Medium, not hockey puck.",
  "I flew in for this, so… no pressure.", "You've got a little smoke on your cheek.",
  "I like my steak with a bit of confidence.",
];
const JEN_HIGH = ["Okay. I'm impressed.", "That's a proper braai.", "You're doing well, chef.", "I could stay here all night."];
const JEN_LOW = ["Hmm.", "Is that supposed to be raw?", "The fire's dying, hey.", "I'm just going to check my phone."];

/* --------------------------------------------------------------- dom refs */
const canvas = $("scene");
const overlayCanvas = $("overlay");
const overlayCtx = overlayCanvas.getContext("2d");

/* ------------------------------------------------------------------ audio */
class SoundEngine {
  constructor() {
    this.ctx = null; this.master = null; this.musicBus = null; this.sfxBus = null;
    this.sizzleGain = null; this.fireGain = null; this.sprayGain = null;
    this.muted = false; this.started = false; this.musicOn = false;
    this.step = 0; this.nextStep = 0; this.timer = 0; this.crackleT = 0;
    this.noise = null;
  }
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = (this.ctx = new AC());
    this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.82; this.master.connect(ac.destination);
    this.sfxBus = ac.createGain(); this.sfxBus.gain.value = 0.82; this.sfxBus.connect(this.master);
    this.musicBus = ac.createGain(); this.musicBus.gain.value = 0; this.musicBus.connect(this.master);
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    const loopNoise = () => {
      const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start();
      return s;
    };
    // sizzle
    const sz = ac.createBufferSource(); sz.buffer = buf; sz.loop = true;
    const szf = ac.createBiquadFilter(); szf.type = "bandpass"; szf.frequency.value = 4200; szf.Q.value = 0.7;
    this.sizzleGain = ac.createGain(); this.sizzleGain.gain.value = 0;
    sz.connect(szf); szf.connect(this.sizzleGain); this.sizzleGain.connect(this.master); sz.start();
    // fire rumble
    const fr = ac.createBufferSource(); fr.buffer = buf; fr.loop = true;
    const frf = ac.createBiquadFilter(); frf.type = "lowpass"; frf.frequency.value = 520; frf.Q.value = 0.5;
    this.fireGain = ac.createGain(); this.fireGain.gain.value = 0;
    fr.connect(frf); frf.connect(this.fireGain); this.fireGain.connect(this.master); fr.start();
    // spray hiss
    const sp = ac.createBufferSource(); sp.buffer = buf; sp.loop = true;
    const spf = ac.createBiquadFilter(); spf.type = "bandpass"; spf.frequency.value = 1600; spf.Q.value = 0.45;
    this.sprayGain = ac.createGain(); this.sprayGain.gain.value = 0;
    sp.connect(spf); spf.connect(this.sprayGain); this.sprayGain.connect(this.master); sp.start();
    // ambient bed
    const am = ac.createBufferSource(); am.buffer = buf; am.loop = true;
    const amf = ac.createBiquadFilter(); amf.type = "lowpass"; amf.frequency.value = 330; amf.Q.value = 0.4;
    const amg = ac.createGain(); amg.gain.value = 0.012;
    am.connect(amf); amf.connect(amg); amg.connect(this.master); am.start();
    this.started = true;
    this.nextStep = ac.currentTime + 0.08;
  }
  noiseBurst(dur = 0.1, gain = 0.08, type = "highpass", freq = 2000, q = 0.8, pan = 0, dest = null) {
    if (!this.ctx) return;
    const ac = this.ctx, t = ac.currentTime;
    const s = ac.createBufferSource(); s.buffer = this.noise;
    s.playbackRate.value = 0.8 + Math.random() * 0.5;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
    if (p) { p.pan.value = clamp(pan, -1, 1); }
    s.connect(f); f.connect(g);
    if (p) { g.connect(p); p.connect(dest || this.sfxBus); } else g.connect(dest || this.sfxBus);
    s.start(t); s.stop(t + dur + 0.02);
  }
  tone(freq = 440, dur = 0.15, type = "sine", gain = 0.08, slide = 0, pan = 0, delay = 0, dest = null) {
    if (!this.ctx) return;
    const ac = this.ctx, t = ac.currentTime + delay;
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
    if (p) { p.pan.value = clamp(pan, -1, 1); }
    o.connect(g);
    if (p) { g.connect(p); p.connect(dest || this.sfxBus); } else g.connect(dest || this.sfxBus);
    o.start(t); o.stop(t + dur + 0.03);
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.82, this.ctx.currentTime, 0.04);
  }
  setMusic(on) {
    this.musicOn = on;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.35);
  }
  update(dt, info) {
    if (!this.started) return;
    const ac = this.ctx, t = ac.currentTime;
    const siz = clamp(info.sizzle, 0, 1);
    this.sizzleGain.gain.setTargetAtTime(siz * 0.05, t, 0.08);
    const fire = clamp(info.fire, 0, 1);
    this.fireGain.gain.setTargetAtTime(fire * 0.14, t, 0.15);
    this.sprayGain.gain.setTargetAtTime(info.spray ? 0.055 : 0, t, 0.05);
    if (info.fire > 0.05) {
      this.crackleT -= dt;
      if (this.crackleT <= 0) {
        this.crackleT = 0.05 + Math.random() * (0.36 - info.fire * 0.22);
        this.noiseBurst(0.02 + Math.random() * 0.03, 0.006 + Math.random() * 0.018 * info.fire, "bandpass", 900 + Math.random() * 2600, 2, Math.random() * 2 - 1);
      }
    }
    if (this.musicOn) this.music(dt);
  }
  music() {
    const ac = this.ctx;
    if (!ac) return;
    if (this.nextStep < ac.currentTime - 0.6) { this.nextStep = ac.currentTime + 0.06; this.step = 0; }
    if (ac.currentTime < this.nextStep - 0.3) return;
    const spb = 60 / 92 / 4;
    while (this.nextStep < ac.currentTime + 0.12) {
      const s = this.step % 32, t = this.nextStep;
      const at = (fn) => fn();
      // kick
      if (s % 8 === 0) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.15);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.24);
      }
      // shaker
      if (s % 2 === 0) {
        const src = ac.createBufferSource(); src.buffer = this.noise;
        const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6500;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(s % 4 === 0 ? 0.017 : 0.009, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
        src.connect(f); f.connect(g); g.connect(this.musicBus); src.start(t); src.stop(t + 0.07);
      }
      // rim
      if (s % 8 === 4) {
        const src = ac.createBufferSource(); src.buffer = this.noise;
        const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1900; f.Q.value = 1.6;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        src.connect(f); f.connect(g); g.connect(this.musicBus); src.start(t); src.stop(t + 0.1);
      }
      // bass
      const bass = [55, 55, 65.4, 55, 49, 49, 58.3, 65.4];
      if (s % 4 === 0) {
        const n = bass[(s / 4) | 0];
        const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
        o.type = "triangle"; o.frequency.value = n;
        f.type = "lowpass"; f.frequency.value = 260;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.065, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + spb * 3.5);
        o.connect(f); f.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + spb * 4);
      }
      // marimba / plucks
      const arp = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 523.25];
      if (s % 4 === 2) {
        const n = arp[(s / 4) | 0] * (s >= 16 ? 1.5 : 1);
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = n;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.024, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.34);
        const o2 = ac.createOscillator(), g2 = ac.createGain();
        o2.type = "triangle"; o2.frequency.value = n * 2;
        g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.006, t + 0.006); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        o2.connect(g2); g2.connect(this.musicBus); o2.start(t); o2.stop(t + 0.16);
      }
      this.step++;
      this.nextStep += spb;
    }
  }
  sfx(name, pan = 0) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "select": this.tone(520, 0.06, "sine", 0.035, 90, pan); break;
      case "grab": this.noiseBurst(0.06, 0.02, "bandpass", 900, 1.5, pan); this.tone(220, 0.08, "sine", 0.03, 60, pan); break;
      case "place": this.noiseBurst(0.24, 0.055, "bandpass", 3000, 0.7, pan); this.tone(120, 0.12, "sine", 0.03, -40, pan); break;
      case "flip": this.noiseBurst(0.1, 0.04, "highpass", 2600, 0.7, pan); this.tone(620, 0.06, "square", 0.018, -100, pan); break;
      case "pick": this.tone(480, 0.09, "sine", 0.04, 140, pan); break;
      case "wood": this.noiseBurst(0.1, 0.06, "lowpass", 420, 0.8, pan); this.tone(90, 0.1, "sine", 0.05, -20, pan); break;
      case "toss": this.noiseBurst(0.3, 0.08, "lowpass", 700, 0.7, pan); this.tone(70, 0.22, "sine", 0.05, -30, pan); this.noiseBurst(0.28, 0.03, "bandpass", 2400, 0.7, pan); break;
      case "spray": this.noiseBurst(0.18, 0.04, "bandpass", 1900, 0.5, pan); break;
      case "perfect": {
        [0, 1, 2].forEach((i) => this.tone([659.25, 880, 1318.5][i], 0.22, "sine", 0.05, 0, pan, i * 0.06));
        break;
      }
      case "good": this.tone(523.25, 0.12, "sine", 0.04, 0, pan); this.tone(659.25, 0.16, "sine", 0.03, 0, pan, 0.07); break;
      case "raw": this.tone(170, 0.25, "sawtooth", 0.04, -70, pan); this.tone(120, 0.3, "square", 0.02, -30, pan); break;
      case "over": this.tone(140, 0.3, "sawtooth", 0.04, -60, pan); this.tone(95, 0.34, "square", 0.022, -25, pan); break;
      case "ruined": this.tone(110, 0.42, "sawtooth", 0.045, -50, pan); this.noiseBurst(0.35, 0.03, "lowpass", 500, 0.6, pan); break;
      case "guestleave": this.tone(330, 0.16, "triangle", 0.035, -80, pan); this.tone(247, 0.22, "triangle", 0.03, -70, pan, 0.13); break;
      case "flare": this.noiseBurst(0.5, 0.11, "lowpass", 900, 0.5, pan); this.tone(75, 0.45, "sine", 0.07, -25, pan); break;
      case "again": this.tone(392, 0.1, "sine", 0.04, 60, pan); this.tone(523.25, 0.14, "sine", 0.04, 40, pan, 0.08); break;
      case "emote": this.tone(740, 0.09, "triangle", 0.035, 160, pan); break;
      case "win": {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((n, i) => this.tone(n, 0.55, "sine", 0.055, 0, 0, i * 0.11));
        notes.forEach((n, i) => this.tone(n * 0.5, 0.7, "triangle", 0.025, 0, 0, i * 0.11));
        break;
      }
      case "lose": {
        [392, 349.23, 311.13, 261.63].forEach((n, i) => this.tone(n, 0.4, "triangle", 0.04, -12, 0, i * 0.15));
        break;
      }
      case "join": this.tone(660, 0.1, "sine", 0.03, 120); this.tone(990, 0.14, "sine", 0.025, 60, 0, 0.08); break;
    }
  }
}
const sound = new SoundEngine();
/* ------------------------------------------------------------ game state */
let EV_ID = 0;
function pushEvent(G, kind, x, y, txt = "", pan = null) {
  G.events.push({
    id: ++EV_ID, kind, x: r1(x), y: r1(y), txt: String(txt || "").slice(0, 40),
    pan: pan == null ? clamp((x - VW / 2) / (VW / 2), -1, 1) : pan,
  });
  if (G.events.length > 30) G.events.shift();
}
function makePlayer(id, name, color, x, y) {
  return {
    id, name: String(name || "Braai master").slice(0, 14), color,
    x, y, dir: 1, yaw: 0, pitch: 0, carry: null, water: 1, spraying: false, sz: 0,
    score: 0, served: 0, perfect: 0, emoteT: 0, emote: "", walk: Math.random() * 7,
    actCd: 0, joinT: 1.2, moving: false, sprinting: false,
  };
}
function guestNameFor(id) {
  return GUEST_NAMES[(id * 7 + 3) % GUEST_NAMES.length];
}
function guestLook(id) {
  const h = hash32("braai-guest-" + id);
  const base = GUEST_LOOKS[h % GUEST_LOOKS.length];
  return {
    skin: base.skin, hair: base.hair, shirt: base.shirt,
    hairStyle: (h >>> 5) % 4, accessory: (h >>> 9) % 5,
    height: 0.94 + ((h >>> 12) % 12) / 100,
  };
}
function newState(phase = "playing") {
  const G = {
    phase, seq: 0, timeLeft: PARTY_TIME, hype: VIBE_START, score: 0, served: 0, perfect: 0,
    combo: 0, bestCombo: 0, winT: 0, result: "", fireDeadT: 0, fireWarnT: 0,
    slots: new Array(SLOT_COUNT).fill(null),
    zones: Array.from({ length: BRAAI.zoneCount }, (_, i) => ({
      coal: 0.72 - i * 0.03, flame: 0.07, wet: 0, logs: [], flareCd: 2 + i * 0.4, seed: i * 97 + 13,
    })),
    guests: [], players: [], events: [], guestId: 1, spawnT: 6, demo: false,
  };
  return G;
}
function slotRow(i) { return (i / BRAAI.cols) | 0; }
function slotCol(i) { return i % BRAAI.cols; }
function slotZone(i) { return clamp(Math.floor(slotCol(i) / (BRAAI.cols / BRAAI.zoneCount)), 0, BRAAI.zoneCount - 1); }
function slotPos(i) {
  const row = slotRow(i), col = slotCol(i);
  const a = row === 0 ? BRAAI.x0 + 26 : BRAAI.x0;
  const b = row === 0 ? BRAAI.x1 - 26 : BRAAI.x1;
  return { x: a + (col + 0.5) * (b - a) / BRAAI.cols, y: BRAAI.rows[row] };
}
function zoneCenter(z) { return BRAAI.x0 + (z + 0.5) * ZONE_W; }
function nearestZone(x) { return clamp(Math.floor((x - BRAAI.x0) / ZONE_W), 0, BRAAI.zoneCount - 1); }
function zoneHeat(z) { return clamp(0.09 + z.coal * 0.96 + z.flame * 0.47 - z.wet * 0.17, 0, 1.6); }
function distTo(p, o) { return Math.hypot(p.x - o.x, p.y - o.y); }
function nearBraai(p) { return p.y < PLAY.braaiY; }
function playerOf(G, id) { return G.players.find((p) => p.id === id); }

function makeGuest(G, order, x, y, state = "waiting") {
  const id = G.guestId++;
  const look = guestLook(id);
  const pat = 62 + Math.random() * 20;
  return {
    id, name: guestNameFor(id), order, x, y, tx: x, ty: y, state,
    patience: pat, maxPat: pat, rt: 0, walk: Math.random() * 7, servedBy: null,
    txOff: 0, look,
  };
}
function spawnGuest(G) {
  const used = G.guests.filter((g) => g.state !== "leaving").map((g) => g.x);
  let tx = 800, ty = 745;
  for (let k = 0; k < 18; k++) {
    tx = 230 + Math.random() * (BRAAI.x1 - 320);
    ty = 694 + Math.random() * 114;
    if (tx > 1390) continue;
    if (used.some((x) => Math.abs(x - tx) < 92)) continue;
    if (Math.hypot(tx - JEN.x, ty - JEN.y) < 150) continue;
    break;
  }
  let order = (Math.random() * MEATS.length) | 0;
  const recent = G.guests.slice(-2).map((g) => g.order);
  if (recent.includes(order)) order = (order + 1 + ((Math.random() * 3) | 0)) % MEATS.length;
  tx = clamp(tx, 220, 1360); ty = clamp(ty, 694, 812);
  const g = makeGuest(G, order, tx + (Math.random() - 0.5) * 130, 946, "walkin");
  g.tx = tx; g.ty = ty;
  G.guests.push(g);
  return g;
}
function seedGuests(G) {
  const base = [0.24, 0.66, 0.44, 0.78, 0.12, 0.53];
  const n = G.demo ? 2 : 2;
  for (let i = 0; i < n; i++) {
    const tx = BRAAI.x0 + 100 + ((i + 0.4) * (BRAAI.x1 - BRAAI.x0 - 200)) / n;
    const ty = 706 + (i % 2) * 58;
    const g = makeGuest(G, (i * 2 + 1) % MEATS.length, tx, ty, "waiting");
    g.tx = tx; g.ty = ty;
    G.guests.push(g);
  }
}
function makeDemo() {
  const G = newState("menu");
  G.demo = true;
  G.hype = 64;
  G.score = 1240;
  G.served = 13;
  G.perfect = 9;
  G.bestCombo = 4;
  G.timeLeft = 143;
  const items = [
    [2, 0, 0.18, 0.14, 0, 0.01], [4, 0, 0.38, 0.30, 1, 0.02], [9, 1, 0.24, 0.20, 0, 0.01],
    [10, 2, 0.52, 0.41, 1, 0.02], [15, 3, 0.21, 0.18, 0, 0.01], [17, 5, 0.31, 0.26, 0, 0.02],
    [21, 4, 0.44, 0.38, 1, 0.05],
  ];
  for (const [idx, type, a, b, down, ch] of items) {
    G.slots[idx] = { type, a, b, down, ch, placeT: 0, flipT: 0, by: "demo" };
  }
  seedGuests(G);
  G.players = [makePlayer("demo1", "You", PLAYER_COLORS[0], 330, 716), makePlayer("demo2", "Sipho", PLAYER_COLORS[1], 620, 730)];
  G.players[0].carry = { k: "m", t: 0, a: 0, b: 0, ch: 0 };
  G.players[1].carry = { k: "m", t: 2, a: 0, b: 0, ch: 0 };
  G.players[0].walk = 1.1;
  G.spawnT = 999;
  return G;
}

/* --------------------------------------------------------------- snapshot */
function packCarry(c) {
  if (!c) return 0;
  if (c.k === "w") return { k: "w", n: c.n };
  return { k: "m", t: c.t, a: r3(c.a), b: r3(c.b), ch: r3(c.ch) };
}
function unpackCarry(c) {
  if (!c) return null;
  if (c.k === "w") return { k: "w", n: clamp(c.n | 0, 1, 3) };
  return { k: "m", t: clamp(c.t | 0, 0, MEATS.length - 1), a: finite(c.a), b: finite(c.b), ch: finite(c.ch) };
}
function packState(G) {
  return {
    n: G.seq, ph: G.phase, tl: r1(G.timeLeft), hy: r1(G.hype), sc: G.score | 0, sv: G.served | 0,
    pf: G.perfect | 0, cb: G.combo | 0, bc: G.bestCombo | 0, wt: r1(G.winT), rs: G.result || "",
    sl: G.slots.map((s) => s ? [s.type, r3(s.a), r3(s.b), s.down, r3(s.ch), r3(s.placeT || 0), r3(s.flipT || 0), s.by || ""] : 0),
    zn: G.zones.map((z) => [r3(z.coal), r3(z.flame), r3(z.wet), z.logs.map((l) => r3(l.ign))]),
    gu: G.guests.map((g) => [g.id, g.x | 0, g.y | 0, g.tx | 0, g.ty | 0, g.state, g.order, r1(g.patience), r1(g.maxPat), r3(g.rt), g.servedBy || ""]),
    pl: G.players.map((p) => [p.id, p.name, p.color, r1(p.x), r1(p.y), r2(p.yaw || 0), p.dir, packCarry(p.carry), p.spraying ? 1 : 0, p.sz | 0, r2(p.water), p.score | 0, p.served | 0, p.perfect | 0, r2(p.emoteT), p.emote || "", r2(p.walk || 0), p.moving ? 1 : 0]),
    ev: G.events.slice(-14).map((e) => [e.id, e.kind, r1(e.x), r1(e.y), e.txt || "", r2(e.pan)]),
  };
}
function fromSnap(s) {
  const G = {
    phase: s.ph, seq: s.n, timeLeft: finite(s.tl), hype: finite(s.hy), score: s.sc | 0,
    served: s.sv | 0, perfect: s.pf | 0, combo: s.cb | 0, bestCombo: s.bc | 0,
    winT: finite(s.wt), result: s.rs || "", fireDeadT: 0, fireWarnT: 0,
    slots: new Array(SLOT_COUNT).fill(null),
    zones: s.zn.map((z, i) => ({ coal: finite(z[0]), flame: finite(z[1]), wet: finite(z[2]), logs: (z[3] || []).map((ign) => ({ ign })), flareCd: 0, seed: i * 97 + 13 })),
    guests: s.gu.map((g) => ({
      id: g[0], name: guestNameFor(g[0]), order: g[6], x: finite(g[1]), y: finite(g[2]),
      tx: finite(g[3]), ty: finite(g[4]), state: g[5], patience: finite(g[7]), maxPat: finite(g[8]),
      rt: finite(g[9]), servedBy: g[10] || null, walk: 0, look: guestLook(g[0]),
    })),
    players: s.pl.map((p) => ({
      id: p[0], name: p[1], color: p[2], x: finite(p[3]), y: finite(p[4]), yaw: finite(p[5]), dir: finite(p[6], 1),
      carry: unpackCarry(p[7]), spraying: !!p[8], sz: p[9] | 0, water: finite(p[10], 1),
      score: p[11] | 0, served: p[12] | 0, perfect: p[13] | 0, emoteT: finite(p[14]), emote: p[15] || "",
      walk: finite(p[16]), moving: !!p[17], actCd: 0, joinT: 0, pitch: 0,
    })),
    events: s.ev.map((e) => ({ id: e[0], kind: e[1], x: e[2], y: e[3], txt: e[4], pan: e[5] })),
    guestId: 1, spawnT: 6, demo: false,
  };
  s.sl.forEach((v, i) => {
    if (!v) return;
    G.slots[i] = { type: v[0], a: v[1], b: v[2], down: v[3] ? 1 : 0, ch: v[4], placeT: v[5], flipT: v[6], by: v[7] };
  });
  return G;
}

/* ----------------------------------------------------------- game helpers */
function totalCook(it) { return it.a + it.b; }
function qualityOf(it) {
  const d = MEATS[it.type] || MEATS[0];
  const total = it.a + it.b;
  const ch = it.ch || 0;
  if (total > d.hi * 1.36 || ch > 0.56) return "ruined";
  if (total >= d.lo && total <= d.hi && ch <= 0.22) return "perfect";
  if (total > d.hi * 1.09 || ch > 0.38) return "over";
  if (total < d.lo * 0.86) return "raw";
  return "good";
}
function qualityText(it) {
  const q = qualityOf(it);
  if (q === "perfect") return "Perfect";
  if (q === "good") return "Good";
  if (q === "raw") return "Raw";
  if (q === "over") return "Overcooked";
  return "Cremated";
}
function qualityColor(q) {
  return q === "perfect" ? "#a8e063" : q === "good" ? "#ffd56b" : q === "raw" ? "#ff8f9c" : "#ff6a4d";
}
function findEmptySlot(G, p) {
  let best = -1, bd = 1e9;
  for (let i = 0; i < G.slots.length; i++) {
    if (G.slots[i]) continue;
    const s = slotPos(i), d = Math.abs(s.x - p.x) + (slotRow(i) === 0 ? 30 : 0);
    if (d < bd) { bd = d; best = i; }
  }
  return bd <= PLAY.slotReach ? best : -1;
}
function findItemSlot(G, p) {
  let best = -1, bd = 1e9;
  for (let i = 0; i < G.slots.length; i++) {
    if (!G.slots[i]) continue;
    const s = slotPos(i), d = Math.abs(s.x - p.x) + (slotRow(i) === 0 ? 22 : 0);
    if (d < bd) { bd = d; best = i; }
  }
  return bd <= PLAY.slotReach ? best : -1;
}
function nearestWaitingGuest(G, p) {
  let best = null, bd = 1e9;
  for (const g of G.guests) {
    if (g.state !== "waiting") continue;
    const d = Math.hypot(g.x - p.x, g.y - p.y + 22);
    if (d < bd) { bd = d; best = g; }
  }
  return bd <= PLAY.guestReach ? best : null;
}
function addLog(G, z, by) {
  const zone = G.zones[z];
  if (!zone) return;
  if (zone.logs.length < 7) zone.logs.push({ ign: FIRE.ignite, seed: Math.random() * 100 });
  zone.flame = Math.min(1.55, zone.flame + FIRE.logFlame);
  if (zone.coal > 0.94) {
    zone.flame = Math.min(1.7, zone.flame + 0.12);
    pushEvent(G, "hint", zoneCenter(z), 330, "That zone is already roaring");
  }
  pushEvent(G, "toss", zoneCenter(z), 430, "", by);
}
function feedWood(G, p, zone) {
  const z = clamp(Number.isInteger(zone) ? zone : nearestZone(p.x), 0, BRAAI.zoneCount - 1);
  addLog(G, z, null);
  p.carry.n--;
  if (p.carry.n <= 0) p.carry = null;
  pushEvent(G, "wood", zoneCenter(z), 430, `${z + 1}`);
}

/* --------------------------------------------------------------- actions */
function targetSlotIndex(t) {
  return t && t.k === "s" && Number.isInteger(t.i) && t.i >= 0 && t.i < SLOT_COUNT ? t.i : -1;
}
function targetZoneIndex(t) {
  if (!t) return -1;
  if (t.k === "z" && Number.isInteger(t.z)) return clamp(t.z, 0, BRAAI.zoneCount - 1);
  const i = targetSlotIndex(t);
  return i >= 0 ? slotZone(i) : -1;
}
function canReachSlot(p, i) {
  return nearBraai(p) && Math.abs(slotPos(i).x - p.x) <= 185;
}
function canReachGuest(p, g) {
  return p.y < 808 && Math.abs(g.x - p.x) <= 245;
}
function canReachProp(p, prop, mult = 1.55) {
  return distTo(p, prop) < prop.r * mult;
}
function doUse(G, id, target) {
  const p = playerOf(G, id);
  if (!p || G.phase !== "playing" || p.actCd > 0) return;
  p.actCd = 0.09;
  const ts = targetSlotIndex(target);
  const tg = target && target.k === "g" ? G.guests.find((g) => g.id === target.i) : null;
  const tz = targetZoneIndex(target);

  // firewood pile
  if ((target && target.k === "w") || (!target && distTo(p, WOODPILE) < WOODPILE.r)) {
    if (canReachProp(p, WOODPILE)) {
      if (!p.carry) { p.carry = { k: "w", n: 1 }; pushEvent(G, "wood", p.x, p.y, "1"); return; }
      if (p.carry.k === "w") {
        if (p.carry.n < 3) { p.carry.n++; pushEvent(G, "wood", p.x, p.y, String(p.carry.n)); }
        else pushEvent(G, "hint", p.x, p.y, "Arms full of wood");
        return;
      }
    }
  }
  // bin
  if ((target && target.k === "b") || (!target && distTo(p, BIN) < BIN.r)) {
    if (canReachProp(p, BIN) && p.carry && p.carry.k === "m") {
      p.carry = null;
      pushEvent(G, "bin", BIN.x, BIN.y, "");
      return;
    }
  }
  // serve a guest
  const gm = tg && tg.state === "waiting" ? tg : (!target ? nearestWaitingGuest(G, p) : null);
  if (gm && p.carry && p.carry.k === "m") {
    if (!canReachGuest(p, gm)) { pushEvent(G, "hint", p.x, p.y, "Move closer to the guest"); return; }
    const cq = qualityOf({ a: p.carry.a, b: p.carry.b, ch: p.carry.ch, type: p.carry.t });
    if (gm.order === p.carry.t && cq !== "raw") { serveGuest(G, p, gm); return; }
    if (!(nearBraai(p) && cq === "raw")) {
      if (gm.order !== p.carry.t) pushEvent(G, "hint", p.x, p.y, `They asked for ${MEATS[gm.order].name}`);
      else pushEvent(G, "hint", p.x, p.y, "That's still raw — keep it on the fire");
      return;
    }
  }
  // a specific slot under the crosshair
  if (ts >= 0) {
    if (!canReachSlot(p, ts)) { pushEvent(G, "hint", p.x, p.y, "Move closer to the braai"); return; }
    if (p.carry && p.carry.k === "w") { feedWood(G, p, slotZone(ts)); return; }
    if (p.carry && p.carry.k === "m") {
      if (G.slots[ts]) { pushEvent(G, "hint", p.x, p.y, "That spot is taken"); return; }
      placeMeat(G, p, ts);
      return;
    }
    if (!p.carry) {
      if (G.slots[ts]) pickMeat(G, p, ts);
      else pushEvent(G, "hint", p.x, p.y, "Nothing there");
      return;
    }
  }
  // tossing a log at the fire
  if (p.carry && p.carry.k === "w" && nearBraai(p)) {
    feedWood(G, p, tz >= 0 ? tz : nearestZone(p.x));
    return;
  }
  // fallback when no aim target was supplied (older clients / safety)
  if (!target) {
    if (nearBraai(p)) {
      if (p.carry && p.carry.k === "m") {
        const slot = findEmptySlot(G, p);
        if (slot < 0) { pushEvent(G, "hint", p.x, p.y, "The braai is full"); return; }
        placeMeat(G, p, slot);
        return;
      }
      if (!p.carry) {
        const slot = findItemSlot(G, p);
        if (slot >= 0) pickMeat(G, p, slot);
        return;
      }
    }
  } else if (nearBraai(p)) {
    // aimed at empty air over the fire: let a wood toss still work
    if (p.carry && p.carry.k === "w") { feedWood(G, p, tz >= 0 ? tz : nearestZone(p.x)); return; }
  }
}
function doFlip(G, id, target) {
  const p = playerOf(G, id);
  if (!p || G.phase !== "playing" || p.actCd > 0) return;
  p.actCd = 0.07;
  if (!nearBraai(p)) { if (target) pushEvent(G, "hint", p.x, p.y, "Move closer to the braai"); return; }
  const ts = targetSlotIndex(target);
  const slot = ts >= 0 ? ts : findItemSlot(G, p);
  if (slot < 0 || !G.slots[slot] || !canReachSlot(p, slot)) return;
  const it = G.slots[slot];
  it.down ^= 1; it.flipT = 0.28;
  const s = slotPos(slot);
  pushEvent(G, "flip", s.x, s.y, "");
}
function doGrab(G, id, meatIdx) {
  const p = playerOf(G, id);
  if (!p || G.phase !== "playing") return;
  meatIdx = clamp(meatIdx | 0, 0, MEATS.length - 1);
  if (p.carry) { pushEvent(G, "hint", p.x, p.y, "Hands full"); return; }
  p.carry = { k: "m", t: meatIdx, a: 0, b: 0, ch: 0 };
  pushEvent(G, "grab", p.x, p.y, MEATS[meatIdx].name);
}
function placeMeat(G, p, slot) {
  const c = p.carry;
  G.slots[slot] = {
    type: c.t, a: c.a, b: c.b, ch: c.ch, down: c.a >= c.b ? 1 : 0,
    placeT: 0.32, flipT: 0, by: p.id,
  };
  p.carry = null;
  const s = slotPos(slot);
  pushEvent(G, "place", s.x, s.y, MEATS[c.t].name);
}
function pickMeat(G, p, slot) {
  const it = G.slots[slot];
  p.carry = { k: "m", t: it.type, a: it.a, b: it.b, ch: it.ch };
  G.slots[slot] = null;
  const s = slotPos(slot);
  pushEvent(G, "pick", s.x, s.y, qualityText(it));
}
function serveGuest(G, p, g) {
  const c = p.carry;
  const q = qualityOf({ a: c.a, b: c.b, ch: c.ch, type: c.t });
  p.carry = null;
  p.served++;
  G.served++;
  g.servedBy = p.id;
  g.state = q === "perfect" || q === "good" ? "happy" : "angry";
  g.rt = 2.15;
  p.emote = q === "perfect" ? "PERFECT!" : "";
  p.emoteT = q === "perfect" ? 1.3 : 0;
  let txt = "", kind = q;
  if (q === "perfect") {
    p.perfect++; G.perfect++;
    G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
    if (G.combo === 3 || G.combo === 5 || G.combo === 8 || G.combo === 12) pushEvent(G, "streak", g.x, g.y - 20, String(G.combo));
    const bonus = 100 + Math.min(8, G.combo) * 30;
    p.score += bonus; G.score += bonus;
    G.hype = clamp(G.hype + 6, 0, 100);
    g.reactText = pick(["Lekker!", "PERFECT!", "Dis die een!", "Chef's kiss.", "Best braai ever."]);
    txt = "PERFECT";
  } else if (q === "good") {
    p.score += 45; G.score += 45; G.combo = 0;
    G.hype = clamp(G.hype + 3, 0, 100);
    g.reactText = pick(["Good stuff.", "Ja, nice.", "That'll do.", "Dankie!"]);
    txt = "GOOD";
  } else {
    p.score += 5; G.score += 5; G.combo = 0;
    G.hype = clamp(G.hype - 4, 0, 100);
    g.reactText = q === "raw" ? pick(["Dis raw, boet.", "Still mooing.", "Eish… raw."])
      : q === "over" ? pick(["You cremated it.", "That's a hockey puck.", "Too long, champ."])
      : pick(["What is that?", "Absolutely not.", "My dog wouldn't eat this."]);
    txt = q === "raw" ? "RAW" : q === "over" ? "OVERCOOKED" : "RUINED";
  }
  g.order = c.t;
  pushEvent(G, kind === "perfect" ? "perfect" : kind === "good" ? "good" : kind, g.x, g.y - 20, txt);
  if (G.hype >= VIBE_GOAL) winGame(G);
}
function winGame(G) {
  if (G.phase !== "playing") return;
  G.phase = "won"; G.winT = 0; G.result = "win"; G.hype = 100;
  pushEvent(G, "win", VW / 2, 420, "");
}
function loseGame(G, why) {
  if (G.phase !== "playing") return;
  G.phase = "lost"; G.winT = 0; G.result = why || "time";
  pushEvent(G, "lose", VW / 2, 420, why || "time");
}
function checkEnd(G) {
  if (G.phase !== "playing") return;
  if (G.hype >= VIBE_GOAL) winGame(G);
  else if (G.hype <= 0) loseGame(G, "vibe");
  else if (G.timeLeft <= 0) loseGame(G, "time");
}

/* -------------------------------------------------------------- host sim */
function updatePlayers(G, dt, localId, localInput, netInputs) {
  const now = performance.now();
  for (const p of G.players) {
    let inp = null;
    if (p.id === localId) inp = localInput;
    else if (netInputs) {
      const n = netInputs[p.id];
      if (n && now - n.at < 420) inp = n;
    }
    let fwd = inp ? finite(inp.fwd, finite(inp.dy)) : 0;
    let strafe = inp ? finite(inp.strafe, finite(inp.dx)) : 0;
    let len = Math.hypot(fwd, strafe);
    if (len > 1) { fwd /= len; strafe /= len; len = 1; }
    const yaw = inp && Number.isFinite(inp.yaw) ? inp.yaw : (p.yaw || 0);
    p.yaw = yaw;
    p.pitch = inp && Number.isFinite(inp.pitch) ? inp.pitch : (p.pitch || 0);
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let wx = fx * fwd + rx * strafe;
    let wz = fz * fwd + rz * strafe;
    const wl = Math.hypot(wx, wz);
    if (wl > 1) { wx /= wl; wz /= wl; }
    const sprinting = !!(inp && inp.sprint) && len > 0.08;
    p.sprinting = sprinting;
    const spd = PLAY.speed * (sprinting ? 1.38 : 1);
    if (len > 0.08) {
      p.x = clamp(p.x + wx * spd * dt, PLAY.minX, PLAY.maxX);
      p.y = clamp(p.y + wz * spd * dt, PLAY.minY, PLAY.maxY);
      p.walk = (p.walk || 0) + len * dt * (sprinting ? 12.5 : 9.5);
      p.moving = true;
      if (Math.abs(strafe) > 0.1) p.dir = strafe > 0 ? 1 : -1;
    } else {
      p.moving = false;
    }
    p.emoteT = Math.max(0, (p.emoteT || 0) - dt);
    p.joinT = Math.max(0, (p.joinT || 0) - dt);
    p.actCd = Math.max(0, (p.actCd || 0) - dt);
    const wantSpray = !!(inp && inp.spray) && p.water > 0.015;
    p.spraying = wantSpray;
    p.sz = inp && Number.isInteger(inp.sz) ? clamp(inp.sz, 0, BRAAI.zoneCount - 1) : nearestZone(p.x);
    if (wantSpray) {
      p.water = Math.max(0, p.water - FIRE.waterDrain * dt);
      const z = G.zones[p.sz];
      z.flame = Math.max(0, z.flame - FIRE.sprayFlame * dt);
      z.coal = Math.max(0, z.coal - FIRE.sprayCoal * dt);
      z.wet = Math.min(1, z.wet + dt * 1.4);
    } else {
      p.water = Math.min(1, p.water + FIRE.waterRegen * dt);
    }
  }
}
function updateFire(G, dt, visualOnly) {
  let allDead = true;
  for (const z of G.zones) {
    z.coal = clamp(z.coal - FIRE.decay * dt, 0, 1.15);
    z.flame = clamp(z.flame - FIRE.flameDecay * dt, 0, 1.8);
    z.wet = Math.max(0, z.wet - dt * 0.16);
    z.flareCd -= dt;
    for (let i = z.logs.length - 1; i >= 0; i--) {
      z.logs[i].ign -= dt;
      if (z.logs[i].ign <= 0) {
        z.coal = Math.min(1.15, z.coal + FIRE.logCoal);
        z.flame = Math.min(1.8, z.flame + 0.10);
        z.logs.splice(i, 1);
      }
    }
    if (z.flame > FIRE.flare && z.flareCd <= 0) {
      z.flareCd = FIRE.flareCd;
      z.coal = Math.max(0, z.coal - 0.018);
      if (!visualOnly) {
        G.hype = clamp(G.hype - 2.5, 0, 100);
        G.combo = 0;
        for (let i = 0; i < SLOT_COUNT; i++) {
          if (slotZone(i) !== G.zones.indexOf(z) || !G.slots[i]) continue;
          G.slots[i].ch = Math.min(1, G.slots[i].ch + 0.1);
        }
        pushEvent(G, "flare", zoneCenter(G.zones.indexOf(z)), 390, "");
      }
    }
    if (z.coal > 0.13) allDead = false;
  }
  if (visualOnly || G.phase !== "playing") return;
  if (allDead) {
    G.fireDeadT += dt;
    G.hype = clamp(G.hype - 0.55 * dt, 0, 100);
    if (G.fireDeadT > 5 && G.fireWarnT <= 0) {
      G.fireWarnT = 9;
      pushEvent(G, "hint", VW / 2, 360, "The fire is dying — add wood!");
    }
  } else {
    G.fireDeadT = 0;
  }
  G.fireWarnT -= dt;
}
function updateSlots(G, dt) {
  for (let i = 0; i < SLOT_COUNT; i++) {
    const it = G.slots[i];
    if (!it) continue;
    const z = G.zones[slotZone(i)];
    const h = zoneHeat(z);
    const d = MEATS[it.type];
    const rate = d.rate * h;
    if (it.down === 0) it.a = Math.min(2.2, it.a + rate * dt);
    else it.b = Math.min(2.2, it.b + rate * dt);
    const side = it.down === 0 ? it.a : it.b;
    if (side > 0.60) it.ch = Math.min(1, it.ch + (side - 0.60) * rate * 0.95 * dt);
    if (it.a + it.b > 1.65) it.ch = Math.min(1, it.ch + 0.022 * dt);
    it.placeT = Math.max(0, (it.placeT || 0) - dt);
    it.flipT = Math.max(0, (it.flipT || 0) - dt);
  }
}
function updateGuests(G, dt) {
  for (let i = G.guests.length - 1; i >= 0; i--) {
    const g = G.guests[i];
    g.walk = (g.walk || 0) + dt * 2.4;
    if (g.state === "walkin") {
      const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy);
      if (d < 5) { g.state = "waiting"; g.x = g.tx; g.y = g.ty; }
      else { const sp = Math.min(d, 92 * dt); g.x += dx / d * sp; g.y += dy / d * sp; }
    } else if (g.state === "waiting") {
      g.patience -= dt;
      if (g.patience <= 0) {
        g.state = "angry"; g.rt = 2.0; g.reactText = pick(["I'm out.", "Unbelievable.", "I'll get a hot dog.", "Nee, man."]);
        G.hype = clamp(G.hype - 6, 0, 100); G.combo = 0;
        pushEvent(G, "guestleave", g.x, g.y - 20, "left hungry");
      }
    } else if (g.state === "happy" || g.state === "angry") {
      g.rt -= dt;
      if (g.rt <= 0) {
        g.state = "leaving";
        g.tx = g.x < VW / 2 ? -120 : VW + 120;
        g.ty = 968;
      }
    } else if (g.state === "leaving") {
      const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy) || 1;
      const sp = 150 * dt;
      g.x += dx / d * sp; g.y += dy / d * sp;
      if (g.y > 955 || g.x < -110 || g.x > VW + 110) G.guests.splice(i, 1);
    }
  }
  if (G.phase !== "playing") return;
  const active = G.guests.filter((g) => g.state !== "leaving").length;
  const maxGuests = Math.min(7, 3 + Math.min(3, G.players.length - 1));
  G.spawnT -= dt;
  if (active < maxGuests && G.spawnT <= 0) {
    spawnGuest(G);
    G.spawnT = Math.max(3.1, 9.4 - G.players.length * 0.82);
  }
}
function updateTimers(G, dt) {
  if (G.phase !== "playing") return;
  G.timeLeft = Math.max(0, G.timeLeft - dt);
  checkEnd(G);
}
function hostUpdate(G, dt, localId, localInput, netInputs) {
  G.seq++;
  if (G.phase === "playing") {
    updatePlayers(G, dt, localId, localInput, netInputs);
    updateFire(G, dt, false);
    updateSlots(G, dt);
    updateGuests(G, dt);
    updateTimers(G, dt);
    if (G.phase !== "playing") G.winT = 0;
  } else {
    G.winT += dt;
    updatePlayers(G, dt, localId, localInput, netInputs);
    updateFire(G, dt, true);
  }
}
function resetGame(G, players, demo = false) {
  const ng = newState("playing");
  ng.seq = (G && G.seq) || 0;
  ng.guestId = (G.guestId || 1) + 20;
  ng.players = players.map((p, i) => {
    const np = makePlayer(p.id, p.name, p.color, 0, 0);
    np.score = 0; np.served = 0; np.perfect = 0;
    const n = players.length;
    np.x = VW / 2 + (i - (n - 1) / 2) * 112;
    np.y = 850 + (i % 2) * 20;
    np.walk = Math.random() * 7;
    return np;
  });
  seedGuests(ng);
  ng.spawnT = 7;
  ng.demo = demo;
  return ng;
}
/* ============================================================================
   FIRST-PERSON 3D WORLD
   The simulation is still the same x/depth model; this layer maps it to a
   long braai on a party deck and renders it through a first-person camera.
   ========================================================================== */
const THREE = window.THREE || null;

const CAM = { eye: 1.66, fov: 72, near: 0.045, far: 120, sens: 0.00215, touchSens: 0.0034 };
const WORLD = {
  slotY: 1.115, grillY: 1.03, bedY: 0.9,
  rowZ: [-1.88, -1.27],
  braaiX0: -6.86, braaiX1: 6.86, braaiZ0: -2.48, braaiZ1: -0.6,
  guestZ: -3.06,
};
let renderer = null, scene = null, camera = null;
let threeReady = false;
let pointerLocked = false, pointerLockFailed = false;
let viewYaw = 0, viewPitch = -0.2;
let dragLook = false, dragX = 0, dragY = 0;
let lookTarget = null;
let shake3D = 0;
let menuCamT = 0;
let winCamStart = null;
let winCamStarted = false;
let lookOverlayShown = false;
let lastFootstep = 0;

const raycaster = THREE ? new THREE.Raycaster() : null;
const centerNDC = THREE ? new THREE.Vector2(0, 0) : null;
const targetMeshes = [];
const slotHitboxes = [];
const propHitboxes = {};
const guestHitboxes = new Map();
const _v3 = THREE ? new THREE.Vector3() : null;
const _v3b = THREE ? new THREE.Vector3() : null;
const _q = THREE ? new THREE.Quaternion() : null;
const _camDir = THREE ? new THREE.Vector3() : null;
const _plane = THREE ? new THREE.Plane(new THREE.Vector3(0, 1, 0), -(WORLD.bedY + 0.06)) : null;

const W3 = {
  slots: new Array(SLOT_COUNT).fill(null),
  players: new Map(),
  guests: new Map(),
  fire: [],
  strings: [],
  crowd: [],
  jenn: null,
  hands: null,
  handCarry: null,
  handCarryType: null,
  flameSprites: [],
  logMeshes: [],
  coalMeshes: [],
  fireLights: [],
  jennLight: null,
  marker: null,
  menuTarget: null,
};

function wx(x) { return (x - 770) * 0.01; }
function wzPlayer(y) { return 0.35 + (y - 648) * 0.01; }
function wzGuest(y) { return WORLD.guestZ - (clamp(y, 694, 812) - 694) * 0.0032; }
function slotWorldPos(i) {
  const s = slotPos(i);
  return new THREE.Vector3(wx(s.x), WORLD.slotY, WORLD.rowZ[slotRow(i)]);
}
function zoneWorldX(z) { return wx(zoneCenter(z)); }
function playerWorldPos(p) { return new THREE.Vector3(wx(p.x), 0, wzPlayer(p.y)); }
function guestWorldPos(g) {
  const targetZ = wzGuest(g.y);
  if (g.state === "walkin") {
    const total = Math.max(1, Math.abs(946 - (g.ty || 730)));
    const prog = clamp((946 - g.y) / total, 0, 1);
    return new THREE.Vector3(wx(g.x), 0, lerp(-6.4, targetZ, smooth(prog)));
  }
  return new THREE.Vector3(wx(g.x), 0, targetZ);
}
function jennWorldPos() { return new THREE.Vector3(wx(JEN.x), 0, WORLD.guestZ - 0.18); }

/* --------------------------------------------------------------- textures */
function makeTex(w, h, draw, rx = 1, ry = 1, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  if (renderer) t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function texBrick() {
  return makeTex(512, 256, (g, w, h) => {
    g.fillStyle = "#241711"; g.fillRect(0, 0, w, h);
    const R = rng(771);
    for (let y = 0; y < h; y += 32) {
      const off = (y / 32) % 2 ? 32 : 0;
      for (let x = -off; x < w; x += 64) {
        const v = R();
        g.fillStyle = `rgb(${58 + v * 42 | 0},${35 + v * 25 | 0},${24 + v * 18 | 0})`;
        rr(g, x + 2, y + 2, 60, 28, 3); g.fill();
        g.fillStyle = "rgba(255,190,125,.045)"; g.fillRect(x + 4, y + 4, 56, 2);
        g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x + 4, y + 26, 56, 2);
      }
    }
    const R2 = rng(998);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${0.02 + R2() * 0.07})`;
      g.fillRect(R2() * w, R2() * h, 1 + R2() * 3, 1 + R2() * 2);
    }
  }, 5.6, 1);
}
function texStone() {
  return makeTex(512, 512, (g, w, h) => {
    g.fillStyle = "#2a201a"; g.fillRect(0, 0, w, h);
    const R = rng(441);
    for (let y = 0; y < h; y += 64) {
      const off = (y / 64) % 2 ? 42 : 0;
      for (let x = -off; x < w; x += 84) {
        const v = R();
        g.fillStyle = `rgb(${65 + v * 40 | 0},${50 + v * 30 | 0},${39 + v * 23 | 0})`;
        g.beginPath();
        g.moveTo(x + 6 + R() * 6, y + 6);
        g.lineTo(x + 78, y + 4 + R() * 6);
        g.lineTo(x + 80, y + 56 - R() * 5);
        g.lineTo(x + 4, y + 60 - R() * 6);
        g.closePath(); g.fill();
        g.strokeStyle = "rgba(10,7,5,.35)"; g.lineWidth = 3; g.stroke();
        g.fillStyle = "rgba(255,210,160,.05)"; g.fillRect(x + 9, y + 8, 62, 3);
      }
    }
    const R2 = rng(171);
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = `rgba(255,220,180,${0.01 + R2() * 0.035})`;
      g.fillRect(R2() * w, R2() * h, 1 + R2() * 2, 1 + R2() * 2);
    }
  }, 4, 2);
}
function texDeck() {
  return makeTex(512, 512, (g, w, h) => {
    g.fillStyle = "#2a1a12"; g.fillRect(0, 0, w, h);
    const R = rng(2291);
    for (let y = 0; y < h; y += 64) {
      const v = R();
      const gr = g.createLinearGradient(0, y, 0, y + 64);
      gr.addColorStop(0, `rgb(${66 + v * 24 | 0},${39 + v * 17 | 0},${23 + v * 13 | 0})`);
      gr.addColorStop(0.5, `rgb(${49 + v * 20 | 0},${29 + v * 13 | 0},${18 + v * 10 | 0})`);
      gr.addColorStop(1, `rgb(${36 + v * 16 | 0},${22 + v * 10 | 0},${14 + v * 8 | 0})`);
      g.fillStyle = gr; g.fillRect(0, y + 2, w, 60);
      g.fillStyle = "rgba(8,5,4,.7)"; g.fillRect(0, y, w, 3);
      for (let i = 0; i < 4; i++) {
        g.strokeStyle = `rgba(255,200,140,${0.02 + R() * 0.03})`; g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x <= w; x += 64) g.lineTo(x, y + 8 + i * 13 + Math.sin(x * 0.02 + i) * 2);
        g.stroke();
      }
      for (let x = 0; x < w; x += 170) {
        g.fillStyle = "rgba(8,5,4,.45)"; g.fillRect(x + R() * 30, y + 4, 2, 58);
      }
    }
  }, 5, 4);
}
function texPatio() {
  return makeTex(512, 512, (g, w, h) => {
    g.fillStyle = "#211a16"; g.fillRect(0, 0, w, h);
    const R = rng(1211);
    for (let y = 0; y < h; y += 128) {
      const off = (y / 128) % 2 ? 64 : 0;
      for (let x = -off; x < w; x += 128) {
        const v = R();
        g.fillStyle = `rgb(${54 + v * 30 | 0},${45 + v * 24 | 0},${38 + v * 20 | 0})`;
        rr(g, x + 4, y + 4, 120, 120, 8); g.fill();
        g.strokeStyle = "rgba(8,6,5,.5)"; g.lineWidth = 4; rr(g, x + 4, y + 4, 120, 120, 8); g.stroke();
        g.fillStyle = "rgba(255,210,160,.035)"; g.fillRect(x + 12, y + 12, 104, 4);
      }
    }
  }, 7, 4);
}
function texGrass() {
  return makeTex(512, 512, (g, w, h) => {
    g.fillStyle = "#152115"; g.fillRect(0, 0, w, h);
    const R = rng(881);
    for (let i = 0; i < 4200; i++) {
      const x = R() * w, y = R() * h;
      g.strokeStyle = `rgba(${38 + R() * 40 | 0},${62 + R() * 46 | 0},${30 + R() * 26 | 0},${0.25 + R() * 0.5})`;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y - 3 - R() * 5); g.stroke();
    }
  }, 24, 24);
}
function texCharcoal() {
  return makeTex(256, 256, (g, w, h) => {
    g.fillStyle = "#080605"; g.fillRect(0, 0, w, h);
    const R = rng(6612);
    for (let i = 0; i < 900; i++) {
      const v = R();
      g.fillStyle = `rgba(${34 + v * 50 | 0},${31 + v * 42 | 0},${29 + v * 34 | 0},${0.25 + v * 0.5})`;
      ellipse(g, R() * w, R() * h, 1 + R() * 5, 1 + R() * 4); g.fill();
    }
    for (let i = 0; i < 140; i++) {
      g.fillStyle = `rgba(255,110,35,${0.05 + R() * 0.16})`;
      ellipse(g, R() * w, R() * h, 1 + R() * 3, 1 + R() * 2); g.fill();
    }
  }, 4, 1);
}
function texRug() {
  return makeTex(512, 256, (g, w, h) => {
    g.fillStyle = "#3a1828"; g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "#71324d"); gr.addColorStop(0.6, "#4d2136"); gr.addColorStop(1, "#2a1120");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,190,130,.28)"; g.lineWidth = 3;
    for (let i = 1; i < 6; i++) { ellipse(g, w / 2, h / 2, i * 38, i * 18); g.stroke(); }
    g.strokeStyle = "rgba(255,190,130,.16)"; g.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU;
      line(g, w / 2 + Math.cos(a) * 58, h / 2 + Math.sin(a) * 28, w / 2 + Math.cos(a) * 230, h / 2 + Math.sin(a) * 112);
    }
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(255,220,180,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  }, 1, 1);
}
function texFlame() {
  const t = makeTex(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter";
    const gr = g.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, "rgba(255,90,15,.85)");
    gr.addColorStop(0.3, "rgba(255,140,30,.75)");
    gr.addColorStop(0.68, "rgba(255,215,90,.55)");
    gr.addColorStop(1, "rgba(255,250,190,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.04);
    g.bezierCurveTo(w * 0.94, h * 0.38, w * 0.92, h * 0.76, w * 0.5, h * 0.98);
    g.bezierCurveTo(w * 0.08, h * 0.76, w * 0.06, h * 0.4, w * 0.5, h * 0.04);
    g.fill();
    const gr2 = g.createLinearGradient(0, h, 0, h * 0.22);
    gr2.addColorStop(0, "rgba(255,250,220,.9)");
    gr2.addColorStop(0.55, "rgba(255,220,120,.5)");
    gr2.addColorStop(1, "rgba(255,180,60,0)");
    g.fillStyle = gr2;
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.2);
    g.bezierCurveTo(w * 0.76, h * 0.48, w * 0.74, h * 0.76, w * 0.5, h * 0.94);
    g.bezierCurveTo(w * 0.26, h * 0.76, w * 0.24, h * 0.5, w * 0.5, h * 0.2);
    g.fill();
  }, 1, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
function texSoft(inner, outer) {
  const t = makeTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    gr.addColorStop(0, inner); gr.addColorStop(0.45, outer); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 1, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
function texSign(text, bg = "#3a2619", fg = "#ffe1b0", sub = "") {
  const t = makeTex(512, 192, (g, w, h) => {
    g.fillStyle = bg; rr(g, 0, 0, w, h, 22); g.fill();
    g.strokeStyle = "rgba(255,220,170,.35)"; g.lineWidth = 6; rr(g, 8, 8, w - 16, h - 16, 17); g.stroke();
    g.textAlign = "center"; g.fillStyle = fg;
    g.font = '400 82px "Alfa Slab One", Impact, serif';
    g.fillText(text, w / 2, sub ? 112 : 124);
    if (sub) { g.font = "700 28px Outfit, sans-serif"; g.fillStyle = "rgba(255,235,205,.6)"; g.fillText(sub, w / 2, 160); }
  }, 1, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
function texSky() {
  return makeTex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#040614");
    gr.addColorStop(0.38, "#0e0a22");
    gr.addColorStop(0.68, "#2b1730");
    gr.addColorStop(0.86, "#5c2e2d");
    gr.addColorStop(1, "#251412");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const R = rng(77123);
    for (let i = 0; i < 500; i++) {
      const x = R() * w, y = R() * h * 0.72, s = R() < 0.93 ? 0.5 + R() * 1.1 : 1.6 + R() * 1.2;
      g.globalAlpha = 0.18 + R() * 0.72;
      g.fillStyle = R() < 0.18 ? "#ffd6a0" : "#d8e5ff";
      ellipse(g, x, y, s, s); g.fill();
    }
    g.globalAlpha = 0.08;
    for (let i = 0; i < 60; i++) {
      const x = R() * w, y = R() * h * 0.6;
      g.fillStyle = "#a7b9ff"; ellipse(g, x, y, 10 + R() * 30, 2 + R() * 8); g.fill();
    }
    g.globalAlpha = 1;
  }, 1, 1);
}
function texMoon() {
  const t = makeTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "rgba(255,245,210,1)"); gr.addColorStop(0.45, "rgba(245,232,195,1)");
    gr.addColorStop(0.62, "rgba(245,225,180,.5)"); gr.addColorStop(1, "rgba(245,225,180,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(170,155,125,.22)";
    ellipse(g, 108, 108, 18, 13); g.fill();
    ellipse(g, 145, 142, 13, 16); g.fill();
    ellipse(g, 150, 95, 8, 7); g.fill();
  }, 1, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
function texGlow() { return texSoft("rgba(255,230,170,.95)", "rgba(255,150,60,.32)"); }
function texSmoke() { return texSoft("rgba(110,104,105,.52)", "rgba(70,66,70,.22)"); }
function texSpark() { return texSoft("rgba(255,250,220,1)", "rgba(255,170,60,.35)"); }
function texSteam() { return texSoft("rgba(240,252,255,.55)", "rgba(200,225,235,.16)"); }

let TEX = null;
function buildTextures() {
  TEX = {
    brick: texBrick(), stone: texStone(), deck: texDeck(), patio: texPatio(), grass: texGrass(),
    charcoal: texCharcoal(), rug: texRug(), flame: texFlame(), glow: texGlow(), smoke: texSmoke(),
    spark: texSpark(), steam: texSteam(), sky: texSky(), moon: texMoon(),
    woodSign: texSign("WOOD", "#3b2617", "#ffdca6", "FIREWOOD"),
    binSign: texSign("BIN", "#263034", "#d9e8ea", "ASH + SCRAPS"),
    coolerSign: texSign("BRAAI", "#1e5b7d", "#f4fbff", "COLD DRINKS"),
    braaiSign: texSign("BRAAI MASTER", "#2b1a12", "#ffcf86", "JENNIFER'S PARTY"),
  };
}

/* --------------------------------------------------------------- scene */
function init3D() {
  if (!THREE) return false;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
  } catch (e) { return false; }
  renderer.setPixelRatio(Math.min(1.8, window.devicePixelRatio || 1));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06040d);
  scene.fog = new THREE.FogExp2(0x0b0710, 0.021);
  camera = new THREE.PerspectiveCamera(CAM.fov, 1, CAM.near, CAM.far);
  camera.rotation.order = "YXZ";
  camera.position.set(0, CAM.eye, 1.5);
  scene.add(camera);
  buildTextures();
  initSharedGeo();
  buildLighting();
  buildSky();
  buildGround();
  buildBraai();
  buildProps();
  W3.jenn = makeJennifer3D();
  W3.jenn.position.copy(jennWorldPos());
  scene.add(W3.jenn);
  buildStringLights();
  buildCrowdBackground();
  buildFire();
  buildParticles();
  buildHands();
  resize3D();
  threeReady = true;
  return true;
}

function buildLighting() {
  scene.add(new THREE.HemisphereLight(0x849ac8, 0x24130b, 0.72));
  const moon = new THREE.DirectionalLight(0xc4d8ff, 0.54);
  moon.position.set(-8, 16, -7);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -13; moon.shadow.camera.right = 13;
  moon.shadow.camera.top = 10; moon.shadow.camera.bottom = -9;
  moon.shadow.camera.near = 1; moon.shadow.camera.far = 38;
  moon.shadow.bias = -0.0006;
  moon.shadow.normalBias = 0.02;
  scene.add(moon);
  const fill = new THREE.PointLight(0xffa060, 0.45, 14, 2);
  fill.position.set(0, 2.4, -1.6);
  scene.add(fill);
  W3.jennLight = new THREE.SpotLight(0xffb8cf, 0.8, 10, 0.55, 0.8, 1.6);
  W3.jennLight.position.set(wx(JEN.x) + 0.7, 4.2, WORLD.guestZ + 0.2);
  W3.jennLight.target.position.copy(jennWorldPos());
  scene.add(W3.jennLight);
  scene.add(W3.jennLight.target);
}

function buildSky() {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(62, 32, 20),
    new THREE.MeshBasicMaterial({ map: TEX.sky, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  scene.add(sky);
  const moonMat = new THREE.SpriteMaterial({ map: TEX.moon, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
  const moon = new THREE.Sprite(moonMat);
  moon.position.set(18, 19, -38); moon.scale.set(5.2, 5.2, 1);
  scene.add(moon);
  const glowMat = new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0.3 });
  const glow = new THREE.Sprite(glowMat);
  glow.position.copy(moon.position); glow.scale.set(11, 11, 1);
  scene.add(glow);

  // house silhouette behind the left guests
  const house = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: 0x0d0c14, roughness: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 5), wall);
  body.position.y = 2; house.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), wall);
  roof.position.y = 5; roof.rotation.y = Math.PI / 4; house.add(roof);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), wall);
  chimney.position.set(2.2, 5.8, 0); house.add(chimney);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffb35a, transparent: true, opacity: 0.6 });
  for (const [x, y] of [[-2.2, 2.6], [0, 2.6], [2.2, 2.6], [-1, 1.2]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), winMat);
    w.position.set(x, y, 2.51); house.add(w);
  }
  house.position.set(-11.5, 0, -13);
  scene.add(house);
  // trees
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x0a1110, roughness: 1 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x120b07, roughness: 1 });
  for (const [x, z, s] of [[11.5, -11, 1.25], [14, -14, 1.6], [-15, -10, 1.1], [13, -7.5, 0.8]]) {
    const tr = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 4.5, 6), trunkMat);
    trunk.position.y = 2.25; tr.add(trunk);
    for (const [cx, cy, cz, r] of [[0, 4.8, 0, 2.2], [-1.4, 4.2, 0.4, 1.5], [1.5, 4.4, -0.3, 1.6], [0.2, 5.8, 0.5, 1.4]]) {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), treeMat);
      blob.position.set(cx, cy, cz); tr.add(blob);
    }
    tr.position.set(x, 0, z); tr.scale.setScalar(s);
    scene.add(tr);
  }
}

function buildGround() {
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.045; grass.receiveShadow = true;
  scene.add(grass);
  const patio = new THREE.Mesh(new THREE.PlaneGeometry(25, 12), new THREE.MeshStandardMaterial({ map: TEX.patio, roughness: 0.96 }));
  patio.rotation.x = -Math.PI / 2; patio.position.set(0, 0.005, -2.2); patio.receiveShadow = true;
  scene.add(patio);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(24, 8.5), new THREE.MeshStandardMaterial({ map: TEX.deck, roughness: 0.88 }));
  deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0.012, 2.8); deck.receiveShadow = true;
  scene.add(deck);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(24, 0.09, 0.22), new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 }));
  edge.position.set(0, 0.04, -1.45); edge.receiveShadow = true; scene.add(edge);
  // warm glow decal under the braai
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), new THREE.MeshBasicMaterial({
    map: TEX.glow, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xff7028,
  }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.03, -1.1);
  scene.add(glow);
}

/* --------------------------------------------------------------- braai */
function buildBraai() {
  const g = new THREE.Group();
  const brickMat = new THREE.MeshStandardMaterial({ map: TEX.brick, roughness: 0.94 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 1 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: TEX.stone, roughness: 0.95 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8d9296, metalness: 0.92, roughness: 0.32 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4b3120, roughness: 0.85 });
  const L = WORLD.braaiX1 - WORLD.braaiX0, D = WORLD.braaiZ1 - WORLD.braaiZ0;
  const cx = (WORLD.braaiX0 + WORLD.braaiX1) / 2, cz = (WORLD.braaiZ0 + WORLD.braaiZ1) / 2;
  // brick body
  const base = new THREE.Mesh(new THREE.BoxGeometry(L, 0.98, Math.abs(D)), [brickMat, brickMat, darkMat, darkMat, brickMat, brickMat]);
  base.position.set(cx, 0.49, cz); base.castShadow = true; base.receiveShadow = true; g.add(base);
  // stone rim
  const rimH = 0.11, rimW = 0.24;
  const rimFront = new THREE.Mesh(new THREE.BoxGeometry(L + 0.32, rimH, rimW), stoneMat);
  rimFront.position.set(cx, 1.045, WORLD.braaiZ1 - rimW / 2 + 0.02); rimFront.castShadow = true; g.add(rimFront);
  const rimBack = rimFront.clone(); rimBack.position.z = WORLD.braaiZ0 + rimW / 2 - 0.02; g.add(rimBack);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(rimW, rimH, Math.abs(D)), stoneMat);
    side.position.set(cx + sx * (L / 2 - rimW / 2 + 0.16), 1.045, cz); side.castShadow = true; g.add(side);
  }
  // charcoal bed
  const bed = new THREE.Mesh(new THREE.BoxGeometry(L - 0.45, 0.06, Math.abs(D) - 0.42), new THREE.MeshStandardMaterial({ map: TEX.charcoal, roughness: 1 }));
  bed.position.set(cx, WORLD.bedY, cz); bed.receiveShadow = true; g.add(bed);
  // side caps
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.16, Math.abs(D) + 0.3), stoneMat);
    cap.position.set(cx + sx * (L / 2 + 0.18), 0.58, cz); cap.castShadow = true; cap.receiveShadow = true; g.add(cap);
    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, Math.abs(D) + 0.38), stoneMat);
    capTop.position.set(cx + sx * (L / 2 + 0.18), 1.19, cz); g.add(capTop);
  }
  // front shelf and rail
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(L - 0.2, 0.13, 0.2), woodMat);
  shelf.position.set(cx, 0.73, WORLD.braaiZ1 + 0.05); shelf.castShadow = true; g.add(shelf);
  for (let i = 0; i < 7; i++) {
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.12), metalMat);
    br.position.set(WORLD.braaiX0 + 0.55 + i * (L - 1.1) / 8, 0.64, WORLD.braaiZ1 + 0.06); g.add(br);
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, L - 0.5, 6), metalMat);
  rail.rotation.z = Math.PI / 2; rail.position.set(cx, 0.63, WORLD.braaiZ1 + 0.13); g.add(rail);
  // sign on the front face
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.45), new THREE.MeshBasicMaterial({ map: TEX.braaiSign, transparent: true }));
  sign.position.set(cx, 0.32, WORLD.braaiZ1 + 0.012); g.add(sign);
  // grate bars
  const barY = WORLD.grillY;
  for (let i = 0; i < 6; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(L - 0.3, 0.045, 0.045), metalMat);
    bar.position.set(cx, barY, WORLD.braaiZ1 - 0.08 - i * (Math.abs(D) - 0.2) / 5);
    bar.castShadow = true; g.add(bar);
  }
  for (let i = 0; i < 7; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, Math.abs(D) - 0.22), metalMat);
    bar.position.set(WORLD.braaiX0 + 0.28 + i * (L - 0.56) / 6, barY + 0.018, cz);
    bar.castShadow = true; g.add(bar);
  }
  // rivets
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const rv = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), metalMat);
      rv.position.set(cx + sx * (L / 2 - 0.2), barY + 0.03, WORLD.braaiZ1 - 0.15 - i * 0.5); g.add(rv);
    }
  }
  scene.add(g);
  // slot hitboxes
  for (let i = 0; i < SLOT_COUNT; i++) {
    const p = slotWorldPos(i);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.36, 0.56), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.copy(p); hb.visible = false; hb.userData = { kind: "s", i };
    scene.add(hb); targetMeshes.push(hb); slotHitboxes[i] = hb;
  }
}

/* --------------------------------------------------------------- props */
function addSignPlane(parent, tex, w, h, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}
function buildProps() {
  // woodpile
  const wood = new THREE.Group();
  const logMat = new THREE.MeshStandardMaterial({ color: 0x6c4527, roughness: 0.95 });
  const logEnd = new THREE.MeshStandardMaterial({ color: 0xc49a67, roughness: 0.9 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.35, 1.05), new THREE.MeshStandardMaterial({ color: 0x2b1b12, roughness: 0.95 }));
  crate.position.y = 0.17; crate.castShadow = true; crate.receiveShadow = true; wood.add(crate);
  const R = rng(661);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4 - row; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.96, 8), logMat);
      log.rotation.z = Math.PI / 2;
      log.position.set(-0.52 + i * 0.35 + row * 0.17 + (R() - 0.5) * 0.05, 0.42 + row * 0.21, (R() - 0.5) * 0.22);
      log.rotation.x = (R() - 0.5) * 0.12; log.castShadow = true; log.receiveShadow = true; wood.add(log);
      for (const s of [-1, 1]) {
        const end = new THREE.Mesh(new THREE.CircleGeometry(0.112, 10), logEnd);
        end.position.set(log.position.x + s * 0.481, log.position.y, log.position.z);
        end.rotation.y = s * Math.PI / 2; wood.add(end);
      }
    }
  }
  wood.position.set(wx(WOODPILE.x), 0, wzPlayer(WOODPILE.y));
  wood.rotation.y = 0.14;
  scene.add(wood);
  addSignPlane(scene, TEX.woodSign, 1.15, 0.43, wood.position.x, 1.72, wood.position.z + 0.02);
  const wb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 1.25), new THREE.MeshBasicMaterial({ visible: false }));
  wb.position.set(wood.position.x, 0.58, wood.position.z); wb.visible = false; wb.userData = { kind: "w" };
  scene.add(wb); targetMeshes.push(wb); propHitboxes.wood = wb;

  // bin
  const bin = new THREE.Group();
  const binMat = new THREE.MeshStandardMaterial({ color: 0x41484d, metalness: 0.55, roughness: 0.55 });
  const binBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.78, 12), binMat);
  binBody.position.y = 0.39; binBody.castShadow = true; binBody.receiveShadow = true; bin.add(binBody);
  const binLid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x22282c, metalness: 0.6, roughness: 0.4 }));
  binLid.position.y = 0.81; binLid.castShadow = true; bin.add(binLid);
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.05), binMat); knob.position.set(0, 0.87, 0); bin.add(knob);
  bin.position.set(wx(BIN.x), 0, wzPlayer(BIN.y));
  scene.add(bin);
  addSignPlane(scene, TEX.binSign, 0.56, 0.21, bin.position.x, 0.5, bin.position.z + 0.31);
  const bb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.95, 0.8), new THREE.MeshBasicMaterial({ visible: false }));
  bb.position.set(bin.position.x, 0.48, bin.position.z); bb.visible = false; bb.userData = { kind: "b" };
  scene.add(bb); targetMeshes.push(bb); propHitboxes.bin = bb;

  // cooler
  const cooler = new THREE.Group();
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.52, 0.7), new THREE.MeshStandardMaterial({ color: 0x2a7cab, roughness: 0.55 }));
  cBody.position.y = 0.3; cBody.castShadow = true; cBody.receiveShadow = true; cooler.add(cBody);
  const cLid = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.1, 0.76), new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.55 }));
  cLid.position.y = 0.6; cLid.castShadow = true; cooler.add(cLid);
  const cHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.62), new THREE.MeshStandardMaterial({ color: 0x174e6b, roughness: 0.6 }));
  cHandle.position.set(-0.56, 0.38, 0); cooler.add(cHandle);
  cooler.position.set(-4.4, 0, 2.15); cooler.rotation.y = 0.12;
  scene.add(cooler);
  addSignPlane(scene, TEX.coolerSign, 0.78, 0.3, -4.4, 0.36, 2.52);

  // plates
  const plates = new THREE.Group();
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xe9e1d2, roughness: 0.65 });
  for (let i = 0; i < 8; i++) {
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.25 - i * 0.004, 0.27 - i * 0.004, 0.018, 14), plateMat);
    pl.position.y = 0.02 + i * 0.022; pl.castShadow = true; plates.add(pl);
  }
  plates.position.set(-1.18, 0, 2.3); scene.add(plates);

  // hose reel
  const reel = new THREE.Group();
  const reelMat = new THREE.MeshStandardMaterial({ color: 0x35796c, roughness: 0.6 });
  const reelBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 14), reelMat);
  reelBody.rotation.x = Math.PI / 2; reelBody.position.y = 0.42; reel.add(reelBody);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0x1c2b27, roughness: 0.8 }));
  hub.rotation.x = Math.PI / 2; hub.position.y = 0.42; reel.add(hub);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), reelMat); stand.position.y = 0.21; reel.add(stand);
  reel.position.set(6.96, 0, 2.24); scene.add(reel);
  // hose curve
  const hosePts = [
    new THREE.Vector3(6.96, 0.2, 2.24), new THREE.Vector3(6.0, 0.06, 2.75),
    new THREE.Vector3(4.3, 0.05, 2.9), new THREE.Vector3(2.6, 0.05, 2.65),
    new THREE.Vector3(0.7, 0.05, 2.8), new THREE.Vector3(-1.6, 0.05, 2.55), new THREE.Vector3(-4.4, 0.05, 2.4),
  ];
  const hoseCurve = new THREE.CatmullRomCurve3(hosePts);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 60, 0.025, 5, false), new THREE.MeshStandardMaterial({ color: 0x3f9b86, roughness: 0.7 }));
  hose.castShadow = true; scene.add(hose);

  // Jennifer rug + side table
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 36), new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 0.95 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(wx(JEN.x), 0.02, WORLD.guestZ - 0.18);
  rug.scale.set(1.06, 0.55, 1); rug.receiveShadow = true; scene.add(rug);
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x3e2a1d, roughness: 0.75 }));
  top.position.y = 0.62; top.castShadow = true; table.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x21150f, roughness: 0.8 }));
  leg.position.y = 0.31; table.add(leg);
  const glass = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.16, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xdfefff, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide }));
  bowl.position.y = 0.74; glass.add(bowl);
  const drink = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.11, 8), new THREE.MeshStandardMaterial({ color: 0xff5b83, roughness: 0.3, emissive: 0x551122, emissiveIntensity: 0.3 }));
  drink.position.y = 0.725; glass.add(drink);
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.25, 4), new THREE.MeshStandardMaterial({ color: 0xffe4a3 }));
  straw.position.set(0.03, 0.81, 0); straw.rotation.z = -0.2; glass.add(straw);
  glass.position.set(0.08, 0, 0.02); table.add(glass);
  table.position.set(wx(JEN.x) + 0.82, 0, WORLD.guestZ - 0.02);
  scene.add(table);
}

function buildStringLights() {
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x171216, roughness: 0.9 });
  const bulbColors = [0xffc46a, 0xffc46a, 0xff9ec4, 0xffd56b, 0x8fe8ff, 0xffc46a, 0xffd56b];
  const glowMat = new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });
  for (let line = 0; line < 2; line++) {
    const y = 4.25 + line * 0.32, z = -4.9 - line * 0.5, sag = 0.6 + line * 0.15;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(-11 + t * 22, y - Math.sin(t * Math.PI) * sag, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.012, 4, false), wireMat);
    scene.add(wire);
    const n = 24;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const p = curve.getPoint(t);
      const col = bulbColors[i % bulbColors.length];
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2.2, roughness: 0.3 }));
      p.y -= 0.07; bulb.position.copy(p); scene.add(bulb);
      const glow = new THREE.Sprite(glowMat.clone());
      glow.material.color = new THREE.Color(col);
      glow.position.copy(p); glow.scale.set(0.55, 0.55, 1); scene.add(glow);
      W3.strings.push({ bulb, glow, phase: i * 1.77, base: p.clone() });
    }
  }
  // bunting
  const buntPts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    buntPts.push(new THREE.Vector3(-11 + t * 22, 3.75 - Math.sin(t * Math.PI) * 0.5, -3.7));
  }
  const buntCurve = new THREE.CatmullRomCurve3(buntPts);
  const buntWire = new THREE.Mesh(new THREE.TubeGeometry(buntCurve, 48, 0.008, 3, false), wireMat);
  scene.add(buntWire);
  const cols = [0xc94f4f, 0xe0a33a, 0x4c9c8a, 0xc77a3e, 0x8d5ab2];
  for (let i = 0; i < 22; i++) {
    const t = (i + 0.5) / 22;
    const p = buntCurve.getPoint(t);
    const shape = new THREE.Shape();
    shape.moveTo(-0.11, 0); shape.lineTo(0.11, 0); shape.lineTo(0, -0.3); shape.closePath();
    const flag = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
    flag.position.set(p.x, p.y, p.z); flag.rotation.y = Math.sin(t * 2) * 0.2; scene.add(flag);
  }
}

function buildCrowdBackground() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a0910, roughness: 1 });
  const R = rng(909);
  for (let i = 0; i < 17; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.95, 7), mat);
    body.position.y = 0.48; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat);
    head.position.y = 1.06; g.add(head);
    if (i % 3 === 0) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.55, 5), mat);
      arm.position.set(0.2, 0.92, 0); arm.rotation.z = -0.55; g.add(arm);
    }
    g.position.set(-8.5 + i * 1.06 + (R() - 0.5) * 0.3, 0, -6.2 - R() * 1.2);
    g.scale.setScalar(0.88 + R() * 0.25);
    scene.add(g);
    W3.crowd.push({ group: g, phase: R() * 8, amp: 0.03 + R() * 0.05 });
  }
}
/* --------------------------------------------------------------- people */
const SKIN3 = ["#f0c7a2", "#e2ab7d", "#c98b62", "#a86c47", "#8f5d3c", "#7a4a30", "#5c3522", "#4a2a1b"];
const HAIR3 = ["#19100b", "#2a1810", "#3b2417", "#4b3020", "#6b4026", "#b86a32", "#d7a14a", "#e3c27a", "#8a8a8a"];
const GEO3 = {};
function initSharedGeo() {
  GEO3.sph = new THREE.SphereGeometry(1, 10, 8);
  GEO3.sphLo = new THREE.SphereGeometry(1, 7, 5);
  GEO3.box = new THREE.BoxGeometry(1, 1, 1);
  GEO3.cyl = new THREE.CylinderGeometry(1, 1, 1, 9);
  GEO3.cyl6 = new THREE.CylinderGeometry(1, 1, 1, 6);
  GEO3.cone = new THREE.ConeGeometry(1, 1, 8);
  GEO3.torus = new THREE.TorusGeometry(1, 0.12, 6, 16);
}
function mat3(color, opts = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.78, metalness: 0.02 }, opts));
}
function mesh3(parent, geo, material, x, y, z, sx = 1, sy = 1, sz = 1, cast = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  m.castShadow = cast; m.receiveShadow = false;
  parent.add(m); return m;
}
function chefLook3D(id) {
  const h = hash32("chef-look-" + id);
  return {
    skin: SKIN3[h % SKIN3.length], hair: HAIR3[(h >>> 3) % HAIR3.length],
    hat: (h >>> 6) % 4, hairStyle: (h >>> 8) % 4,
  };
}
function makeChef3D(id, color) {
  const look = chefLook3D(id);
  const g = new THREE.Group();
  const skin = mat3(new THREE.Color(look.skin).multiplyScalar(0.8), { roughness: 0.72 });
  const shirt = mat3(new THREE.Color(color).multiplyScalar(0.82), { roughness: 0.82 });
  const apron = mat3(0xf0e3c8, { roughness: 0.9 });
  const pants = mat3(0x2b2633, { roughness: 0.9 });
  const shoe = mat3(0x131116, { roughness: 0.8 });
  const hair = mat3(look.hair, { roughness: 0.85 });
  const dark = mat3(0x20140e, { roughness: 0.7 });
  const metal = mat3(0xbfc4c7, { metalness: 0.9, roughness: 0.3 });
  const legs = [];
  for (let s = -1; s <= 1; s += 2) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.11, 0.84, 0);
    mesh3(pivot, GEO3.cyl, pants, 0, -0.38, 0, 0.075, 0.76, 0.075);
    mesh3(pivot, GEO3.box, shoe, 0, -0.79, 0.05, 0.16, 0.09, 0.28);
    g.add(pivot); legs.push(pivot);
  }
  const torso = mesh3(g, GEO3.cyl, shirt, 0, 1.14, 0, 0.23, 0.58, 0.2);
  mesh3(g, GEO3.box, apron, 0, 1.1, 0.2, 0.36, 0.48, 0.035);
  mesh3(g, GEO3.box, mat3(0xcfc0a8), 0, 1.33, 0.222, 0.2, 0.06, 0.01, false);
  // arms
  const arms = [];
  for (let s = -1; s <= 1; s += 2) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.27, 1.38, 0);
    mesh3(pivot, GEO3.cyl, shirt, 0, -0.17, 0, 0.065, 0.34, 0.065);
    mesh3(pivot, GEO3.cyl, skin, 0, -0.38, 0, 0.055, 0.24, 0.055);
    mesh3(pivot, GEO3.sph, skin, 0, -0.52, 0.01, 0.07, 0.075, 0.07);
    g.add(pivot); arms.push(pivot);
  }
  // tongs in right hand
  const tongs = new THREE.Group();
  for (let s = -1; s <= 1; s += 2) {
    const t = mesh3(tongs, GEO3.box, metal, s * 0.035, -0.16, 0.02, 0.018, 0.3, 0.02);
    t.rotation.z = s * 0.12;
  }
  tongs.position.set(0, -0.52, 0.02);
  arms[1].add(tongs);
  // head
  mesh3(g, GEO3.cyl, skin, 0, 1.5, 0, 0.075, 0.11, 0.075);
  const head = new THREE.Group(); head.position.set(0, 1.65, 0); g.add(head);
  mesh3(head, GEO3.sph, skin, 0, 0, 0, 0.165, 0.185, 0.165);
  // face
  for (const s of [-1, 1]) mesh3(head, GEO3.sphLo, dark, s * 0.06, 0.01, 0.157, 0.017, 0.021, 0.012, false);
  mesh3(head, GEO3.sphLo, skin, 0, -0.025, 0.166, 0.025, 0.02, 0.02, false);
  mesh3(head, GEO3.box, mat3(0x6a2a26), 0, -0.083, 0.157, 0.06, 0.014, 0.012, false);
  // hair
  mesh3(head, GEO3.sph, hair, 0, 0.045, -0.012, 0.17, 0.14, 0.17, false);
  if (look.hairStyle === 1) { mesh3(head, GEO3.box, hair, -0.155, -0.04, -0.02, 0.04, 0.18, 0.15, false); mesh3(head, GEO3.box, hair, 0.155, -0.04, -0.02, 0.04, 0.18, 0.15, false); }
  if (look.hairStyle === 2) mesh3(head, GEO3.sph, hair, 0, 0.17, -0.06, 0.08, 0.09, 0.08, false);
  // hat
  if (look.hat === 0) {
    mesh3(head, GEO3.cyl, mat3(0xf7f0e2, { roughness: 0.9 }), 0, 0.19, 0, 0.165, 0.11, 0.165, false);
    mesh3(head, GEO3.sph, mat3(0xfffbf2, { roughness: 0.9 }), -0.07, 0.27, 0, 0.085, 0.08, 0.085, false);
    mesh3(head, GEO3.sph, mat3(0xfffbf2, { roughness: 0.9 }), 0.07, 0.27, 0, 0.085, 0.08, 0.085, false);
    mesh3(head, GEO3.sph, mat3(0xfffbf2, { roughness: 0.9 }), 0, 0.31, 0, 0.08, 0.07, 0.08, false);
  } else if (look.hat === 1) {
    mesh3(head, GEO3.cyl, shirt, 0, 0.18, 0, 0.17, 0.07, 0.17, false);
    mesh3(head, GEO3.box, shirt, 0, 0.16, 0.14, 0.26, 0.035, 0.16, false);
  } else if (look.hat === 2) {
    mesh3(head, GEO3.sph, mat3(0xd94f4f), 0, 0.17, 0, 0.17, 0.07, 0.17, false);
    mesh3(head, GEO3.box, mat3(0xd94f4f), 0.15, 0.16, -0.02, 0.1, 0.05, 0.08, false);
  } else {
    mesh3(head, GEO3.cyl, mat3(0xd4c7a9, { roughness: 0.95 }), 0, 0.19, 0, 0.18, 0.08, 0.18, false);
    mesh3(head, GEO3.cyl, mat3(0xd4c7a9, { roughness: 0.95 }), 0, 0.16, 0.02, 0.24, 0.025, 0.24, false);
  }
  g.scale.setScalar(0.98);
  g.userData.parts = { legs, arms, head, torso, tongs };
  return { group: g, parts: g.userData.parts, carry: null, carryType: null, look };
}

function makeGuest3D(guest) {
  const look = guest.look || guestLook(guest.id);
  const g = new THREE.Group();
  const skin = mat3(new THREE.Color(look.skin).multiplyScalar(0.8), { roughness: 0.74 });
  const shirt = mat3(new THREE.Color(look.shirt).multiplyScalar(0.82), { roughness: 0.86 });
  const pants = mat3(0x2b2832, { roughness: 0.92 });
  const shoe = mat3(0x151217, { roughness: 0.85 });
  const hair = mat3(look.hair, { roughness: 0.88 });
  const dark = mat3(0x23150f, { roughness: 0.7 });
  const white = mat3(0xece5d8, { roughness: 0.65 });
  const legs = [];
  for (let s = -1; s <= 1; s += 2) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.1, 0.82, 0);
    mesh3(pivot, GEO3.cyl, pants, 0, -0.36, 0, 0.07, 0.72, 0.07);
    mesh3(pivot, GEO3.box, shoe, 0, -0.76, 0.04, 0.15, 0.085, 0.25);
    g.add(pivot); legs.push(pivot);
  }
  mesh3(g, GEO3.cyl, shirt, 0, 1.1, 0, 0.22, 0.56, 0.19);
  mesh3(g, GEO3.box, mat3(0x1f1b20, { roughness: 0.9 }), 0, 0.84, 0, 0.4, 0.055, 0.35, false);
  mesh3(g, GEO3.box, mat3(0xe9dfcf, { roughness: 0.8 }), 0, 1.37, 0.15, 0.16, 0.045, 0.08, false);
  const arms = [];
  for (let s = -1; s <= 1; s += 2) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.255, 1.32, 0);
    mesh3(pivot, GEO3.cyl, shirt, 0, -0.16, 0, 0.06, 0.32, 0.06);
    mesh3(pivot, GEO3.cyl, skin, 0, -0.36, 0, 0.052, 0.22, 0.052);
    mesh3(pivot, GEO3.sph, skin, 0, -0.49, 0.01, 0.065, 0.07, 0.065);
    g.add(pivot); arms.push(pivot);
  }
  // plate held at waist
  const plate = new THREE.Group();
  mesh3(plate, GEO3.cyl, white, 0, 0, 0, 0.19, 0.012, 0.19, false);
  mesh3(plate, GEO3.cyl, mat3(0xd8d0c1), 0, 0.008, 0, 0.13, 0.006, 0.13, false);
  plate.position.set(0, 1.0, 0.25); g.add(plate);
  // head
  mesh3(g, GEO3.cyl, skin, 0, 1.44, 0, 0.07, 0.1, 0.07);
  const head = new THREE.Group(); head.position.set(0, 1.6, 0); g.add(head);
  mesh3(head, GEO3.sph, skin, 0, 0, 0, 0.16, 0.18, 0.16);
  for (const s of [-1, 1]) mesh3(head, GEO3.sphLo, dark, s * 0.058, 0.012, 0.153, 0.017, 0.02, 0.012, false);
  mesh3(head, GEO3.sphLo, skin, 0, -0.022, 0.162, 0.024, 0.019, 0.02, false);
  mesh3(head, GEO3.box, mat3(0x6d2e28), 0, -0.078, 0.153, 0.055, 0.012, 0.012, false);
  // hair
  mesh3(head, GEO3.sph, hair, 0, 0.05, -0.012, 0.168, 0.14, 0.168, false);
  if (look.hairStyle === 1) {
    mesh3(head, GEO3.box, hair, -0.155, -0.04, -0.02, 0.04, 0.18, 0.15, false);
    mesh3(head, GEO3.box, hair, 0.155, -0.04, -0.02, 0.04, 0.18, 0.15, false);
  } else if (look.hairStyle === 2) {
    mesh3(head, GEO3.sph, hair, 0, 0.18, -0.07, 0.08, 0.09, 0.08, false);
  } else if (look.hairStyle === 3) {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + i * 0.35;
      mesh3(head, GEO3.sphLo, hair, Math.cos(a) * 0.15, Math.sin(a) * 0.14 + 0.02, -0.01, 0.075, 0.07, 0.075, false);
    }
  }
  // accessories
  if (look.accessory === 1) {
    mesh3(head, GEO3.box, dark, -0.065, 0.012, 0.163, 0.085, 0.042, 0.015, false);
    mesh3(head, GEO3.box, dark, 0.065, 0.012, 0.163, 0.085, 0.042, 0.015, false);
    mesh3(head, GEO3.box, dark, 0, 0.012, 0.163, 0.045, 0.012, 0.012, false);
  } else if (look.accessory === 2) {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 8), mat3(0xffb24a));
    hat.position.set(0, 0.26, 0); head.add(hat);
  } else if (look.accessory === 3) {
    for (const s of [-1, 1]) mesh3(head, GEO3.sphLo, mat3(0xffd56b, { metalness: 0.6, roughness: 0.35 }), s * 0.16, -0.04, 0, 0.02, 0.035, 0.02, false);
  }
  g.scale.setScalar(0.98 * (look.height || 1));
  g.userData.parts = { legs, arms, head, plate };
  return { group: g, parts: g.userData.parts, look };
}

function makeJennifer3D() {
  const g = new THREE.Group();
  const skin = mat3(new THREE.Color(JEN_LOOK.skin).multiplyScalar(0.84), { roughness: 0.64 });
  const dress = mat3(JEN_LOOK.dress, { roughness: 0.7, metalness: 0.08 });
  const hair = mat3(new THREE.Color(JEN_LOOK.hair).multiplyScalar(0.86), { roughness: 0.74 });
  const lips = mat3(0xc93f5c, { roughness: 0.45 });
  const gold = mat3(0xffe4a3, { metalness: 0.7, roughness: 0.3 });
  const dark = mat3(0x171014, { roughness: 0.7 });
  // legs + heels
  for (let s = -1; s <= 1; s += 2) {
    mesh3(g, GEO3.cyl, skin, s * 0.1, 0.48, 0, 0.06, 0.7, 0.06);
    mesh3(g, GEO3.box, dark, s * 0.1, 0.09, 0.03, 0.12, 0.1, 0.24);
    mesh3(g, GEO3.box, dark, s * 0.1, 0.02, 0.12, 0.09, 0.06, 0.08, false);
  }
  // dress
  mesh3(g, GEO3.cyl, dress, 0, 1.0, 0, 0.27, 0.78, 0.23);
  mesh3(g, GEO3.cyl, dress, 0, 1.35, 0, 0.2, 0.3, 0.18);
  // arms
  const left = new THREE.Group(); left.position.set(-0.22, 1.4, 0); left.rotation.z = -0.35;
  mesh3(left, GEO3.cyl, skin, 0, -0.2, 0, 0.045, 0.38, 0.045);
  mesh3(left, GEO3.sph, skin, 0, -0.41, 0.02, 0.058, 0.06, 0.058);
  g.add(left);
  const right = new THREE.Group(); right.position.set(0.22, 1.4, 0); right.rotation.z = 0.42;
  mesh3(right, GEO3.cyl, skin, 0, -0.2, 0, 0.045, 0.38, 0.045);
  mesh3(right, GEO3.sph, skin, 0, -0.41, 0.02, 0.058, 0.06, 0.058);
  g.add(right);
  // cocktail
  const glass = new THREE.Group();
  mesh3(glass, GEO3.cone, mat3(0xdff2ff, { transparent: true, opacity: 0.36, roughness: 0.05, metalness: 0.2 }), 0, 0.04, 0, 0.09, 0.17, 0.09, false);
  mesh3(glass, GEO3.sph, mat3(0xff5b83, { emissive: 0x551122, emissiveIntensity: 0.4, roughness: 0.3 }), 0, 0.015, 0, 0.075, 0.04, 0.075, false);
  mesh3(glass, GEO3.cyl, mat3(0xffe4a3), 0.02, 0.18, 0, 0.008, 0.24, 0.008, false);
  glass.position.set(0, -0.44, 0.04); right.add(glass);
  // neck + head
  mesh3(g, GEO3.cyl, skin, 0, 1.55, 0, 0.06, 0.1, 0.06);
  const head = new THREE.Group(); head.position.set(0, 1.7, 0); g.add(head);
  mesh3(head, GEO3.sph, skin, 0, 0, 0, 0.165, 0.185, 0.165);
  // blonde bob
  mesh3(head, GEO3.sph, hair, 0, 0.045, -0.015, 0.18, 0.16, 0.18, false);
  mesh3(head, GEO3.box, hair, -0.17, -0.05, -0.02, 0.055, 0.22, 0.16, false);
  mesh3(head, GEO3.box, hair, 0.17, -0.05, -0.02, 0.055, 0.22, 0.16, false);
  // sunglasses on head
  mesh3(head, GEO3.box, dark, -0.07, 0.09, 0.15, 0.09, 0.045, 0.035, false);
  mesh3(head, GEO3.box, dark, 0.07, 0.09, 0.15, 0.09, 0.045, 0.035, false);
  mesh3(head, GEO3.box, dark, 0, 0.09, 0.15, 0.045, 0.012, 0.02, false);
  // face
  for (const s of [-1, 1]) mesh3(head, GEO3.sphLo, dark, s * 0.06, 0.015, 0.155, 0.018, 0.022, 0.012, false);
  mesh3(head, GEO3.sphLo, skin, 0, -0.02, 0.164, 0.023, 0.019, 0.02, false);
  mesh3(head, GEO3.box, lips, 0, -0.08, 0.155, 0.07, 0.02, 0.016, false);
  // necklace
  mesh3(g, GEO3.torus, gold, 0, 1.45, 0.08, 0.1, 0.07, 0.1, false).rotation.x = Math.PI / 2;
  // name/plate marker not needed; overlay handles it
  g.userData.parts = { head, left, right };
  return g;
}

/* ----------------------------------------------------------------- meat */
function makeMeatMesh(type) {
  const g = new THREE.Group();
  const mats = [];
  const add = (geo, color, opts = {}, cookable = true, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
    const m = mat3(color, Object.assign({ roughness: 0.72 }, opts));
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    g.add(mesh);
    mats.push({ mat: m, base: new THREE.Color(color), cookable });
    return mesh;
  };
  const doneCol = new THREE.Color(MEATS[type].done);
  if (type === 0) {
    const pts = [];
    for (let i = 0; i <= 70; i++) {
      const t = i / 70, a = t * Math.PI * 4.6, r = 0.19 * (1 - t * 0.2);
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.03 + Math.sin(a * 2) * 0.006, Math.sin(a) * r * 0.82));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    add(new THREE.TubeGeometry(curve, 48, 0.057, 6, false), MEATS[type].raw, {}, true, 0, 0, 0);
    // grill bands
    for (let i = 0; i < 3; i++) {
      add(GEO3.torus, 0x2b160c, { roughness: 0.9 }, false, (i - 1) * 0.1, 0.075, 0, 0.16, 0.16, 0.16, Math.PI / 2, 0, 0);
    }
  } else if (type === 1) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.26, 0.04);
    shape.bezierCurveTo(-0.32, -0.12, -0.16, -0.24, 0.04, -0.21);
    shape.bezierCurveTo(0.25, -0.18, 0.34, 0.02, 0.27, 0.15);
    shape.bezierCurveTo(0.18, 0.28, -0.11, 0.27, -0.22, 0.2);
    shape.bezierCurveTo(-0.28, 0.17, -0.25, 0.09, -0.26, 0.04);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 2, curveSegments: 8 });
    geo.rotateX(-Math.PI / 2);
    add(geo, MEATS[type].raw, {}, true, 0, 0.04, 0);
    add(GEO3.torus, 0xf0d6ae, { roughness: 0.8 }, false, 0, 0.07, 0.02, 0.3, 0.24, 0.28, Math.PI / 2, 0, 0);
    for (let i = -1; i <= 1; i++) add(GEO3.box, 0x2b160c, { roughness: 0.9 }, false, i * 0.13, 0.105, 0.02, 0.018, 0.006, 0.34, 0, 0, i * 0.22);
  } else if (type === 2) {
    add(GEO3.cyl6, 0xa77a4b, { roughness: 0.9 }, false, 0, 0.02, 0, 0.012, 0.86, 0.012, 0, 0, Math.PI / 2);
    const cubes = [[-0.24, 0xe2ba7f], [-0.02, 0xe7c590], [0.21, 0xe2ba7f]];
    for (const [x, col] of cubes) {
      add(GEO3.box, col, { roughness: 0.7 }, true, x, 0.07, 0, 0.15, 0.13, 0.13, 0, 0.12, 0);
      add(GEO3.box, 0x2b160c, { roughness: 0.9 }, false, x, 0.14, 0, 0.13, 0.008, 0.015);
    }
    add(GEO3.box, 0xd94835, { roughness: 0.62 }, true, -0.13, 0.07, 0, 0.08, 0.12, 0.12, 0, 0.1, 0);
    add(GEO3.box, 0xefe6d2, { roughness: 0.7 }, true, 0.11, 0.07, 0, 0.07, 0.11, 0.11, 0, 0.1, 0);
  } else if (type === 3) {
    add(GEO3.box, 0x9aa3a8, { metalness: 0.65, roughness: 0.38 }, true, 0, 0.035, 0, 0.56, 0.05, 0.38);
    add(GEO3.box, 0xbac3c7, { metalness: 0.7, roughness: 0.32 }, false, 0, 0.062, 0, 0.5, 0.012, 0.32);
    const kern = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 6, 4), mat3(0xf5d66d, { roughness: 0.55 }), 34);
    const dummy = new THREE.Object3D();
    const R = rng(type * 99 + 3);
    for (let i = 0; i < 34; i++) {
      dummy.position.set((R() - 0.5) * 0.46, 0.085 + R() * 0.018, (R() - 0.5) * 0.29);
      dummy.scale.setScalar(0.85 + R() * 0.5);
      dummy.updateMatrix(); kern.setMatrixAt(i, dummy.matrix);
    }
    kern.castShadow = false; g.add(kern);
    mats.push({ mat: kern.material, base: new THREE.Color(0xf5d66d), cookable: true });
    add(GEO3.box, 0xffe9a0, { roughness: 0.4 }, false, 0.08, 0.1, 0.02, 0.08, 0.018, 0.05);
  } else if (type === 4) {
    for (let s = 0; s < 2; s++) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const x = -0.36 + (i / 12) * 0.72;
        pts.push(new THREE.Vector3(x, 0.055 + s * 0.035, Math.sin(i * 0.9 + s * 2) * 0.045 + (s ? 0.06 : -0.04)));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      add(new THREE.TubeGeometry(curve, 20, 0.045, 5, false), s ? 0xdb8a8e : 0xe39a9c, { roughness: 0.7 }, true, 0, 0, 0, 1, 0.65, 1);
      add(new THREE.TubeGeometry(curve, 20, 0.012, 4, false), 0xffe3d1, { roughness: 0.65 }, false, 0, 0.028, 0, 1, 0.65, 1);
    }
  } else {
    for (let s = 0; s < 2; s++) {
      const x = s ? 0.12 : -0.12, z = s ? 0.04 : -0.03;
      add(GEO3.sph, 0xc96970, { roughness: 0.68 }, true, x, 0.07, z, 0.19, 0.07, 0.14);
      add(GEO3.torus, 0xf1dfc4, { roughness: 0.75 }, false, x, 0.1, z, 0.19, 0.12, 0.14, Math.PI / 2, 0, 0);
      add(GEO3.cyl6, 0xefe1c5, { roughness: 0.78 }, false, x + (s ? -0.21 : 0.21), 0.075, z, 0.026, 0.22, 0.026, 0, 0, Math.PI / 2);
      add(GEO3.sph, 0xfff3db, { roughness: 0.7 }, false, x + (s ? -0.32 : 0.32), 0.075, z, 0.04, 0.04, 0.04);
    }
  }
  g.userData.mats = mats;
  g.userData.doneCol = doneCol;
  return g;
}
function applyMeatCook(mesh, total, ch, type) {
  const d = MEATS[type];
  const cook = clamp(total / (d.hi * 1.14), 0, 1.15);
  const char = clamp(ch, 0, 1);
  for (const e of mesh.userData.mats) {
    if (e.cookable) {
      e.mat.color.copy(e.base).lerp(mesh.userData.doneCol, clamp(cook * 0.92, 0, 1));
      e.mat.color.multiplyScalar(1 - char * 0.62);
    } else {
      e.mat.color.copy(e.base).multiplyScalar(1 - char * 0.22);
    }
  }
}
function detachObj(o) {
  if (o && o.parent) o.parent.remove(o);
}
function disposeObj(o) {
  o.traverse((c) => {
    if (c.geometry && !Object.values(GEO3).includes(c.geometry)) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else if (c.material !== TEX) c.material.dispose();
    }
  });
}

/* ----------------------------------------------------------------- fire */
function buildFire() {
  const coalGeo = new THREE.DodecahedronGeometry(0.06, 0);
  for (let z = 0; z < BRAAI.zoneCount; z++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x170f0c, emissive: 0xff4c12, emissiveIntensity: 1.0, roughness: 1 });
    const inst = new THREE.InstancedMesh(coalGeo, mat, 26);
    const dummy = new THREE.Object3D();
    const R = rng(991 + z * 37);
    const base = [];
    for (let i = 0; i < 26; i++) {
      dummy.position.set(zoneWorldX(z) + (R() - 0.5) * 3.05, WORLD.bedY + 0.06 + R() * 0.035, WORLD.braaiZ0 + 0.32 + R() * 1.3);
      dummy.rotation.set(R() * 3, R() * 3, R() * 3);
      dummy.scale.setScalar(0.7 + R() * 0.9);
      dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
      base.push({ sx: dummy.scale.x, phase: R() * 8 });
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
    W3.coalMeshes.push({ inst, mat, base });

    // logs, one group per likely log
    const logs = [];
    for (let k = 0; k < 3; k++) {
      const lg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.72, 7), new THREE.MeshStandardMaterial({ color: 0x24140d, roughness: 1, emissive: 0xff4a12, emissiveIntensity: 0.0 }));
      body.rotation.z = Math.PI / 2; body.castShadow = true; lg.add(body);
      for (const s of [-1, 1]) {
        const end = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshStandardMaterial({ color: 0x5a3620, roughness: 0.95, emissive: 0xff4a12, emissiveIntensity: 0.0 }));
        end.position.x = s * 0.361; end.rotation.y = s * Math.PI / 2; lg.add(end);
      }
      lg.position.set(zoneWorldX(z) + (k - 1) * 0.34, WORLD.bedY + 0.13, WORLD.braaiZ0 + 0.6 + k * 0.28);
      lg.rotation.y = (k - 1) * 0.18;
      lg.visible = false; scene.add(lg);
      logs.push({ group: lg, body: body.material, ends: [lg.children[1].material, lg.children[2].material] });
    }
    W3.logMeshes.push(logs);

    // flames
    const flames = [];
    for (let i = 0; i < 7; i++) {
      const spriteMat = new THREE.SpriteMaterial({ map: TEX.flame, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: 0xffffff });
      const sp = new THREE.Sprite(spriteMat);
      sp.position.set(zoneWorldX(z) + (i / 6 - 0.5) * 2.9, WORLD.grillY + 0.45, WORLD.braaiZ0 + 0.55 + (i % 3) * 0.22);
      scene.add(sp);
      flames.push({ sp, mat: spriteMat, phase: i * 1.9 + z * 0.7, off: (i / 6 - 0.5) * 2.9, zoff: (i % 3) * 0.22 });
    }
    W3.flameSprites.push(flames);

    const light = new THREE.PointLight(0xff5c1e, 1.2, 8.5, 2);
    light.position.set(zoneWorldX(z), WORLD.grillY + 0.7, WORLD.braaiZ0 + 0.95);
    scene.add(light);
    W3.fireLights.push(light);
  }
}

/* ------------------------------------------------------------- particles */
class Particles {
  constructor(max, tex, blending, gravity = 0) {
    this.max = max; this.gravity = gravity; this.tex = tex;
    this.items = [];
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute("alpha", new THREE.BufferAttribute(this.alpha, 1));
    this.geo = geo;
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, tint: { value: 1 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC;
        void main(){ vA=alpha; vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*(300.0/max(0.1,-mv.z)); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D map; varying float vA; varying vec3 vC;
        void main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vC,t.a*vA); }`,
      transparent: true, depthWrite: false, blending,
    });
    this.mat = mat;
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 4;
    scene.add(this.points);
  }
  spawn(x, y, z, vx, vy, vz, life, size, color, grav = this.gravity) {
    if (this.items.length >= this.max) this.items.shift();
    this.items.push({ x, y, z, vx, vy, vz, life: 0, max: life, size, color, grav, rot: 0 });
  }
  update(dt) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i]; p.life += dt;
      if (p.life >= p.max) { items.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.vy += p.grav * dt;
    }
    const n = items.length;
    for (let i = 0; i < n; i++) {
      const p = items[i], k = p.life / p.max;
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
      this.col[i * 3] = p.color[0]; this.col[i * 3 + 1] = p.color[1]; this.col[i * 3 + 2] = p.color[2];
      this.size[i] = p.size * (0.7 + k * 0.7);
      this.alpha[i] = (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88) * (p.alpha == null ? 1 : p.alpha);
    }
    this.geo.setDrawRange(0, n);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
    this.geo.attributes.alpha.needsUpdate = true;
  }
}
const PS = {};
function buildParticles() {
  PS.smoke = new Particles(160, TEX.smoke, THREE.NormalBlending, 0.16);
  PS.embers = new Particles(190, TEX.spark, THREE.AdditiveBlending, -1.1);
  PS.sparks = new Particles(180, TEX.spark, THREE.AdditiveBlending, -6.5);
  PS.steam = new Particles(100, TEX.steam, THREE.NormalBlending, 0.3);
  PS.water = new Particles(240, TEX.spark, THREE.AdditiveBlending, -5.5);
  PS.fireflies = new Particles(40, TEX.glow, THREE.AdditiveBlending, 0);
  initFireflies3D();
}
function spawnSmoke3D(x, y, z, amt = 1, dark = false) {
  PS.smoke.spawn(x + (Math.random() - 0.5) * 0.35, y, z + (Math.random() - 0.5) * 0.25,
    (Math.random() - 0.5) * 0.22, 0.28 + Math.random() * 0.45 * amt, (Math.random() - 0.5) * 0.15,
    2.2 + Math.random() * 2.4, 0.42 + Math.random() * 0.5 * amt,
    dark ? [0.16, 0.14, 0.14] : [0.3, 0.28, 0.29]);
}
function spawnEmber3D(x, y, z, spread = 1.2, up = 1) {
  PS.embers.spawn(x + (Math.random() - 0.5) * spread, y, z + (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 0.35, (0.5 + Math.random() * 1.1) * up, (Math.random() - 0.5) * 0.25,
    0.9 + Math.random() * 1.2, 0.05 + Math.random() * 0.06, [1, 0.55 + Math.random() * 0.3, 0.15]);
}
function spawnSpark3D(x, y, z, color = [1, 0.85, 0.45]) {
  PS.sparks.spawn(x + (Math.random() - 0.5) * 0.28, y, z + (Math.random() - 0.5) * 0.2,
    (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 0.35,
    0.35 + Math.random() * 0.4, 0.035 + Math.random() * 0.03, color);
}
function spawnSteam3D(x, y, z) {
  PS.steam.spawn(x + (Math.random() - 0.5) * 0.8, y, z + (Math.random() - 0.5) * 0.35,
    (Math.random() - 0.5) * 0.2, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.15,
    1.0 + Math.random() * 1.2, 0.3 + Math.random() * 0.3, [0.86, 0.94, 0.98]);
}
function initFireflies3D() {
  W3.fireflies = [];
  const R = rng(3311);
  for (let i = 0; i < 32; i++) W3.fireflies.push({ x: -9 + R() * 18, y: 0.5 + R() * 3.2, z: -7 + R() * 7, p: R() * TAU, sp: 0.15 + R() * 0.4, amp: 0.4 + R() * 1.2 });
}

/* ---------------------------------------------------------------- hands */
function buildHands() {
  const h = new THREE.Group();
  const skin = new THREE.MeshBasicMaterial({ color: 0x8d5737, depthTest: false, depthWrite: false });
  const sleeve = new THREE.MeshBasicMaterial({ color: 0xbf7b2e, depthTest: false, depthWrite: false });
  const metal = new THREE.MeshBasicMaterial({ color: 0xaeb6ba, depthTest: false, depthWrite: false });
  const makeArm = (x, flip) => {
    const a = new THREE.Group();
    a.position.set(x, -0.72, -1.15);
    a.rotation.set(-0.5, flip * 0.22, flip * -0.32);
    const sl = new THREE.Mesh(GEO3.cyl, sleeve); sl.scale.set(0.042, 0.16, 0.042); sl.position.set(0, 0.03, 0.08); a.add(sl);
    const arm = new THREE.Mesh(GEO3.cyl, skin); arm.scale.set(0.03, 0.21, 0.03); arm.position.set(0, -0.06, -0.06); arm.rotation.x = -1.0; a.add(arm);
    const hand = new THREE.Mesh(GEO3.sph, skin); hand.scale.set(0.042, 0.042, 0.042); hand.position.set(0, -0.14, -0.2); a.add(hand);
    a.traverse((o) => { o.renderOrder = 999; o.frustumCulled = false; });
    h.add(a); return a;
  };
  const left = makeArm(-0.36, -1), right = makeArm(0.37, 1);
  const tongs = new THREE.Group();
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(GEO3.box, metal); t.scale.set(0.009, 0.06, 0.22); t.position.set(s * 0.02, -0.17, -0.36); t.rotation.z = s * 0.1; t.renderOrder = 999; t.frustumCulled = false; tongs.add(t);
  }
  right.add(tongs);
  const carry = new THREE.Group(); carry.position.set(0, -0.62, -1.2); h.add(carry);
  const nozzle = new THREE.Group();
  const nz = new THREE.Mesh(GEO3.cyl, metal); nz.scale.set(0.03, 0.1, 0.03); nz.rotation.x = Math.PI / 2; nz.renderOrder = 999; nz.frustumCulled = false; nozzle.add(nz);
  const nzTip = new THREE.Mesh(GEO3.cyl, new THREE.MeshBasicMaterial({ color: 0x78d9ff, depthTest: false, depthWrite: false }));
  nzTip.scale.set(0.018, 0.03, 0.018); nzTip.rotation.x = Math.PI / 2; nzTip.position.z = -0.07; nzTip.renderOrder = 999; nzTip.frustumCulled = false; nozzle.add(nzTip);
  nozzle.position.set(-0.05, -0.68, -1.18); nozzle.visible = false; h.add(nozzle);
  h.renderOrder = 999;
  h.visible = false;
  W3.hands = h;
  W3.handParts = { left, right, tongs, carry, nozzle, sleeve };
  camera.add(h);
}

/* ------------------------------------------------------ character updates */
function updateChefVisual(vis, p, time, dt) {
  const g = vis.group;
  g.position.copy(playerWorldPos(p));
  g.rotation.y = (p.yaw || 0) + Math.PI;
  const moving = !!p.moving;
  const walk = p.walk || 0;
  const swing = moving ? Math.sin(walk * 2.4) * 0.55 : Math.sin(time * 1.5 + (p.id || "x").length) * 0.03;
  vis.parts.legs[0].rotation.x = swing;
  vis.parts.legs[1].rotation.x = -swing;
  vis.parts.arms[0].rotation.x = -swing * 0.65;
  vis.parts.arms[1].rotation.x = swing * 0.65;
  vis.parts.head.rotation.z = Math.sin(time * 1.2 + 1.4) * 0.025;
  // carry prop in front
  const c = p.carry;
  const key = c ? (c.k === "w" ? "w" + c.n : "m" + c.t) : null;
  if (key !== vis.carryType) {
    if (vis.carry) { detachObj(vis.carry); disposeObj(vis.carry); vis.carry = null; }
    vis.carryType = key;
    if (c) {
      const cg = new THREE.Group();
      if (c.k === "w") {
        for (let i = 0; i < c.n; i++) {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.65, 7), mat3(0x724a2c, { roughness: 0.95 }));
          log.rotation.z = Math.PI / 2; log.position.set(0, 0.95 + i * 0.12, 0.34); log.castShadow = true; cg.add(log);
        }
      } else {
        const meat = makeMeatMesh(c.t);
        meat.scale.setScalar(0.52);
        meat.position.set(0, 1.05, 0.38); meat.rotation.x = -0.35;
        cg.add(meat);
      }
      g.add(cg); vis.carry = cg;
    }
  }
  if (vis.carry && c && c.k === "m") applyMeatCook(vis.carry.children[0], c.a + c.b, c.ch, c.t);
}
function updateGuestVisual(vis, guest, time, dt) {
  const g = vis.group;
  const pos = guestWorldPos(guest);
  g.position.copy(pos);
  g.rotation.y = 0;
  const state = guest.state;
  const walk = guest.walk || 0;
  let swing = 0, bob = 0, tilt = 0;
  if (state === "walkin" || state === "leaving") {
    swing = Math.sin(walk * 2.3) * 0.6;
    g.position.y = Math.abs(Math.sin(walk * 2.3)) * 0.035;
  } else if (state === "happy") {
    bob = Math.abs(Math.sin(time * 7 + guest.id)) * 0.09;
    swing = Math.sin(time * 9) * 0.12;
  } else if (state === "angry") {
    tilt = Math.sin(time * 28) * 0.03;
    swing = Math.sin(time * 14) * 0.18;
  } else {
    swing = Math.sin(time * 1.35 + guest.id * 1.7) * 0.03;
    g.position.x += Math.sin(time * 1.1 + guest.id) * 0.018;
  }
  g.position.y += bob;
  g.rotation.y = state === "angry" ? tilt : 0;
  vis.parts.legs[0].rotation.x = swing;
  vis.parts.legs[1].rotation.x = -swing;
  vis.parts.arms[0].rotation.x = -swing * 0.55;
  vis.parts.arms[1].rotation.x = swing * 0.55;
  vis.parts.head.rotation.z = state === "happy" ? Math.sin(time * 5) * 0.08 : Math.sin(time * 1.2 + guest.id) * 0.03;
  vis.parts.plate.visible = state === "waiting" || state === "happy" || state === "angry" || state === "walkin";
}
function updateJenniferVisual(time, hype, cutscene) {
  const j = W3.jenn;
  if (!j) return;
  const mood = hype >= 78 ? "flirty" : hype >= 42 ? "watching" : "bored";
  j.rotation.y = 0;
  j.position.y = Math.sin(time * 1.1) * 0.012;
  j.rotation.z = Math.sin(time * 0.8) * 0.006;
  const arms = j.userData.parts;
  if (arms) {
    arms.left.rotation.z = -0.35 + Math.sin(time * 0.9) * 0.04;
    arms.right.rotation.z = 0.42 + Math.sin(time * 0.9 + 1) * 0.03;
    arms.head.rotation.z = mood === "flirty" ? Math.sin(time * 2.1) * 0.05 : Math.sin(time * 0.9) * 0.02;
  }
  if (cutscene) {
    j.position.z = lerp(j.position.z, j.position.z + 0.001, 0.02);
  }
}

/* ---------------------------------------------------------------- hands */
function updateHands3D(VG, localId, time, dt, inGame, cutscene) {
  const h = W3.hands;
  if (!h) return;
  const p = VG && VG.players ? VG.players.find((q) => q.id === localId) : null;
  h.visible = !!(inGame && p && !cutscene && VG.phase === "playing");
  if (!h.visible) return;
  const moving = !!p.moving;
  const walk = p.walk || 0;
  const bob = moving ? Math.sin(walk * 2.5) * 0.012 : Math.sin(time * 1.4) * 0.0035;
  h.position.y = bob;
  h.position.x = Math.sin(walk * 1.25) * (moving ? 0.006 : 0.0015);
  h.rotation.z = -localInput.strafe * 0.012;
  const c = p.carry;
  const spray = !!p.spraying;
  W3.handParts.left.visible = false;
  W3.handParts.right.visible = false;
  W3.handParts.nozzle.visible = false;
  W3.handParts.tongs.visible = false;
  const key = c ? (c.k === "w" ? "w" + c.n : "m" + c.t) : null;
  if (key !== W3.handCarryType) {
    if (W3.handCarry) { detachObj(W3.handCarry); disposeObj(W3.handCarry); W3.handCarry = null; }
    W3.handCarryType = key;
    if (c) {
      const cg = new THREE.Group();
      if (c.k === "w") {
        for (let i = 0; i < c.n; i++) {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 7), new THREE.MeshStandardMaterial({ color: 0x784f2d, roughness: 0.95, depthTest: false, depthWrite: false }));
          log.rotation.z = Math.PI / 2; log.position.set(0, i * 0.1, 0); log.renderOrder = 999; log.frustumCulled = false; cg.add(log);
        }
      } else {
        const meat = makeMeatMesh(c.t);
        meat.scale.setScalar(0.43);
        meat.rotation.x = -0.5;
        meat.traverse((o) => { if (o.material) { o.material.depthTest = false; o.material.depthWrite = false; } o.renderOrder = 999; o.frustumCulled = false; });
        cg.add(meat);
      }
      cg.traverse((o) => { o.renderOrder = 999; o.frustumCulled = false; });
      W3.handParts.carry.add(cg); W3.handCarry = cg;
    }
  }
  if (W3.handCarry && c && c.k === "m") applyMeatCook(W3.handCarry.children[0], c.a + c.b, c.ch, c.t);
  W3.handParts.sleeve.color.set(p.color || PLAYER_COLORS[0]);
}
function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function ellipse(g, x, y, rx, ry, rot = 0) {
  g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU);
}
function line(g, x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }

function cookColor(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ar = a >> 16, ag = (a >> 8) & 255, ab = a & 255;
  const br = b >> 16, bg = (b >> 8) & 255, bb = b & 255;
  return `rgb(${Math.round(lerp(ar, br, t))},${Math.round(lerp(ag, bg, t))},${Math.round(lerp(ab, bb, t))})`;
}
function drawMeat(g, type, x, y, sc, it, time = 0) {
  const d = MEATS[type] || MEATS[0];
  const total = it ? it.a + it.b : 0;
  const ch = it ? clamp(it.ch || 0, 0, 1) : 0;
  const cook = clamp(total / (d.hi * 1.14), 0, 1.15);
  const dark = clamp(cook * 0.82 + ch * 0.7, 0, 1);
  const flip = it && it.flipT > 0 ? Math.sin((1 - it.flipT / 0.28) * Math.PI) : 0;
  const place = it && it.placeT > 0 ? 0.7 + 0.3 * easeOut(1 - it.placeT / 0.32) : 1;
  g.save();
  g.translate(x, y - flip * 8);
  g.scale(sc * place, sc * place * (1 - flip * 0.55));
  // shadow
  g.fillStyle = "rgba(0,0,0,.28)"; ellipse(g, 1, 24, 39, 10); g.fill();
  const base = cookColor(d.raw, d.done, clamp(cook * 0.95, 0, 1));
  const burnt = `rgba(22,16,12,${0.25 + ch * 0.65})`;
  if (type === 0) {
    // boerewors coil
    g.save(); g.rotate(-0.12);
    g.lineCap = "round"; g.lineJoin = "round";
    const coil = (width, color) => {
      g.strokeStyle = color; g.lineWidth = width;
      g.beginPath();
      g.arc(-2, 1, 25, 0.35, 5.5);
      g.arc(2, -2, 15, 5.1, 2.35, true);
      g.stroke();
    };
    coil(15, "rgba(30,14,8,.38)");
    coil(12.5, base);
    g.strokeStyle = "rgba(255,210,160,.22)"; g.lineWidth = 2.2;
    g.beginPath(); g.arc(-2, 1, 25, 0.55, 3.1); g.stroke();
    g.strokeStyle = `rgba(38,16,8,${0.34 + cook * 0.55})`; g.lineWidth = 2.2;
    for (let i = 0; i < 7; i++) { const a = 0.65 + i * 0.58; g.beginPath(); g.arc(-2, 1, 25, a, a + 0.12); g.stroke(); }
    g.strokeStyle = "rgba(255,220,170,.18)"; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-2, 1, 21, 0.6, 2.7); g.stroke();
    if (ch > 0.12) { g.fillStyle = burnt; for (let i = 0; i < 7; i++) { const a = i * 2.1; ellipse(g, Math.cos(a) * 21, Math.sin(a) * 15, 2 + (i % 3), 1.5); g.fill(); } }
    g.restore();
  } else if (type === 1) {
    // rump steak
    g.save(); g.rotate(-0.2);
    g.beginPath();
    g.moveTo(-30, 7); g.bezierCurveTo(-34, -14, -12, -25, 10, -20);
    g.bezierCurveTo(34, -16, 37, 5, 27, 17); g.bezierCurveTo(15, 28, -11, 28, -25, 20);
    g.bezierCurveTo(-31, 16, -29, 12, -30, 7); g.closePath();
    const mg = g.createLinearGradient(-24, -16, 26, 22);
    mg.addColorStop(0, cookColor(d.raw, d.done, clamp(cook * 0.65, 0, 1)));
    mg.addColorStop(0.55, base); mg.addColorStop(1, cookColor(d.raw, d.done, clamp(cook * 1.08, 0, 1)));
    g.fillStyle = mg; g.fill();
    g.strokeStyle = `rgba(240,190,140,${0.25 + cook * 0.2})`; g.lineWidth = 2.4; g.stroke();
    // fat rim
    g.strokeStyle = `rgba(245,220,180,${0.32 - cook * 0.2})`; g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(-26, 5); g.bezierCurveTo(-26, -12, -8, -20, 9, -17); g.stroke();
    // grill marks
    g.strokeStyle = `rgba(38,18,9,${0.18 + cook * 0.5})`; g.lineWidth = 3;
    for (let i = -1; i <= 1; i++) { line(g, -19 + i * 15, -18, -9 + i * 15, 20); }
    // juice
    if (cook < 0.92) { g.fillStyle = "rgba(255,210,180,.28)"; ellipse(g, -4, -4, 4.5, 2.5, 0.6); g.fill(); }
    if (ch > 0.12) { g.fillStyle = burnt; for (let i = 0; i < 7; i++) { ellipse(g, -18 + i * 6, -14 + (i % 3) * 11, 3 + (i % 2) * 2, 2); g.fill(); } }
    g.restore();
  } else if (type === 2) {
    // chicken kebab
    g.save(); g.rotate(0.04);
    g.strokeStyle = "#b68a58"; g.lineWidth = 5; line(g, -43, 2, 43, 2);
    g.fillStyle = "#d8b27c"; ellipse(g, -43, 2, 3, 3); g.fill(); ellipse(g, 43, 2, 3, 3); g.fill();
    const cube = (cx, cy, w, h, fill) => {
      const cg = g.createLinearGradient(cx - w, cy - h, cx + w, cy + h);
      cg.addColorStop(0, fill); cg.addColorStop(1, cookColor(fill, "#7c3c1b", cook * 0.7));
      g.fillStyle = cg; rr(g, cx - w, cy - h, w * 2, h * 2, 5); g.fill();
      g.strokeStyle = "rgba(60,30,12,.3)"; g.lineWidth = 1; rr(g, cx - w, cy - h, w * 2, h * 2, 5); g.stroke();
    };
    cube(-23, 0, 13, 11, "#e7c590"); cube(1, 0, 13, 11, "#e2ba7f"); cube(24, 0, 12, 10, "#e7c590");
    g.fillStyle = "#d94835"; rr(g, -9, -8, 9, 16, 4); g.fill();
    g.fillStyle = "#efe6d2"; rr(g, 14, -7, 8, 14, 3); g.fill();
    if (ch > 0.1) { g.fillStyle = burnt; ellipse(g, -23, -3, 6, 3); g.fill(); ellipse(g, 24, 3, 6, 2); g.fill(); }
    g.restore();
  } else if (type === 3) {
    // sweetcorn kernels in foil
    g.save(); g.rotate(-0.06);
    const foil = g.createLinearGradient(-34, -16, 34, 16);
    foil.addColorStop(0, "#8d969d"); foil.addColorStop(0.35, "#d7dde0"); foil.addColorStop(0.65, "#8b959b"); foil.addColorStop(1, "#5d676d");
    g.fillStyle = foil;
    g.beginPath(); g.moveTo(-35, -12); g.lineTo(30, -17); g.lineTo(37, 12); g.lineTo(-31, 16); g.closePath(); g.fill();
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.4; g.stroke();
    const kg = g.createLinearGradient(0, -10, 0, 12);
    kg.addColorStop(0, cookColor("#ffe477", "#c88b2f", cook * 0.85)); kg.addColorStop(1, cookColor("#f3c74e", "#9d6524", cook * 0.9));
    g.fillStyle = kg; rr(g, -27, -9, 55, 18, 8); g.fill();
    g.fillStyle = "rgba(255,255,220,.42)";
    const KR = rng(44);
    for (let i = 0; i < 26; i++) { ellipse(g, -24 + KR() * 48, -7 + KR() * 14, 1.8, 1.4); g.fill(); }
    g.fillStyle = "rgba(255,240,160,.6)"; ellipse(g, -2, -2, 3.4, 2); g.fill();
    if (ch > 0.12) { g.fillStyle = burnt; for (let i = 0; i < 8; i++) { ellipse(g, -22 + i * 6, -7 + (i % 3) * 6, 2.5, 1.6); g.fill(); } }
    g.restore();
  } else if (type === 4) {
    // pork rashers
    g.save(); g.rotate(0.08);
    for (let s = 0; s < 2; s++) {
      g.save(); g.translate(0, s * 12 - 6); g.rotate((s - 0.5) * 0.16);
      const bg = g.createLinearGradient(-40, -8, 40, 8);
      bg.addColorStop(0, cookColor("#e8a5a5", "#8c3b1e", cook));
      bg.addColorStop(0.5, cookColor("#f0b4b0", "#a54b27", cook));
      bg.addColorStop(1, cookColor("#d98e92", "#7d321a", cook));
      g.strokeStyle = bg; g.lineWidth = 13; g.lineCap = "round";
      g.beginPath(); g.moveTo(-38, 0); g.bezierCurveTo(-24, -9, -8, 9, 8, 0); g.bezierCurveTo(22, -8, 31, 7, 40, 1); g.stroke();
      g.strokeStyle = "rgba(255,240,220,.55)"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(-37, -2); g.bezierCurveTo(-23, -10, -7, 7, 8, -2); g.bezierCurveTo(22, -10, 30, 4, 39, -1); g.stroke();
      if (cook > 0.6) { g.strokeStyle = `rgba(70,32,12,${(cook - 0.6) * 0.7})`; g.lineWidth = 2; g.stroke(); }
      g.restore();
    }
    if (ch > 0.1) { g.fillStyle = burnt; for (let i = 0; i < 6; i++) { ellipse(g, -28 + i * 10, -7 + (i % 2) * 8, 3, 1.8); g.fill(); } }
    g.restore();
  } else {
    // lamb chops
    g.save();
    for (let s = 0; s < 2; s++) {
      g.save(); g.translate(s * 9 - 5, s * 10 - 5); g.rotate(s ? 0.18 : -0.1);
      g.strokeStyle = "#efe1c5"; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(-39, -12); g.lineTo(-20, -2); g.stroke();
      g.fillStyle = "#f7ecd6"; ellipse(g, -42, -14, 5, 5); g.fill();
      const mg = g.createRadialGradient(-2, -3, 2, 0, 0, 25);
      mg.addColorStop(0, cookColor("#d57a7b", "#7c3621", cook * 0.85));
      mg.addColorStop(1, cookColor("#a9545b", "#552516", cook));
      g.fillStyle = mg;
      ellipse(g, 1, 0, 23, 17, -0.18); g.fill();
      g.strokeStyle = "rgba(255,220,180,.42)"; g.lineWidth = 2; ellipse(g, 1, 0, 23, 17, -0.18); g.stroke();
      g.strokeStyle = `rgba(45,20,10,${0.15 + cook * 0.45})`; g.lineWidth = 2.4;
      line(g, -11, -12, 10, 12); line(g, -3, -15, 16, 8);
      if (ch > 0.12) { g.fillStyle = burnt; ellipse(g, 4, -2, 7, 4); g.fill(); }
      g.restore();
    }
    g.restore();
  }
  g.restore();
}

function wrapText(g, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawHeartIcon(g, x, y, s, color) {
  g.save(); g.translate(x, y); g.scale(s / 10, s / 10);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, 4);
  g.bezierCurveTo(-10, -4, -9, -12, -3.5, -12);
  g.bezierCurveTo(-1, -12, 0, -10, 0, -8.5);
  g.bezierCurveTo(0, -10, 1, -12, 3.5, -12);
  g.bezierCurveTo(9, -12, 10, -4, 0, 4);
  g.fill();
  g.restore();
}
/* ------------------------------------------------------------ 3D runtime */
let CW = window.innerWidth, CH = window.innerHeight, DPR = 1;
const uiFx = [];
let lastEventId = 0;
let jenQState = { idx: 0, next: 4, high: false, low: false };
let cutHeartT = 0;
let lastStep3D = 0;
let sprayAcc = 0;

function resize3D() {
  CW = window.innerWidth; CH = window.innerHeight;
  DPR = Math.min(1.8, window.devicePixelRatio || 1);
  if (renderer) {
    renderer.setPixelRatio(DPR);
    renderer.setSize(CW, CH, false);
  }
  if (camera) { camera.aspect = CW / Math.max(1, CH); camera.updateProjectionMatrix(); }
  if (overlayCanvas) {
    overlayCanvas.width = Math.max(1, Math.round(CW * DPR));
    overlayCanvas.height = Math.max(1, Math.round(CH * DPR));
    overlayCanvas.style.width = CW + "px"; overlayCanvas.style.height = CH + "px";
    overlayCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
}
function projectPoint(x, y, z) {
  if (!camera) return { x: 0, y: 0, vis: false, dist: 99 };
  _v3.set(x, y, z);
  _v3b.copy(_v3).sub(camera.position);
  camera.getWorldDirection(_camDir);
  const front = _v3b.dot(_camDir) > 0;
  _v3.project(camera);
  return {
    x: (_v3.x * 0.5 + 0.5) * CW,
    y: (-_v3.y * 0.5 + 0.5) * CH,
    vis: front && _v3.z > -1 && _v3.z < 1,
    dist: _v3b.length(),
  };
}
function screenScale(dist, base = 3.4) { return clamp(base / Math.max(0.6, dist), 0.55, 1.18); }

/* ------------------------------------------------------------------ fire */
function updateFire3D(VG, time, dt) {
  for (let z = 0; z < VG.zones.length; z++) {
    const zn = VG.zones[z];
    const coal = clamp(zn.coal, 0, 1.15);
    const flame = clamp(zn.flame, 0, 1.8);
    const power = clamp(flame + coal * 0.62 + 0.14 - zn.wet * 0.65 + 0.03 * Math.sin(time * 3.2 + z * 1.7), 0, 1.9);
    // coals
    const cm = W3.coalMeshes[z];
    if (cm) {
      cm.mat.emissiveIntensity = 0.04 + coal * 0.95 + flame * 0.32;
      cm.mat.emissive.setRGB(1, 0.16 + coal * 0.12 + 0.03 * Math.sin(time * 2.2 + z * 2), 0.025);
      cm.mat.color.setRGB(0.09 + coal * 0.06, 0.055 + coal * 0.03, 0.04);
    }
    // light
    const light = W3.fireLights[z];
    if (light) {
      const flick = 0.88 + 0.12 * Math.sin(time * 9 + z * 2.3);
      light.intensity = (0.1 + coal * 1.35 + flame * 1.65) * flick;
      light.color.setHSL(0.045 + 0.012 * Math.sin(time * 4 + z), 1, 0.56);
    }
    // flames
    const flames = W3.flameSprites[z];
    if (flames) {
      for (let i = 0; i < flames.length; i++) {
        const f = flames[i];
        if (power < 0.045) { f.sp.visible = false; continue; }
        f.sp.visible = true;
        const pulse = 0.82 + 0.18 * Math.sin(time * 6 + f.phase);
        const sy = (0.34 + power * 0.82) * pulse;
        const sx = (0.11 + power * 0.17) * (0.86 + 0.14 * Math.sin(time * 7 + f.phase * 2));
        f.mat.opacity = clamp(0.12 + power * 0.3, 0, 0.68);
        f.sp.scale.set(sx, sy, 1);
        f.sp.position.x = zoneWorldX(z) + f.off + Math.sin(time * 3.4 + f.phase) * 0.075;
        f.sp.position.y = WORLD.grillY + sy * 0.42;
        f.sp.position.z = WORLD.braaiZ0 + 0.58 + f.zoff + Math.cos(time * 2.7 + f.phase) * 0.06;
      }
    }
    // wood logs
    const logs = W3.logMeshes[z];
    if (logs) {
      const n = Math.min(3, zn.logs.length);
      for (let k = 0; k < logs.length; k++) {
        const L = logs[k];
        L.group.visible = k < n;
        if (!L.group.visible) continue;
        const prog = 1 - clamp(zn.logs[k].ign / FIRE.ignite, 0, 1);
        L.body.emissiveIntensity = prog * 2.2;
        L.ends.forEach((m) => { m.emissiveIntensity = prog * 2.5; });
        L.body.color.setRGB(0.13 + prog * 0.1, 0.075 + prog * 0.05, 0.05);
      }
    }
    // particles
    const zx = zoneWorldX(z), zz = WORLD.braaiZ0 + 0.95;
    if (flame > 0.06 && Math.random() < dt * (5 + flame * 20)) spawnEmber3D(zx, WORLD.grillY + 0.18, zz, 2.7, 1);
    if (coal > 0.16 && Math.random() < dt * (2.5 + coal * 5)) spawnSmoke3D(zx + (Math.random() - 0.5) * 2.2, WORLD.grillY + 0.28, zz, 0.8 + coal * 0.7);
    if (zn.wet > 0.08 && Math.random() < dt * 16) spawnSteam3D(zx, WORLD.grillY + 0.12, zz);
  }
  // sparks and smoke from the meat
  for (let i = 0; i < VG.slots.length; i++) {
    const it = VG.slots[i];
    if (!it) continue;
    const h = zoneHeat(VG.zones[slotZone(i)]);
    if (h < 0.32) continue;
    const p = slotWorldPos(i);
    if (Math.random() < dt * (1.2 + h * 3.5)) spawnSpark3D(p.x, p.y + 0.12, p.z);
    if (it.ch > 0.38 && Math.random() < dt * 3.2) spawnSmoke3D(p.x, p.y + 0.18, p.z, 0.55, true);
  }
}

/* ----------------------------------------------------------------- slots */
function updateSlots3D(VG, time, dt) {
  for (let i = 0; i < SLOT_COUNT; i++) {
    const it = VG.slots[i];
    let vis = W3.slots[i];
    if (!it) { if (vis) vis.group.visible = false; continue; }
    if (!vis || vis.type !== it.type) {
      if (vis) { scene.remove(vis.group); disposeObj(vis.group); }
      const group = makeMeatMesh(it.type);
      const wp = slotWorldPos(i);
      group.position.copy(wp);
      group.rotation.y = ((i * 37) % 11 - 5) * 0.035;
      scene.add(group);
      vis = { type: it.type, group, baseRotY: group.rotation.y };
      W3.slots[i] = vis;
    }
    vis.group.visible = true;
    const total = it.a + it.b;
    applyMeatCook(vis.group, total, it.ch, it.type);
    const place = it.placeT > 0 ? 0.68 + 0.32 * easeOut(1 - it.placeT / 0.32) : 1;
    const flip = it.flipT > 0 ? Math.sin((1 - it.flipT / 0.28) * Math.PI) : 0;
    vis.group.scale.setScalar(place);
    vis.group.position.copy(slotWorldPos(i));
    vis.group.position.y += flip * 0.13;
    vis.group.rotation.x = -flip * 0.38;
    vis.group.rotation.y = vis.baseRotY + flip * 0.05;
    vis.group.rotation.z = Math.sin(time * 1.3 + i) * 0.014;
  }
}

/* --------------------------------------------------------------- players */
function updatePlayers3D(VG, time, dt, localId, isMenu) {
  const ids = new Set();
  for (const p of VG.players) {
    if (p.id === localId && !isMenu) continue;
    ids.add(p.id);
    let vis = W3.players.get(p.id);
    if (!vis) { vis = makeChef3D(p.id, p.color); scene.add(vis.group); W3.players.set(p.id, vis); }
    updateChefVisual(vis, p, time, dt);
  }
  for (const [id, vis] of Array.from(W3.players.entries())) {
    if (!ids.has(id)) { scene.remove(vis.group); disposeObj(vis.group); W3.players.delete(id); }
  }
}
function updateGuests3D(VG, time, dt) {
  const ids = new Set();
  for (const g of VG.guests) {
    ids.add(g.id);
    let vis = W3.guests.get(g.id);
    if (!vis) { vis = makeGuest3D(g); scene.add(vis.group); W3.guests.set(g.id, vis); }
    updateGuestVisual(vis, g, time, dt);
    let hb = guestHitboxes.get(g.id);
    if (!hb) {
      hb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.75, 0.65), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
      hb.userData = { kind: "g", i: g.id, active: true };
      scene.add(hb); targetMeshes.push(hb); guestHitboxes.set(g.id, hb);
    }
    const wp = guestWorldPos(g);
    hb.position.set(wp.x, wp.y + 0.92, wp.z);
    hb.userData.active = true;
  }
  for (const [id, hb] of guestHitboxes.entries()) {
    if (!ids.has(id)) { hb.userData.active = false; hb.position.y = -50; }
  }
  for (const [id, vis] of Array.from(W3.guests.entries())) {
    if (!ids.has(id)) { scene.remove(vis.group); disposeObj(vis.group); W3.guests.delete(id); }
  }
}
function updateJennifer3D(time, hype, cutscene) {
  updateJenniferVisual(time, hype, cutscene);
  if (W3.jennLight) {
    W3.jennLight.target.position.copy(jennWorldPos());
    W3.jennLight.intensity = 0.7 + (hyp3Mood(hype) === "flirty" ? 0.5 : 0);
  }
}
function hyp3Mood(hype) { return hype >= 78 ? "flirty" : hype >= 42 ? "watching" : "bored"; }
function updateCrowd3D(time) {
  for (const c of W3.crowd) {
    c.group.rotation.z = Math.sin(time * 0.75 + c.phase) * c.amp;
    c.group.position.y = Math.abs(Math.sin(time * 1.1 + c.phase)) * 0.025;
  }
}
function updateStrings3D(time) {
  for (const s of W3.strings) {
    const pulse = 0.72 + 0.28 * Math.sin(time * 2.1 + s.phase);
    s.glow.material.opacity = 0.32 + pulse * 0.3;
    s.glow.scale.setScalar(0.48 + pulse * 0.12);
  }
}

/* -------------------------------------------------------------- spray/fx */
function quadPoint(a, b, c, t, out) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z
  );
  return out;
}
function updateSpray3D(VG, time, dt, localId) {
  for (const p of VG.players) {
    const spraying = p.spraying || (p.id === localId && localInput.spray && p.water > 0.01);
    if (!spraying) continue;
    const z = clamp(p.id === localId ? localInput.sz : (p.sz | 0), 0, BRAAI.zoneCount - 1);
    const to = new THREE.Vector3(zoneWorldX(z), WORLD.grillY + 0.15, WORLD.braaiZ0 + 0.95);
    let from;
    if (p.id === localId && camera) {
      from = camera.position.clone();
      const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      from.addScaledVector(dir, 0.4).addScaledVector(right, 0.18);
      from.y -= 0.18;
    } else {
      const base = playerWorldPos(p);
      from = base.clone().add(new THREE.Vector3(0, 1.38, 0));
      const yaw = p.yaw || 0;
      from.x += -Math.sin(yaw) * 0.22;
      from.z += -Math.cos(yaw) * 0.22;
    }
    const mid = from.clone().lerp(to, 0.5); mid.y += 0.55;
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < 5; i++) {
      const t = Math.random();
      quadPoint(from, mid, to, t, a);
      quadPoint(from, mid, to, Math.min(1, t + 0.03), b);
      const vx = (b.x - a.x) * 12, vy = (b.y - a.y) * 12, vz = (b.z - a.z) * 12;
      PS.water.spawn(a.x, a.y, a.z, vx, vy, vz, 0.24, 0.045, [0.55, 0.86, 1]);
    }
    if (Math.random() < dt * 18) spawnSteam3D(to.x, to.y + 0.1, to.z);
  }
}
function updateParticles3D(dt) {
  for (const k of Object.keys(PS)) PS[k].update(dt);
  updateUiFx(dt);
}

/* ---------------------------------------------------------------- camera */
function updateCamera3D(VG, time, dt, localId, isMenu) {
  if (!camera) return;
  if (isMenu) {
    menuCamT += dt;
    const a = menuCamT * 0.085;
    camera.position.set(3.25 + Math.sin(a) * 0.35, 1.98 + Math.sin(menuCamT * 0.5) * 0.025, 2.15 + Math.cos(a * 0.7) * 0.12);
    camera.lookAt(5.7 + Math.sin(a * 0.6) * 0.3, 1.12, -2.0);
    camera.rotation.z = Math.sin(a * 0.4) * 0.005;
    return;
  }
  if (VG.phase === "won" && !resultsShown) {
    if (!winCamStarted) {
      winCamStarted = true;
      const p = VG.players.find((q) => q.id === localId);
      winCamStart = p ? playerWorldPos(p) : new THREE.Vector3(0, 0, 1.5);
      winCamStart.y = CAM.eye;
    }
    const t = VG.winT || 0;
    const target = new THREE.Vector3(wx(JEN.x), 1.58, WORLD.guestZ - 0.18);
    const start = winCamStart || new THREE.Vector3(0, CAM.eye, 1.5);
    const mid = new THREE.Vector3(wx(JEN.x) + 1.5, 2.75, 1.0);
    const end = new THREE.Vector3(wx(JEN.x) + 0.2, 1.62, WORLD.guestZ + 0.66);
    const u = smooth(clamp((t - 0.45) / 3.2, 0, 1));
    const pos = new THREE.Vector3(
      (1 - u) * (1 - u) * start.x + 2 * (1 - u) * u * mid.x + u * u * end.x,
      (1 - u) * (1 - u) * start.y + 2 * (1 - u) * u * mid.y + u * u * end.y,
      (1 - u) * (1 - u) * start.z + 2 * (1 - u) * u * mid.z + u * u * end.z
    );
    if (t > 3.6) { const v = smooth(clamp((t - 3.6) / 1.8, 0, 1)); pos.lerp(new THREE.Vector3(wx(JEN.x), 1.58, WORLD.guestZ + 0.44), v * 0.35); }
    camera.position.copy(pos);
    camera.lookAt(target.x, target.y + 0.03, target.z);
    camera.rotation.z += Math.sin(t * 1.3) * 0.006;
    if (t > 1.6) {
      cutHeartT -= dt;
      if (cutHeartT <= 0) {
        cutHeartT = 0.18;
        const hp = new THREE.Vector3(wx(JEN.x) + (Math.random() - 0.5) * 1.3, 1.4 + Math.random() * 0.9, WORLD.guestZ + (Math.random() - 0.5) * 0.6);
        spawnUiHeart(hp, Math.random() < 0.45 ? "#ff6f9e" : "#ffd56b", true);
      }
      if (W3.jenn) W3.jenn.rotation.x = lerp(W3.jenn.rotation.x, 0.055, 0.04);
    }
    return;
  }
  winCamStarted = false;
  if (W3.jenn) W3.jenn.rotation.x = lerp(W3.jenn.rotation.x, 0, 0.08);
  const p = VG.players.find((q) => q.id === localId);
  if (!p) {
    camera.position.set(0, CAM.eye, 1.5);
    camera.rotation.set(-0.18, 0, 0);
    return;
  }
  const bob = p.moving ? Math.sin((p.walk || 0) * 2.45) * 0.014 : Math.sin(time * 1.35) * 0.0035;
  const base = playerWorldPos(p);
  camera.position.set(base.x, CAM.eye + bob, base.z);
  const shake = shake3D > 0.001 ? shake3D : 0;
  if (shake) {
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake * 0.6;
    camera.position.z += (Math.random() - 0.5) * shake;
  }
  camera.rotation.set(viewPitch, viewYaw, -localInput.strafe * 0.012 + (shake ? (Math.random() - 0.5) * shake * 0.6 : 0));
  const wantFov = CAM.fov + (p.sprinting ? 4.5 : 0);
  if (Math.abs(camera.fov - wantFov) > 0.02) { camera.fov = lerp(camera.fov, wantFov, 0.12); camera.updateProjectionMatrix(); }
  shake3D = Math.max(0, shake3D - dt * 0.55);
  // footsteps
  if (p.moving && p.id === localId && time - lastStep3D > (p.sprinting ? 0.29 : 0.42)) {
    lastStep3D = time;
    sound.sfx("step", clamp((base.x) / 7, -1, 1));
  }
}

/* ----------------------------------------------------------- look target */
function guestAtId(id) { return G && G.guests ? G.guests.find((q) => q.id === id) : null; }
function updateLookTarget3D(VG) {
  lookTarget = null;
  if (!threeReady || mode !== "play" || !G || G.phase !== "playing") return;
  camera.updateMatrixWorld();
  raycaster.setFromCamera(centerNDC, camera);
  raycaster.far = 12;
  const hits = raycaster.intersectObjects(targetMeshes, false).filter((h) => h.object.userData && h.object.userData.kind && (h.object.userData.active !== false));
  let best = null;
  for (const h of hits) {
    if (h.object.userData.kind === "g" && h.object.userData.active === false) continue;
    best = h; break;
  }
  if (best) {
    const u = best.object.userData;
    if (u.kind === "s") {
      const it = VG.slots[u.i];
      const p = slotWorldPos(u.i);
      lookTarget = { k: "s", i: u.i, point: p, dist: best.distance, label: it ? `${MEATS[it.type].name} · ${qualityText(it)}` : "Empty spot" };
    } else if (u.kind === "g") {
      const gm = VG.guests.find((q) => q.id === u.i);
      if (gm) {
        const p = guestWorldPos(gm);
        lookTarget = { k: "g", i: u.i, point: new THREE.Vector3(p.x, p.y + 1.25, p.z), dist: best.distance, label: `${gm.name} · wants ${MEATS[gm.order].name}` };
      }
    } else if (u.kind === "w") {
      const p = new THREE.Vector3(wx(WOODPILE.x), 0.85, wzPlayer(WOODPILE.y));
      lookTarget = { k: "w", point: p, dist: best.distance, label: "Firewood" };
    } else if (u.kind === "b") {
      const p = new THREE.Vector3(wx(BIN.x), 0.65, wzPlayer(BIN.y));
      lookTarget = { k: "b", point: p, dist: best.distance, label: "Bin" };
    }
  }
  // aiming at the fire itself
  if (!lookTarget) {
    const hit = raycaster.ray.intersectPlane(_plane, _v3b);
    if (hit && Math.abs(hit.x) < 7.1 && hit.z > WORLD.braaiZ0 - 0.1 && hit.z < WORLD.braaiZ1 + 0.2) {
      const z = clamp(Math.floor((hit.x - WORLD.braaiX0) / ((WORLD.braaiX1 - WORLD.braaiX0) / BRAAI.zoneCount)), 0, BRAAI.zoneCount - 1);
      const zn = VG.zones[z];
      lookTarget = { k: "z", z, point: new THREE.Vector3(hit.x, WORLD.grillY + 0.15, hit.z), dist: camera.position.distanceTo(hit), label: `Fire zone ${z + 1}${zn.flame > 0.86 ? " · FLARE" : zn.coal < 0.16 ? " · COLD" : ""}` };
    }
  }
  // spray zone for input
  let sz = targetZoneIndex(lookTarget ? { k: lookTarget.k, i: lookTarget.i, z: lookTarget.z } : null);
  if (sz < 0) {
    const p = VG.players.find((q) => q.id === localId);
    sz = p ? nearestZone(p.x) : 0;
  }
  localInput.sz = clamp(sz, 0, BRAAI.zoneCount - 1);
  // actionability
  if (lookTarget && localPlayer()) {
    const p = localPlayer();
    const c = p.carry;
    if (lookTarget.k === "s") {
      const it = G.slots[lookTarget.i];
      lookTarget.actionable = nearBraai(p) && Math.abs(slotPos(lookTarget.i).x - p.x) <= 185 && (
        (c && c.k === "m" && !it) || (c && c.k === "w") || (!c && it)
      );
    } else if (lookTarget.k === "g") {
      const gm = guestAtId(lookTarget.i);
      lookTarget.actionable = !!(gm && c && c.k === "m" && gm.state === "waiting" && gm.order === c.t && canReachGuest(p, gm));
    } else if (lookTarget.k === "w") lookTarget.actionable = canReachProp(p, WOODPILE) && (!c || c.k === "w");
    else if (lookTarget.k === "b") lookTarget.actionable = canReachProp(p, BIN) && !!(c && c.k === "m");
    else if (lookTarget.k === "z") lookTarget.actionable = !!(c && c.k === "w") || !!localInput.spray;
  }
}

/* ----------------------------------------------------------------- UI fx */
function spawnUiHeart(pos, color = "#ff6f9e", big = false) {
  if (uiFx.length > 90) uiFx.shift();
  uiFx.push({
    kind: "heart", x: pos.x + (Math.random() - 0.5) * 0.25, y: pos.y, z: pos.z + (Math.random() - 0.5) * 0.25,
    vy: 0.55 + Math.random() * 0.5, life: 0, max: 1.1 + Math.random() * 1.1,
    size: (big ? 12 : 8) + Math.random() * 6, color,
  });
}
function spawnUiText(pos, text, color = "#ffe4b3", size = 15) {
  if (uiFx.length > 90) uiFx.shift();
  uiFx.push({ kind: "text", x: pos.x, y: pos.y, z: pos.z, vy: 0.75, life: 0, max: 1.45, size, color, text });
}
function updateUiFx(dt) {
  for (let i = uiFx.length - 1; i >= 0; i--) {
    const f = uiFx[i]; f.life += dt; f.y += f.vy * dt;
    if (f.life >= f.max) uiFx.splice(i, 1);
  }
}
function drawUiFx(g) {
  for (const f of uiFx) {
    const pr = projectPoint(f.x, f.y, f.z);
    if (!pr.vis || pr.dist > 18) continue;
    const k = f.life / f.max;
    const alpha = k < 0.12 ? k / 0.12 : 1 - Math.max(0, (k - 0.65) / 0.35);
    const s = screenScale(pr.dist, 4.6);
    g.save(); g.globalAlpha = clamp(alpha, 0, 1);
    if (f.kind === "heart") drawHeartIcon(g, pr.x, pr.y, f.size * s, f.color);
    else {
      g.textAlign = "center"; g.font = `800 ${f.size * s}px Outfit, sans-serif`;
      g.lineWidth = 3.5; g.strokeStyle = "rgba(12,7,4,.7)"; g.strokeText(f.text, pr.x, pr.y);
      g.fillStyle = f.color; g.fillText(f.text, pr.x, pr.y);
    }
    g.restore();
  }
}

/* ------------------------------------------------------------- events */
function eventWorldPos(e) {
  if (!THREE) return new THREE.Vector3();
  if (["perfect", "good", "raw", "over", "ruined", "guestleave", "streak"].includes(e.kind)) {
    let best = null, bd = 1e9;
    for (const g of (G.guests || [])) {
      const d = Math.abs(g.x - e.x) + Math.abs(g.y - e.y);
      if (d < bd) { bd = d; best = g; }
    }
    if (best) { const p = guestWorldPos(best); p.y = 1.55; return p; }
  }
  if (["place", "flip", "pick"].includes(e.kind)) {
    let best = 0, bd = 1e9;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const s = slotPos(i), d = Math.abs(s.x - e.x) + Math.abs(s.y - e.y);
      if (d < bd) { bd = d; best = i; }
    }
    const p = slotWorldPos(best); p.y += 0.3; return p;
  }
  if (["toss", "wood", "flare"].includes(e.kind)) {
    const z = clamp(Math.floor((e.x - BRAAI.x0) / ZONE_W), 0, BRAAI.zoneCount - 1);
    return new THREE.Vector3(zoneWorldX(z), WORLD.grillY + 0.35, WORLD.braaiZ0 + 0.9);
  }
  if (e.kind === "win") return new THREE.Vector3(wx(JEN.x), 1.7, WORLD.guestZ);
  if (e.kind === "lose") return new THREE.Vector3(0, 1.7, 0);
  return new THREE.Vector3(wx(e.x), 1.5, WORLD.braaiZ0 + 0.8);
}
function flashScreen(color = "#fff3d8") {
  const el = $("flash");
  if (!el) return;
  el.style.background = color;
  el.classList.remove("go");
  void el.offsetWidth;
  el.classList.add("go");
}
function handleEvent3D(e) {
  const p = eventWorldPos(e);
  const pan = clamp((p.x) / 7, -1, 1);
  switch (e.kind) {
    case "perfect":
      for (let i = 0; i < 10; i++) spawnUiHeart(p, i % 3 ? "#ffd56b" : "#ff6f9e", true);
      spawnUiText(p, "PERFECT!", "#a8e063", 22);
      flashScreen("rgba(255,235,190,.55)");
      sound.sfx("perfect", pan);
      break;
    case "good":
      for (let i = 0; i < 4; i++) spawnUiHeart(p, "#ffd56b");
      spawnUiText(p, "GOOD", "#ffd56b", 16);
      sound.sfx("good", pan);
      break;
    case "raw": spawnUiText(p, "RAW!", "#ff8f9c", 20); sound.sfx("raw", pan); break;
    case "over": spawnUiText(p, "OVERCOOKED", "#ff8a66", 17); sound.sfx("over", pan); break;
    case "ruined":
      spawnUiText(p, "RUINED", "#ff5c46", 20);
      for (let i = 0; i < 8; i++) spawnSmoke3D(p.x, p.y, p.z, 0.7, true);
      sound.sfx("ruined", pan);
      break;
    case "guestleave":
      spawnUiText(p, "LEFT HUNGRY", "#c4b2a0", 13);
      sound.sfx("guestleave", pan);
      break;
    case "flare":
      shake3D = Math.max(shake3D, 0.18);
      flashScreen("rgba(255,110,40,.5)");
      for (let i = 0; i < 26; i++) spawnEmber3D(p.x, p.y, p.z, 2.5, 1.4);
      for (let i = 0; i < 12; i++) spawnSmoke3D(p.x, p.y, p.z, 1.5, true);
      sound.sfx("flare", pan);
      break;
    case "toss":
      for (let i = 0; i < 18; i++) spawnEmber3D(p.x, p.y, p.z, 1.4, 1.2);
      sound.sfx("toss", pan);
      break;
    case "wood": sound.sfx("wood", pan); break;
    case "place":
      sound.sfx("place", pan);
      for (let i = 0; i < 7; i++) spawnSpark3D(p.x, p.y, p.z);
      break;
    case "flip":
      sound.sfx("flip", pan);
      for (let i = 0; i < 6; i++) spawnSpark3D(p.x, p.y, p.z);
      break;
    case "pick":
      sound.sfx("pick", pan);
      if (e.txt) spawnUiText(p, e.txt.toUpperCase(), e.txt === "Perfect" ? "#a8e063" : "#ffe4b3", 12);
      break;
    case "grab": sound.sfx("grab", pan); break;
    case "bin": sound.sfx("wood", pan); break;
    case "hint": sound.sfx("select", pan); toast(e.txt); break;
    case "streak": sound.sfx("perfect", pan); break;
    case "emote": sound.sfx("emote", pan); break;
    case "win":
      sound.sfx("win");
      flashScreen("rgba(255,220,230,.6)");
      for (let i = 0; i < 26; i++) spawnUiHeart(new THREE.Vector3(6.9, 1.4 + Math.random() * 1.2, WORLD.guestZ + 0.4), i % 2 ? "#ff6f9e" : "#ffd56b", true);
      break;
    case "lose": sound.sfx("lose"); break;
  }
}
function processEvents(G) {
  if (!G || !G.events) return;
  for (const e of G.events) {
    if (e.id <= lastEventId) continue;
    lastEventId = e.id;
    handleEvent3D(e);
    if (e.kind === "flare") banner("FLARE-UP!", "Back away and spray it", "#ff9258");
    else if (e.kind === "guestleave") banner("GUEST LEFT", "The vibe takes a knock", "#d8c4b0");
    else if (e.kind === "streak") banner(`${e.txt} PERFECT IN A ROW`, "The party is loving it", "#ffd56b");
  }
}

/* --------------------------------------------------------- world update */
function updateWorld3D(VG, time, dt, localId, isMenu) {
  updateFire3D(VG, time, dt);
  updateSlots3D(VG, time, dt);
  updatePlayers3D(VG, time, dt, localId, isMenu);
  updateGuests3D(VG, time, dt);
  updateJennifer3D(time, VG.hype, !isMenu && VG.phase === "won" && !resultsShown);
  updateCrowd3D(time);
  updateStrings3D(time);
  updateSpray3D(VG, time, dt, localId);
  updateParticles3D(dt);
  updateHands3D(VG, localId, time, dt, !isMenu, !isMenu && VG.phase === "won" && !resultsShown);
  // fireflies
  if (Math.random() < dt * 7) {
    const f = W3.fireflies[(Math.random() * W3.fireflies.length) | 0];
    if (f) PS.fireflies.spawn(f.x + Math.sin(f.p + time) * f.amp, f.y + Math.cos(f.p * 0.8 + time) * f.amp * 0.5, f.z, (Math.random() - 0.5) * 0.1, 0.04 + Math.random() * 0.06, (Math.random() - 0.5) * 0.1, 2.4, 0.17, [1, 0.86, 0.4]);
  }
}

/* -------------------------------------------------------------- overlay */
function jenQuote3D(G, time) {
  if (G.phase === "menu") return JEN_QUOTES[0];
  if (time > jenQState.next) {
    jenQState.next = time + 8.5;
    const high = G.hype >= 70, low = G.hype < 35;
    const list = high ? JEN_HIGH : low ? JEN_LOW : JEN_QUOTES;
    jenQState.idx = (jenQState.idx + 1 + ((Math.random() * 3) | 0)) % list.length;
    jenQState.high = high; jenQState.low = low;
  }
  const list = jenQState.high ? JEN_HIGH : jenQState.low ? JEN_LOW : JEN_QUOTES;
  return list[jenQState.idx % list.length];
}
function drawPill(g, x, y, text, color, s = 1, align = "center") {
  g.save();
  g.font = `700 ${11 * s}px Outfit, sans-serif`;
  g.textAlign = align;
  const w = g.measureText(text).width + 18 * s;
  g.fillStyle = "rgba(13,9,7,.8)";
  rr(g, x - (align === "center" ? w / 2 : align === "right" ? w : 0), y - 9 * s, w, 19 * s, 9 * s); g.fill();
  g.strokeStyle = "rgba(255,255,255,.09)"; g.lineWidth = 1; rr(g, x - (align === "center" ? w / 2 : align === "right" ? w : 0), y - 9 * s, w, 19 * s, 9 * s); g.stroke();
  g.fillStyle = color || "#fff3de"; g.fillText(text, x, y + 4 * s);
  g.restore();
}
function drawGaugeScreen(g, x, y, s, it) {
  const d = MEATS[it.type];
  const total = it.a + it.b, ch = it.ch || 0;
  const q = qualityOf(it);
  const w = 70 * s, h = 4.6 * s;
  const lo = inv(0, 1.08, d.lo), hi = inv(0, 1.08, d.hi);
  g.save();
  g.fillStyle = "rgba(9,6,4,.78)"; rr(g, x - w / 2 - 2 * s, y - 2 * s, w + 4 * s, h + 4 * s, 3 * s); g.fill();
  g.strokeStyle = q === "perfect" ? "rgba(180,255,130,.9)" : "rgba(255,225,190,.18)"; g.lineWidth = 1;
  rr(g, x - w / 2 - 2 * s, y - 2 * s, w + 4 * s, h + 4 * s, 3 * s); g.stroke();
  g.fillStyle = "rgba(139,212,80,.38)"; g.fillRect(x - w / 2 + w * lo, y, w * (hi - lo), h);
  const fill = clamp(total / 1.08, 0, 1);
  const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, "#e07a7d"); gr.addColorStop(0.55, "#b76c3a"); gr.addColorStop(1, "#5c2f18");
  g.fillStyle = q === "perfect" ? "rgba(168,224,99,.95)" : gr;
  g.fillRect(x - w / 2, y, w * fill, h);
  g.fillStyle = "rgba(255,240,210,.95)"; g.fillRect(x - w / 2 + w * fill - 1, y - 2 * s, 2, h + 4 * s);
  if (ch > 0.18) { g.fillStyle = `rgba(22,14,10,${0.18 + ch * 0.5})`; g.fillRect(x - w / 2, y, w, h); }
  if (q === "perfect") {
    g.fillStyle = "#c6ff8f"; g.font = `800 ${7.5 * s}px Outfit, sans-serif`; g.textAlign = "center";
    g.fillText("READY", x, y + 13 * s);
  } else if (ch > 0.45) {
    g.fillStyle = "#ff6a4d"; g.font = `800 ${7.5 * s}px Outfit, sans-serif`; g.textAlign = "center";
    g.fillText("BURNING", x, y + 13 * s);
  }
  g.restore();
}
function drawGuestBubbleScreen(g, guest, time) {
  if (guest.state === "leaving") return;
  const wp = guestWorldPos(guest);
  const pr = projectPoint(wp.x, wp.y + 1.98, wp.z);
  if (!pr.vis || pr.dist > 16) return;
  const s = screenScale(pr.dist, 3.7);
  const x = pr.x, y = pr.y;
  const w = 126 * s, h = 46 * s;
  const d = MEATS[guest.order] || MEATS[0];
  g.save();
  g.fillStyle = "rgba(20,13,9,.9)";
  g.beginPath(); g.moveTo(x - 6 * s, y - 1); g.lineTo(x + 1 * s, y + 8 * s); g.lineTo(x + 7 * s, y - 1); g.closePath(); g.fill();
  const bg = g.createLinearGradient(0, y - h, 0, y);
  bg.addColorStop(0, "rgba(43,28,20,.96)"); bg.addColorStop(1, "rgba(16,10,7,.96)");
  g.fillStyle = bg; rr(g, x - w / 2, y - h, w, h, 10 * s); g.fill();
  g.strokeStyle = "rgba(255,224,186,.18)"; g.lineWidth = 1; rr(g, x - w / 2, y - h, w, h, 10 * s); g.stroke();
  // meat icon
  g.save();
  g.beginPath(); rr(g, x - w / 2 + 6 * s, y - h + 7 * s, 34 * s, 30 * s, 7 * s); g.clip();
  g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x - w / 2 + 6 * s, y - h + 7 * s, 34 * s, 30 * s);
  drawMeat(g, guest.order, x - w / 2 + 23 * s, y - h + 23 * s, 0.31 * s, { a: d.hi * 0.5, b: d.hi * 0.4, ch: 0, flipT: 0, placeT: 0 }, time);
  g.restore();
  g.strokeStyle = d.accent; g.globalAlpha = 0.35; g.lineWidth = 1; rr(g, x - w / 2 + 6 * s, y - h + 7 * s, 34 * s, 30 * s, 7 * s); g.stroke(); g.globalAlpha = 1;
  g.textAlign = "left";
  g.fillStyle = "rgba(255,240,220,.55)"; g.font = `700 ${7.5 * s}px Outfit, sans-serif`;
  g.fillText(guest.name.toUpperCase(), x - w / 2 + 47 * s, y - h + 17 * s);
  g.fillStyle = "#fff1da"; g.font = `700 ${11 * s}px Outfit, sans-serif`;
  g.fillText(d.name, x - w / 2 + 47 * s, y - h + 31 * s);
  if (guest.state === "waiting") {
    const ratio = clamp(guest.patience / (guest.maxPat || 1), 0, 1);
    const col = ratio > 0.55 ? "#8bd450" : ratio > 0.25 ? "#ffb24a" : "#ff5c46";
    g.fillStyle = "rgba(0,0,0,.45)"; rr(g, x - w / 2 + 7 * s, y - 8 * s, w - 14 * s, 3.5 * s, 2 * s); g.fill();
    g.fillStyle = col; rr(g, x - w / 2 + 7 * s, y - 8 * s, (w - 14 * s) * ratio, 3.5 * s, 2 * s); g.fill();
  } else if (guest.state === "happy") {
    g.fillStyle = "#a8e063"; g.font = `800 ${7.5 * s}px Outfit, sans-serif`; g.textAlign = "center";
    g.fillText(guest.reactText || "LEKKER!", x, y - 6 * s);
  } else if (guest.state === "angry") {
    g.fillStyle = "#ff6a4d"; g.font = `800 ${7.5 * s}px Outfit, sans-serif`; g.textAlign = "center";
    g.fillText(guest.reactText || "EISH!", x, y - 6 * s);
  } else if (guest.state === "walkin") {
    g.fillStyle = "rgba(255,240,220,.5)"; g.font = `800 ${9 * s}px Outfit, sans-serif`; g.textAlign = "center";
    g.fillText("…", x, y - 6 * s);
  }
  g.restore();
}
function drawNameTagScreen(g, p, isDemo) {
  const wp = playerWorldPos(p);
  const pr = projectPoint(wp.x, wp.y + 2.16, wp.z);
  if (!pr.vis || pr.dist > 18) return;
  const s = screenScale(pr.dist, 3.6);
  g.save();
  g.textAlign = "center";
  g.font = `700 ${10.5 * s}px Outfit, sans-serif`;
  const name = p.name || "Chef";
  const tw = Math.max(32, g.measureText(name).width + 16 * s);
  g.fillStyle = "rgba(13,9,7,.76)"; rr(g, pr.x - tw / 2, pr.y - 9 * s, tw, 18 * s, 9 * s); g.fill();
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; rr(g, pr.x - tw / 2, pr.y - 9 * s, tw, 18 * s, 9 * s); g.stroke();
  g.fillStyle = p.color || "#ffb24a"; g.fillText(name, pr.x, pr.y + 4 * s);
  g.restore();
}
function drawJenniferOverlay(g, G, time) {
  const wp = jennWorldPos();
  const pr = projectPoint(wp.x, 2.22, wp.z);
  if (!pr.vis || pr.dist > 22) return;
  const s = screenScale(pr.dist, 4.2);
  g.save();
  g.textAlign = "center"; g.font = `800 ${9.5 * s}px Outfit, sans-serif`;
  const tw = g.measureText("JENNIFER").width + 24 * s;
  g.fillStyle = "rgba(24,12,18,.8)"; rr(g, pr.x - tw / 2, pr.y - 9 * s, tw, 18 * s, 9 * s); g.fill();
  g.strokeStyle = "rgba(255,120,170,.35)"; g.lineWidth = 1; rr(g, pr.x - tw / 2, pr.y - 9 * s, tw, 18 * s, 9 * s); g.stroke();
  g.fillStyle = "#ffb9c8"; g.fillText("JENNIFER", pr.x, pr.y + 4 * s);
  const q = jenQuote3D(G, time);
  if (q) {
    g.font = `600 ${10.5 * s}px Outfit, sans-serif`;
    const lines = wrapText(g, q, 180 * s);
    const bw = 205 * s, bh = (17 + lines.length * 13) * s;
    const bx = pr.x - 26 * s, by = pr.y + 13 * s;
    g.fillStyle = "rgba(26,14,20,.88)"; rr(g, bx - bw / 2, by, bw, bh, 10 * s); g.fill();
    g.strokeStyle = "rgba(255,130,175,.22)"; g.lineWidth = 1; rr(g, bx - bw / 2, by, bw, bh, 10 * s); g.stroke();
    g.beginPath(); g.moveTo(bx - 5 * s, by + bh); g.lineTo(bx + 2 * s, by + bh + 7 * s); g.lineTo(bx + 7 * s, by + bh); g.closePath(); g.fill();
    g.fillStyle = "#ffd7e0"; g.textAlign = "center";
    lines.forEach((ln, i) => g.fillText(ln, bx, by + 15 * s + i * 13 * s));
  }
  g.restore();
}
function drawTargetOverlay(g) {
  if (!lookTarget) return;
  const pr = projectPoint(lookTarget.point.x, lookTarget.point.y, lookTarget.point.z);
  if (!pr.vis) return;
  const gold = !!lookTarget.actionable;
  const col = gold ? "rgba(255,197,92,.95)" : "rgba(255,240,215,.55)";
  const s = screenScale(pr.dist, 2.8);
  g.save();
  g.strokeStyle = col; g.lineWidth = 1.6;
  g.beginPath(); g.arc(pr.x, pr.y, 24 * s, 0, TAU); g.stroke();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    g.beginPath();
    g.moveTo(pr.x + Math.cos(a) * 20 * s, pr.y + Math.sin(a) * 20 * s);
    g.lineTo(pr.x + Math.cos(a) * 30 * s, pr.y + Math.sin(a) * 30 * s);
    g.stroke();
  }
  g.restore();
  if (lookTarget.label) {
    const isTouchNow = typeof isTouch !== "undefined" && isTouch;
    const label = lookTarget.label;
    g.save();
    g.font = "700 9px Outfit, sans-serif";
    const w = g.measureText(label).width + 16;
    g.fillStyle = "rgba(13,9,7,.78)"; rr(g, CW / 2 - w / 2, CH / 2 + 26, w, 18, 9); g.fill();
    g.strokeStyle = gold ? "rgba(255,190,90,.4)" : "rgba(255,255,255,.1)"; g.lineWidth = 1;
    rr(g, CW / 2 - w / 2, CH / 2 + 26, w, 18, 9); g.stroke();
    g.fillStyle = gold ? "#ffd68a" : "rgba(255,240,220,.78)"; g.textAlign = "center";
    g.fillText(label, CW / 2, CH / 2 + 39);
    g.restore();
  }
}
function drawCutsceneOverlay(g, G, time) {
  if (resultsShown || G.phase !== "won") return;
  const t = G.winT || 0;
  const a = clamp((t - 1.15) / 0.7, 0, 1);
  g.save();
  g.globalAlpha = a;
  g.textAlign = "center";
  g.font = '400 50px "Alfa Slab One", Impact, serif';
  const gr = g.createLinearGradient(0, 90, 0, 150);
  gr.addColorStop(0, "#fff6e0"); gr.addColorStop(0.6, "#ffc25e"); gr.addColorStop(1, "#ff7f39");
  g.fillStyle = gr;
  g.fillText("JENNIFER ANISTON IS", CW / 2, 108);
  g.fillText("MAKING OUT WITH YOU", CW / 2, 158);
  g.font = "700 11px Outfit, sans-serif"; g.fillStyle = "#ffd6df";
  g.fillText("THE BOEREWORS IS ON FIRE. WORTH IT.", CW / 2, 186);
  g.restore();
  // hearts around the action
  g.save();
  for (let i = 0; i < 14; i++) {
    const ang = time * 0.9 + i * 2.1;
    const hx = CW / 2 + Math.sin(ang) * (180 + i * 9);
    const hy = CH * 0.48 + Math.cos(ang * 0.8) * 120 - ((time * 24 + i * 17) % 100);
    g.globalAlpha = 0.35 + 0.35 * Math.sin(time * 3 + i);
    drawHeartIcon(g, hx, hy, 6 + (i % 3) * 3, i % 2 ? "#ffd56b" : "#ff8da9");
  }
  g.restore();
  if (t > 5.15) {
    const f1 = clamp((t - 5.15) / 0.45, 0, 1);
    g.fillStyle = `rgba(255,190,210,${f1 * 0.38})`; g.fillRect(0, 0, CW, CH);
    const f2 = clamp((t - 5.55) / 0.8, 0, 1);
    g.fillStyle = `rgba(4,2,3,${f2})`; g.fillRect(0, 0, CW, CH);
  }
}
function drawOverlay(VG, time, dt, localId, isMenu) {
  const g = overlayCtx;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, CW, CH);
  if (!threeReady) return;
  if (!isMenu && VG.phase === "won" && !resultsShown) {
    drawCutsceneOverlay(g, VG, time);
    return;
  }
  if (!isMenu && VG.phase !== "playing") return;
  // gauges
  for (let i = 0; i < SLOT_COUNT; i++) {
    const it = VG.slots[i];
    if (!it) continue;
    const wp = slotWorldPos(i); wp.y += 0.43;
    const pr = projectPoint(wp.x, wp.y, wp.z);
    if (!pr.vis || pr.dist > 13) continue;
    drawGaugeScreen(g, pr.x, pr.y, screenScale(pr.dist, 3.3), it);
  }
  // guest bubbles far to near
  const bubbles = [];
  for (const gm of VG.guests) {
    if (gm.state === "leaving") continue;
    const wp = guestWorldPos(gm);
    const pr = projectPoint(wp.x, wp.y + 1.98, wp.z);
    if (!pr.vis || pr.dist > 16) continue;
    bubbles.push({ gm, dist: pr.dist });
  }
  bubbles.sort((a, b) => b.dist - a.dist);
  for (const b of bubbles) drawGuestBubbleScreen(g, b.gm, time);
  // player tags
  for (const p of VG.players) {
    if (p.id === localId && !isMenu) continue;
    drawNameTagScreen(g, p, isMenu);
  }
  drawJenniferOverlay(g, G, time);
  drawUiFx(g);
  if (!isMenu) drawTargetOverlay(g);
}
function updateCrosshairAndLook() {
  const playing = mode === "play" && G && G.phase === "playing" && !resultsShown;
  const ch = $("crosshair");
  if (ch) ch.hidden = !playing || (!isTouch && !pointerLocked && !pointerLockFailed);
  const el = $("lookoverlay");
  if (!el) return;
  const show = playing && !isTouch && !pointerLocked && !pointerLockFailed;
  if (show !== lookOverlayShown) {
    lookOverlayShown = show;
    el.hidden = !show;
  }
}
function render3DFrame(VG, time, dt, localId, isMenu) {
  if (!threeReady) return;
  updateWorld3D(VG, time, dt, localId, isMenu);
  updateCamera3D(VG, time, dt, localId, isMenu);
  updateLookTarget3D(VG);
  updateCrosshairAndLook();
  renderer.render(scene, camera);
  drawOverlay(VG, time, dt, localId, isMenu);
}

/* --------------------------------------------------------- pointer lock */
function requestLookLock() {
  if (isTouch || !threeReady || mode !== "play") return;
  if (!canvas.requestPointerLock) { pointerLockFailed = true; updateCrosshairAndLook(); return; }
  try {
    const p = canvas.requestPointerLock();
    if (p && p.catch) p.catch(() => { pointerLockFailed = true; updateCrosshairAndLook(); toast("Drag to look around"); });
  } catch (e) {
    pointerLockFailed = true;
    updateCrosshairAndLook();
    toast("Drag to look around");
  }
}
function exitLookLock() {
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
}
function setupLookControls() {
  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === canvas;
    updateCrosshairAndLook();
  });
  document.addEventListener("pointerlockerror", () => {
    pointerLockFailed = true;
    updateCrosshairAndLook();
    toast("Drag to look around");
  });
  document.addEventListener("mousemove", (e) => {
    if (mode !== "play" || isTouch) return;
    if (pointerLocked) {
      viewYaw -= e.movementX * CAM.sens;
      viewPitch = clamp(viewPitch - e.movementY * CAM.sens, -1.24, 1.24);
    } else if (dragLook) {
      viewYaw -= (e.clientX - dragX) * CAM.sens * 0.9;
      viewPitch = clamp(viewPitch - (e.clientY - dragY) * CAM.sens * 0.9, -1.24, 1.24);
      dragX = e.clientX; dragY = e.clientY;
    }
  });
  let lookPointer = null, lookX = 0, lookY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    if (mode !== "play") return;
    if (e.pointerType === "touch") {
      if (lookPointer !== null) return;
      lookPointer = e.pointerId; lookX = e.clientX; lookY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    } else if (e.button === 0 && !pointerLocked) {
      if (pointerLockFailed) { dragLook = true; dragX = e.clientX; dragY = e.clientY; }
      else requestLookLock();
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" && e.pointerId === lookPointer) {
      viewYaw -= (e.clientX - lookX) * CAM.touchSens;
      viewPitch = clamp(viewPitch - (e.clientY - lookY) * CAM.touchSens, -1.24, 1.24);
      lookX = e.clientX; lookY = e.clientY;
    }
  });
  const endLook = (e) => {
    if (e.pointerType === "touch" && e.pointerId === lookPointer) lookPointer = null;
    if (e.pointerType !== "touch") dragLook = false;
  };
  canvas.addEventListener("pointerup", endLook);
  canvas.addEventListener("pointercancel", endLook);
  window.addEventListener("contextmenu", (e) => { if (mode === "play") e.preventDefault(); });
  const box = document.querySelector(".lookbox");
  if (box) box.addEventListener("click", (e) => { e.preventDefault(); requestLookLock(); });
}
function serializeTarget(t) {
  if (!t) return null;
  if (t.k === "s") return { k: "s", i: t.i };
  if (t.k === "g") return { k: "g", i: t.i };
  if (t.k === "w") return { k: "w" };
  if (t.k === "b") return { k: "b" };
  if (t.k === "z") return { k: "z", z: t.z };
  return null;
}
/* ------------------------------------------------------------------ input */
const keys = new Set();
const localInput = { fwd: 0, strafe: 0, yaw: 0, pitch: 0, sprint: false, spray: false, sz: 0 };
let touchInput = { x: 0, y: 0, active: false };
let touchSpray = false;
let selectedMeat = 0;
let myName = "Braai Master";
let mode = "menu";
let G = makeDemo();
let VG = G;
let myId = "solo";
let localId = "solo";
let isHost = true;
let net = null, netCode = "", netReady = false, stateJoined = false;
let netInputs = {};
let lastActSeq = {};
let actSeq = 0;
let pred = { x: 800, y: 760 };
let predReady = false;
let lastSnapSeq = -1;
let joinTimer = null;
let netSendAcc = 0, netInputAcc = 0;
let resultsShown = false, forceResults = false;
let introFlags = { a: false, b: false, perfect: false, cold: false };
let lastToast = "";
let menuDemoT = 0;
let muted = false;

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function sanitizeName(s) {
  return String(s || "").replace(/[<>&"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 14);
}
function hashCode() {
  const c = decodeURIComponent((location.hash || "").slice(1)).toUpperCase();
  return /^[A-Z0-9]{4,8}$/.test(c) ? c : "";
}
function newCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += A[(Math.random() * A.length) | 0];
  return s;
}
function setUrl(code) { try { history.replaceState(null, "", "#" + code); } catch (e) {} }
function clearUrl() { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
/* ------------------------------------------------------------------- net */
function createNet(code, hosting) {
  return new Promise((resolve) => {
    if (typeof Peer !== "function") { resolve({ error: "no-peerjs" }); return; }
    let settled = false;
    const api = {
      code, hosting, peer: null, id: hosting ? "host" : null, cb: {}, conns: new Map(),
      pendingJoins: [], pendingLeaves: [], lastState: null,
      send(msg) { for (const c of this.conns.values()) if (c.open) { try { c.send(msg); } catch (e) {} } },
      close() { try { this.peer && this.peer.destroy(); } catch (e) {} },
    };
    const finish = (v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } };
    const timer = setTimeout(() => {
      finish({ error: "timeout" });
      try { api.peer && api.peer.destroy(); } catch (e) {}
    }, 13000);
    let peer;
    try {
      peer = new Peer(hosting ? "braaimaster-" + code : undefined, { debug: 0 });
    } catch (e) { finish({ error: "peer-init" }); return; }
    api.peer = peer;
    peer.on("error", (e) => {
      const type = (e && e.type) || "error";
      if (!settled) {
        finish({ error: type });
        try { peer.destroy(); } catch (e2) {}
      } else if (!hosting && type !== "peer-unavailable" && type !== "disconnected") {
        api.cb.lost && api.cb.lost(type);
      }
    });
    peer.on("disconnected", () => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) {} });
    if (hosting) {
      peer.on("open", () => finish(api));
      peer.on("connection", (conn) => {
        api.conns.set(conn.peer, conn);
        conn.on("data", (m) => {
          if (!m || typeof m !== "object") return;
          if (m.t === "hello") {
            conn.send({ t: "welcome", id: conn.peer });
            if (api.cb.join) api.cb.join(conn.peer, sanitizeName(m.name));
            else api.pendingJoins.push([conn.peer, sanitizeName(m.name)]);
          } else if (m.t === "in") {
            api.cb.input && api.cb.input(conn.peer, m.d);
          } else if (m.t === "restart") {
            api.cb.restart && api.cb.restart(conn.peer);
          }
        });
        const drop = () => {
          if (api.conns.delete(conn.peer)) {
            if (api.cb.leave) api.cb.leave(conn.peer);
            else api.pendingLeaves.push(conn.peer);
          }
        };
        conn.on("close", drop);
        conn.on("error", drop);
      });
    } else {
      let hostConn = null;
      peer.on("open", (id) => {
        api.id = id;
        try {
          hostConn = peer.connect("braaimaster-" + code, { serialization: "json", reliable: true });
        } catch (e) { finish({ error: "connect" }); return; }
        hostConn.on("open", () => { try { hostConn.send({ t: "hello", name: myName }); } catch (e) {} });
        hostConn.on("data", (m) => {
          if (!m || typeof m !== "object") return;
          if (m.t === "welcome") { api.id = m.id; finish(api); }
          else if (m.t === "state") { api.lastState = m.d; if (api.cb.state) api.cb.state(m.d); }
        });
        hostConn.on("close", () => { api.cb.lost && api.cb.lost("host left"); });
        hostConn.on("error", () => { api.cb.lost && api.cb.lost("connection error"); });
      });
      api.sendInput = (d) => { if (hostConn && hostConn.open) { try { hostConn.send({ t: "in", d }); } catch (e) {} } };
      api.restart = () => { if (hostConn && hostConn.open) { try { hostConn.send({ t: "restart" }); } catch (e) {} } };
      api.close = () => { try { hostConn && hostConn.close(); } catch (e) {} try { peer.destroy(); } catch (e) {} };
    }
  });
}

function bindHostNet(n) {
  n.cb.join = (id, name) => {
    addNetPlayer(id, name);
    sound.sfx("join");
    toast(`${name} joined the braai`);
    updateRoster(true);
    netSendAcc = 1;
  };
  n.cb.leave = (id) => {
    const p = G.players.find((q) => q.id === id);
    G.players = G.players.filter((q) => q.id !== id);
    delete netInputs[id];
    if (p) toast(`${p.name} left the braai`);
    updateRoster(true);
  };
  n.cb.input = (id, d) => {
    if (!d || typeof d !== "object") return;
    netInputs[id] = {
      fwd: finite(d.fwd, finite(d.dy)), strafe: finite(d.strafe, finite(d.dx)),
      yaw: finite(d.yaw), pitch: finite(d.pitch), sprint: !!d.sprint,
      sz: Number.isInteger(d.sz) ? clamp(d.sz, 0, BRAAI.zoneCount - 1) : 0,
      spray: !!d.spray, at: performance.now(),
    };
    if (d.a && Number.isFinite(d.seq) && d.seq > (lastActSeq[id] || 0)) {
      lastActSeq[id] = d.seq;
      applyRemoteAction(id, d);
    }
  };
  n.cb.restart = () => { if (G.phase !== "playing") restartHost(); };
  n.cb.lost = () => {};
  if (n.pendingJoins.length) {
    const list = n.pendingJoins.slice();
    n.pendingJoins.length = 0;
    for (const [id, name] of list) n.cb.join(id, name);
  }
  if (n.pendingLeaves.length) {
    const list = n.pendingLeaves.slice();
    n.pendingLeaves.length = 0;
    for (const id of list) n.cb.leave(id);
  }
}
function bindGuestNet(n) {
  n.cb.state = (s) => onGuestState(s);
  n.cb.lost = () => guestLost();
  if (n.lastState) { const s = n.lastState; n.lastState = null; onGuestState(s); }
}
function addNetPlayer(id, name) {
  if (G.players.some((p) => p.id === id)) return;
  const i = G.players.length;
  const p = makePlayer(id, name || "Chef", PLAYER_COLORS[i % PLAYER_COLORS.length], clamp(700 + (i - 1) * 95, 300, 1300), 760 + (i % 2) * 22);
  p.joinT = 1.3;
  G.players.push(p);
}
function applyRemoteAction(id, d) {
  const kind = String(d.a || "");
  if (kind === "use") doUse(G, id, d.target || null);
  else if (kind === "flip") doFlip(G, id, d.target || null);
  else if (kind === "grab") doGrab(G, id, d.m);
  else if (kind === "emote") doEmote(G, id, sanitizeName(d.txt).slice(0, 18));
  else if (kind === "again") { if (G.phase !== "playing") restartHost(); }
}
function doEmote(G, id, txt) {
  const p = playerOf(G, id);
  if (!p) return;
  p.emote = txt || pick(["Lekker!", "Kom ons braai!", "Chef's kiss", "Hot hot hot!", "Who's hungry?", "Boerie time!"]);
  p.emoteT = 1.7;
  pushEvent(G, "emote", p.x, p.y, "");
  sound.sfx("emote");
}
function hostBroadcast(dt) {
  if (!net || !netReady) return;
  netSendAcc += dt;
  if (netSendAcc < 0.05) return;
  netSendAcc = 0;
  net.send({ t: "state", d: packState(G) });
}
function guestSend(action) {
  if (!net || isHost || !netReady) return;
  actSeq++;
  const d = {
    fwd: localInput.fwd, strafe: localInput.strafe,
    yaw: localInput.yaw, pitch: localInput.pitch, sprint: localInput.sprint ? 1 : 0,
    sz: localInput.sz, spray: localInput.spray ? 1 : 0,
    a: action ? action.a : null, m: action && Number.isFinite(action.m) ? action.m : selectedMeat,
    target: action ? action.target || null : null,
    txt: action ? action.txt || "" : "", seq: actSeq,
  };
  net.sendInput(d);
}
function onGuestState(s) {
  if (isHost || !net) return;
  if (!s || typeof s.n !== "number") return;
  const restarting = s.ph === "playing" && G && G.phase !== "playing" && G.phase !== "menu";
  if (!restarting && s.n < lastSnapSeq) return;
  if (restarting) {
    lastSnapSeq = -1;
    resultsShown = false; forceResults = false;
    $("results").hidden = true; $("skipCut").hidden = true;
    resetView();
  }
  lastSnapSeq = s.n;
  const ng = fromSnap(s);
  const meP = ng.players.find((p) => p.id === myId);
  if (!meP) return;
  const first = !stateJoined;
  if (first) {
    stateJoined = true;
    pred.x = meP.x; pred.y = meP.y; predReady = true;
    lastEventId = Math.max(lastEventId, ...ng.events.map((e) => e.id), 0);
    resetView();
    hideJoining();
    clearTimeout(joinTimer);
    toast("You're in. Keep the meat moving.");
  }
  G = ng;
  if (predReady) {
    const d = Math.hypot(pred.x - meP.x, pred.y - meP.y);
    if (d > 130) { pred.x = meP.x; pred.y = meP.y; }
    else { pred.x = lerp(pred.x, meP.x, 0.13); pred.y = lerp(pred.y, meP.y, 0.13); }
  } else { pred.x = meP.x; pred.y = meP.y; predReady = true; }
  if (G.phase === "playing" && resultsShown) {
    resultsShown = false; forceResults = false;
    $("results").hidden = true; $("skipCut").hidden = true;
    resetView();
  }
  netSendAcc = 0;
}
function guestLost() {
  if (isHost) return;
  if (!net && !stateJoined) return;
  clearTimeout(joinTimer);
  if (!stateJoined || !G || G.phase === "menu") {
    net = null; netReady = false; netCode = "";
    startSolo();
    toast("Lost the host — starting your own braai");
    return;
  }
  const p = G.players.find((q) => q.id === myId) || G.players.find((q) => q.id === localId);
  if (p) { p.id = "solo"; p.name = myName; G.players = [p]; }
  else G.players = [makePlayer("solo", myName, PLAYER_COLORS[0], VW / 2, 760)];
  localId = "solo"; myId = "solo"; isHost = true;
  net = null; netReady = false; netCode = ""; netInputs = {};
  clearUrl(); updateInvite(); updateRoster(true); resetView(); predReady = false;
  document.querySelectorAll(".rp").forEach((el) => el.remove());
  toast("Host left — you're finishing this braai solo");
}

/* ------------------------------------------------------------------ phase */
function showGameChrome(on) {
  for (const id of ["topbar", "scorehud", "jenhud", "firehud", "meatbar", "tools", "prompt", "roster"]) {
    const el = $(id); if (el) el.hidden = !on;
  }
  if (on && isTouch) $("touch").hidden = false; else $("touch").hidden = true;
  if (!on) { $("roster").hidden = true; }
}
function resetCameraLook() {
  viewYaw = 0; viewPitch = -0.16; winCamStarted = false; shake3D = 0;
  localInput.fwd = 0; localInput.strafe = 0; localInput.spray = false; localInput.sz = 0;
}
function startGame(solo) {
  if (mode === "play") return;
  sound.init();
  sound.setMusic(true);
  myName = sanitizeName($("nameIn").value) || "Braai Master";
  try { localStorage.setItem("braaiMasterName", myName); } catch (e) {}
  mode = "play";
  $("menu").hidden = true;
  $("results").hidden = true;
  $("skipCut").hidden = true;
  resultsShown = false; forceResults = false;
  resetView(); resetFx(); resetIntro();
  selectedMeat = 0; updateMeatSelection();
  lastToast = "";
  setChrome(true);
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
  keys.clear(); resetCameraLook();
  if (mode === "play" && !isTouch) setTimeout(() => { if (mode === "play") requestLookLock(); }, 50);
  if (solo || typeof Peer !== "function") {
    startSolo();
  } else {
    const code = hashCode();
    if (code) joinOnline(code);
    else beginHost(newCode());
  }
}
function startSolo() {
  isHost = true; localId = "solo"; myId = "solo";
  net = null; netReady = false; netCode = ""; stateJoined = true; netInputs = {};
  netSendAcc = 0; netInputAcc = 0; lastSnapSeq = -1;
  resetCameraLook();
  G = resetGame(makeDemo(), [makePlayer("solo", myName, PLAYER_COLORS[0], VW / 2, 760)]);
  resetView(); predReady = false; hideJoining(); clearTimeout(joinTimer);
  clearUrl(); updateInvite(); updateRoster(true);
  updateUrl();
  banner("BRAAI MASTER", "Keep the party vibe alive", "#ffd56b");
  toast("Solo braai. The party is watching.");
}
function beginHost(code) {
  isHost = true; localId = "host"; myId = "host"; netCode = code; netReady = false;
  stateJoined = true; netInputs = {}; lastSnapSeq = -1;
  resetCameraLook();
  G = resetGame(makeDemo(), [makePlayer("host", myName, PLAYER_COLORS[0], VW / 2, 760)]);
  resetView(); predReady = false; hideJoining(); clearTimeout(joinTimer);
  setUrl(code); updateInvite(); updateRoster(true);
  banner("BRAAI MASTER", "Keep the party vibe alive", "#ffd56b");
  toast("Braai lit. Send the invite link.");
  connectHost(code);
}
async function connectHost(code) {
  try {
    const n = await createNet(code, true);
    if (netCode !== code) { n.close && n.close(); return; }
    if (n.error) throw n;
    net = n; netReady = true; bindHostNet(n);
    updateInvite();
    toast("Online. Friends can join with your link.");
  } catch (e) {
    if (netCode !== code) return;
    if (e && e.error === "unavailable-id") {
      // someone else owns the code: try joining that party
      netCode = "";
      joinOnline(code);
      return;
    }
    net = null; netReady = false; netCode = "";
    clearUrl(); updateInvite(); updateRoster(true);
    toast("Online unavailable — solo braai");
  }
}
async function joinOnline(code) {
  netCode = code; isHost = false; stateJoined = false; netReady = false;
  lastSnapSeq = -1; netInputs = {};
  showJoining(code); updateInvite();
  try {
    const n = await createNet(code, false);
    if (!netCode) { n.close && n.close(); return; }
    if (n.error) throw n;
    net = n; netReady = true; bindGuestNet(n);
    localId = n.id; myId = n.id; predReady = false;
    $("joinTitle").textContent = "Waiting for the braai…";
    $("joinNote").textContent = "#" + code;
    updateInvite();
    clearTimeout(joinTimer);
    joinTimer = setTimeout(() => {
      if (!stateJoined) {
        if (net) { net.close(); net = null; }
        netCode = ""; netReady = false;
        startSolo();
        toast("Couldn't find that braai — starting your own");
      }
    }, 11000);
  } catch (e) {
    const err = e && e.error;
    if (err === "peer-unavailable") {
      toast("That braai has closed — you're hosting now");
      beginHost(code);
    } else if (err === "no-peerjs") {
      startSolo();
      toast("Online unavailable — solo braai");
    } else {
      startSolo();
      toast("Couldn't reach #" + code + " (" + (err || "error") + ") — solo braai it is");
    }
  }
}
function showJoining(code) {
  $("joining").hidden = false;
  $("joinTitle").textContent = "Joining the braai…";
  $("joinNote").textContent = code ? "#" + code : "";
}
function hideJoining() { $("joining").hidden = true; }
function updateUrl() {
  const code = netCode || "";
  if (code) setUrl(code); else clearUrl();
}
function requestRestart() {
  if (isHost) restartHost();
  else if (net && netReady) { net.restart(); toast("Asked the host for another braai"); }
  else { restartHost(); }
}
function restartHost() {
  if (!isHost) return;
  const players = G.players.length ? G.players.map((p) => ({ id: p.id, name: p.name, color: p.color })) : [{ id: localId, name: myName, color: PLAYER_COLORS[0] }];
  G = resetGame(G, players);
  resetView(); resetFx(); resetIntro(); resetCameraLook();
  lastSnapSeq = -1;
  resultsShown = false; forceResults = false;
  $("results").hidden = true; $("skipCut").hidden = true;
  sound.setMusic(true);
  setChrome(true);
  netSendAcc = 1;
  if (!isTouch) setTimeout(() => { if (mode === "play") requestLookLock(); }, 60);
  toast("New braai. Same Jennifer.");
}
function goMenu() {
  exitLookLock();
  if (net) { net.close(); net = null; }
  netCode = ""; netReady = false; stateJoined = false; netInputs = {};
  isHost = true; localId = "solo"; myId = "solo";
  mode = "menu"; G = makeDemo(); VG = G;
  resetView(); resetFx(); resetIntro();
  setChrome(false);
  $("results").hidden = true; $("skipCut").hidden = true; $("joining").hidden = true;
  $("menu").hidden = false;
  clearUrl(); updateInvite(); updateBest();
  sound.setMusic(false);
  document.querySelectorAll(".rp").forEach((el) => el.remove());
  $("roster").hidden = true;
}
function syncPhase() {
  if (mode !== "play" || !G) return;
  const won = G.phase === "won", lost = G.phase === "lost";
  if (!won && !lost) {
    setChrome(true);
    if (resultsShown) {
      resultsShown = false; forceResults = false;
      $("results").hidden = true;
    }
    $("skipCut").hidden = true;
    return;
  }
  setChrome(false);
  exitLookLock();
  if (!resultsShown) {
    $("skipCut").hidden = won ? (G.winT > 6.2) : true;
    if (forceResults || (won && G.winT > 6.25) || (lost && G.winT > 1.15)) showResults();
  }
}
function showResults() {
  if (resultsShown) return;
  exitLookLock();
  resultsShown = true;
  const won = G.phase === "won";
  $("skipCut").hidden = true;
  $("results").hidden = false;
  const card = $("resultCard");
  card.classList.toggle("lose", !won);
  $("resKicker").textContent = won ? "Challenge complete" : "The party is over";
  if (won) {
    $("resTitle").textContent = "LEKKER, BRAAI MASTER";
    $("resSub").textContent = "Jennifer Aniston is making out with you. The boerewors is on fire. The party is chanting your name. Worth it.";
  } else if (G.result === "vibe") {
    $("resTitle").textContent = "THE VIBE FLATLINED";
    $("resSub").textContent = "Somebody put a salad on the braai. Jennifer left with the guy who brought paper plates.";
  } else {
    $("resTitle").textContent = "TIME'S UP";
    $("resSub").textContent = "Jennifer's Uber has arrived. The party wanted more meat, and you gave them vibes.";
  }
  $("rScore").textContent = G.score.toLocaleString("en-ZA");
  $("rPerfect").textContent = G.perfect;
  $("rServed").textContent = G.served;
  $("rCombo").textContent = "×" + Math.max(1, G.bestCombo);
  try {
    const best = +(localStorage.getItem("braaiMasterBest") || 0);
    if (G.score > best) localStorage.setItem("braaiMasterBest", String(G.score));
  } catch (e) {}
  updateBest();
  sound.setMusic(false);
}
function resetIntro() {
  introFlags = { a: false, b: false, perfect: false, cold: false };
  lastToast = "";
}
function resetFx() {
  uiFx.length = 0;
  shake3D = 0;
  winCamStarted = false;
  if (typeof PS !== "undefined") {
    for (const k of Object.keys(PS)) { if (PS[k] && PS[k].items) PS[k].items.length = 0; }
  }
}

/* ------------------------------------------------------------- view state */
const SV = { players: new Map(), guests: new Map(), slots: new Array(SLOT_COUNT).fill(null), zones: [] };
function resetView() {
  SV.players.clear(); SV.guests.clear(); SV.slots.fill(null); SV.zones = [];
}
function buildView(src, dt, localId, host, prediction) {
  if (!src) return src;
  if (src.phase === "menu") return src;
  const k = 1 - Math.exp(-17 * dt);
  const V = Object.assign({}, src);
  // players
  V.players = src.players.map((p) => {
    let sp = SV.players.get(p.id);
    if (!sp) { sp = { x: p.x, y: p.y, walk: p.walk || 0, moving: false, yaw: p.yaw || 0 }; SV.players.set(p.id, sp); }
    let tx = p.x, ty = p.y;
    const isLocal = p.id === localId;
    if (isLocal && !host && prediction && predReady) { tx = prediction.x; ty = prediction.y; }
    if (isLocal && host) { sp.x = p.x; sp.y = p.y; }
    else { sp.x = lerp(sp.x, tx, k); sp.y = lerp(sp.y, ty, k); }
    const walkMoved = Math.abs((p.walk || 0) - (sp.walk || 0)) > 0.002;
    sp.walk = p.walk || 0;
    const inpMove = isLocal ? Math.hypot(localInput.fwd, localInput.strafe) > 0.08 : false;
    const moving = isLocal ? inpMove : (!!p.moving || walkMoved);
    let yaw = finite(p.yaw, 0);
    if (!isLocal) {
      let dy = yaw - (sp.yaw || 0); dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      sp.yaw = (sp.yaw || 0) + dy * Math.min(1, k * 1.4);
      yaw = sp.yaw;
    } else sp.yaw = yaw;
    return Object.assign({}, p, { x: sp.x, y: sp.y, moving, yaw });
  });
  // prune
  for (const id of Array.from(SV.players.keys())) if (!src.players.some((p) => p.id === id)) SV.players.delete(id);
  // guests
  V.guests = src.guests.map((gm) => {
    let sg = SV.guests.get(gm.id);
    if (!sg) { sg = { x: gm.x, y: gm.y }; SV.guests.set(gm.id, sg); }
    if (gm.state === "walkin" && Math.hypot(sg.x - gm.x, sg.y - gm.y) > 250) { sg.x = gm.x; sg.y = gm.y; }
    sg.x = lerp(sg.x, gm.x, k * 0.85); sg.y = lerp(sg.y, gm.y, k * 0.85);
    return Object.assign({}, gm, { x: sg.x, y: sg.y });
  });
  const gids = new Set(src.guests.map((gm) => gm.id));
  for (const id of Array.from(SV.guests.keys())) if (!gids.has(id)) SV.guests.delete(id);
  // slots
  V.slots = src.slots.map((s, i) => {
    if (!s) { SV.slots[i] = null; return null; }
    let sm = SV.slots[i];
    if (!sm || sm.type !== s.type) {
      sm = { type: s.type, a: s.a, b: s.b, ch: s.ch, placeT: 0.32, flipT: 0, down: s.down };
      SV.slots[i] = sm;
    }
    sm.a = lerp(sm.a, s.a, k); sm.b = lerp(sm.b, s.b, k); sm.ch = lerp(sm.ch, s.ch, k);
    sm.placeT = Math.max(0, sm.placeT - dt);
    sm.flipT = Math.max(0, sm.flipT - dt);
    if (s.flipT > sm.flipT) sm.flipT = s.flipT;
    return Object.assign({}, s, { a: sm.a, b: sm.b, ch: sm.ch, placeT: sm.placeT, flipT: sm.flipT, down: s.down });
  });
  // zones
  V.zones = src.zones.map((z, i) => {
    let sz = SV.zones[i];
    if (!sz) { sz = { coal: z.coal, flame: z.flame, wet: z.wet }; SV.zones[i] = sz; }
    sz.coal = lerp(sz.coal, z.coal, k); sz.flame = lerp(sz.flame, z.flame, k); sz.wet = lerp(sz.wet, z.wet, k);
    return Object.assign({}, z, { coal: sz.coal, flame: sz.flame, wet: sz.wet });
  });
  return V;
}

/* ------------------------------------------------------------------- HUD */
let isTouch = false;
let toastTimer = 0, bannerTimer = 0;
function toast(t) {
  if (!t) return;
  const el = $("toast");
  el.textContent = t;
  el.classList.add("show");
  lastToast = t;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}
function banner(big, small, color) {
  const el = $("banner");
  el.hidden = false;
  el.className = "hud";
  void el.offsetWidth;
  el.className = "hud show";
  el.style.color = color || "#fff3df";
  el.innerHTML = `${esc(big)}<small>${esc(small || "")}</small>`;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { el.hidden = true; el.className = "hud"; }, 1750);
}
function buildHearts() {
  const h = $("hearts");
  h.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const s = document.createElement("i");
    s.innerHTML = '<svg viewBox="0 0 20 19"><path d="M10 18C2 12 0 8 0 5.6 0 2.5 2.3 0 5.2 0 7 0 8.9 1.1 10 2.7 11.1 1.1 13 0 14.8 0 17.7 0 20 2.5 20 5.6 20 8 18 12 10 18z" fill="#ff6f9e"/></svg>';
    h.appendChild(s);
  }
}
function buildMeatCards() {
  const bar = $("meatbar");
  bar.querySelectorAll(".meatcard").forEach((el) => el.remove());
  MEATS.forEach((m, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "meatcard";
    b.setAttribute("aria-label", `Grab ${m.name} (key ${i + 1})`);
    b.innerHTML = `<span class="key">${i + 1}</span><canvas width="120" height="72"></canvas><span class="mn">${esc(m.name)}</span><span class="mg"><em style="left:${(m.lo / 1.08) * 100}%;width:${((m.hi - m.lo) / 1.08) * 100}%"></em></span><span class="ms">${Math.round(m.lo * 100)}–${Math.round(m.hi * 100)}%</span>`;
    const c = b.querySelector("canvas");
    const g = c.getContext("2d");
    drawMeat(g, i, 60, 38, 1.15, { a: m.hi * 0.5, b: m.hi * 0.42, ch: 0.01, flipT: 0, placeT: 0 }, 0);
    b.addEventListener("click", (e) => { e.preventDefault(); selectMeat(i, true); });
    bar.appendChild(b);
  });
  updateMeatSelection();
}
function buildFireHud() {
  const box = $("firezones");
  box.innerHTML = "";
  for (let i = 0; i < BRAAI.zoneCount; i++) {
    const row = document.createElement("div");
    row.className = "fz";
    row.innerHTML = `<b>${i + 1}</b><div class="fbar"><i></i></div><span class="fl">!</span><span class="lg"></span>`;
    box.appendChild(row);
  }
}
function updateFireHud() {
  const box = $("firezones");
  if (!box.children.length || !G) return;
  const p = localPlayer();
  const near = p ? nearestZone(p.x) : -1;
  for (let i = 0; i < G.zones.length; i++) {
    const z = G.zones[i], row = box.children[i];
    if (!row) continue;
    const fill = row.querySelector(".fbar i");
    fill.style.width = clamp((z.coal / 1.1) * 100, 0, 100) + "%";
    row.classList.toggle("hot", z.flame > 0.84);
    row.classList.toggle("cold", z.coal < 0.16);
    row.classList.toggle("wood", z.logs.length > 0);
    row.classList.toggle("near", i === near);
    row.querySelector(".lg").textContent = z.logs.length ? "+" + z.logs.length : "";
  }
  const allLow = G.zones.every((z) => z.coal < 0.2);
  $("fireNote").textContent = allLow ? "DYING!" : G.zones.some((z) => z.flame > 0.84) ? "FLARE!" : "keep it alive";
  $("fireNote").style.color = allLow || G.zones.some((z) => z.flame > 0.84) ? "#ff8a66" : "";
}
function updateMeatSelection() {
  const bar = $("meatbar");
  const cards = bar.querySelectorAll(".meatcard");
  cards.forEach((c, i) => c.classList.toggle("sel", i === selectedMeat));
  const p = G && G.players ? G.players.find((q) => q.id === localId) : null;
  bar.classList.toggle("handfull", !!(p && p.carry));
}
function selectMeat(i, fromClick) {
  if (mode !== "play") return;
  selectedMeat = clamp(i, 0, MEATS.length - 1);
  updateMeatSelection();
  sound.sfx("select");
  const p = G.players.find((q) => q.id === localId);
  if (p && !p.carry) localAction({ a: "grab", m: selectedMeat });
  else if (p && p.carry && p.carry.k === "w") toast("Hands full of wood — toss it on the fire first");
  else if (p && p.carry) toast("Hands full — finish what you're holding");
}
function localAction(action) {
  if (mode !== "play") return;
  const a = Object.assign({}, action || {});
  if ((a.a === "use" || a.a === "flip") && !a.target) a.target = serializeTarget(lookTarget);
  if (isHost) {
    if (a.a === "use") doUse(G, localId, a.target || null);
    else if (a.a === "flip") doFlip(G, localId, a.target || null);
    else if (a.a === "grab") doGrab(G, localId, a.m);
    else if (a.a === "emote") doEmote(G, localId, a.txt);
    else if (a.a === "again") { if (G.phase !== "playing") restartHost(); }
  } else {
    guestSend(a);
  }
}
function localPlayer() {
  return G && G.players ? G.players.find((p) => p.id === localId) : null;
}
function updatePrompt() {
  const el = $("prompt");
  if (mode !== "play" || !G || G.phase !== "playing") { el.hidden = true; return; }
  const p = localPlayer();
  if (!p) { el.hidden = true; return; }
  el.hidden = false;
  const key = (k) => `<kbd>${isTouch ? (k === "F" ? "FLIP" : k === "SPACE" ? "SPRAY" : k) : k}</kbd>`;
  const t = lookTarget;
  const c = p.carry;
  const near = nearBraai(p);
  const nearPile = canReachProp(p, WOODPILE);
  const nearBin = canReachProp(p, BIN);
  const slot = t && t.k === "s" ? G.slots[t.i] : null;
  const gm = t && t.k === "g" ? G.guests.find((q) => q.id === t.i) : null;
  const zone = t && (t.k === "z" || t.k === "s") ? G.zones[t.k === "z" ? t.z : slotZone(t.i)] : null;
  let html = "";
  if (c && c.k === "w") {
    if (t && t.k === "w" && nearPile && c.n < 3) html = `${key("E")} Grab another log <span style="opacity:.6">(${c.n}/3)</span>`;
    else if (t && (t.k === "s" || t.k === "z") && near) {
      const z = t.k === "s" ? slotZone(t.i) : t.z;
      html = `${key("E")} Toss log into fire zone ${z + 1}`;
    } else if (near) html = `${key("E")} Toss the log on the fire`;
    else html = `Carry the wood to the braai — ${key("E")} tosses it in`;
  } else if (c && c.k === "m") {
    const m = MEATS[c.t];
    if (t && t.k === "g" && gm) {
      if (gm.order === c.t) html = `${key("E")} Serve <b>${esc(gm.name)}</b> the ${esc(m.name)}`;
      else html = `<span class="warn">${esc(gm.name)} wants ${esc(MEATS[gm.order].name)}</span> — keep cooking`;
    } else if (t && t.k === "b" && nearBin) html = `${key("E")} Bin the ${esc(m.name)}`;
    else if (t && t.k === "s") {
      if (!near) html = `<span class="warn">Move closer to the braai</span>`;
      else if (slot) html = `<span class="warn">That spot is taken</span> — aim at an empty one`;
      else html = `${key("E")} Put the ${esc(m.name)} on the braai`;
    } else if (near) html = `Aim at an empty spot on the braai · ${key("E")} places it`;
    else html = `Take it to a guest or back to the braai`;
  } else {
    if (t && t.k === "w" && nearPile) html = `${key("E")} Grab firewood`;
    else if (t && t.k === "s" && slot) {
      const q = qualityOf(slot);
      html = `${key("E")} Pick up ${esc(MEATS[slot.type].name)} · ${key("F")} Flip <span style="color:${qualityColor(q)};font-weight:700">${qualityText(slot)}</span>`;
    } else if (t && t.k === "s") {
      if (!near) html = `<span class="warn">Move closer to the braai</span>`;
      else html = `Empty spot · ${isTouch ? "tap a meat card to grab" : "press 1–6 to grab meat"}`;
    } else if (t && t.k === "b") {
      html = `Nothing to bin`;
    } else if (t && t.k === "z" && zone) {
      if (zone.flame > 0.86) html = `<span class="warn">Flare-up!</span> Hold ${key("SPACE")} to spray zone ${t.z + 1}`;
      else if (zone.coal < 0.16) html = `<span class="warn">Cold zone</span> — grab wood or spray the coals`;
      else html = `Fire zone ${t.z + 1} · hold ${key("SPACE")} to spray`;
    } else {
      html = isTouch ? `Drag to look · stick to move · tap a meat card · ${key("E")} use`
        : `${key("MOUSE")} look · ${key("WASD")} move · ${key("1–6")} grab meat · ${key("E")} use · ${key("F")} flip`;
    }
  }
  if (html === lastPrompt) return;
  lastPrompt = html;
  el.innerHTML = html;
}
let lastPrompt = "";
let rosterKey = "";
let chromeOn = false;
function setChrome(on) {
  if (chromeOn === on) return;
  chromeOn = on;
  showGameChrome(on);
}
function updateHud() {
  if (mode !== "play" || !G) return;
  const playing = G.phase === "playing";
  const p = localPlayer();
  // top
  const hp = clamp(G.hype, 0, 100);
  $("vibeFill").style.width = hp + "%";
  $("vibePct").textContent = Math.round(hp) + "%";
  $("clockT").textContent = fmtTime(G.timeLeft);
  $("clock").classList.toggle("low", G.timeLeft < 30 && playing);
  $("scoreVal").textContent = G.score.toLocaleString("en-ZA");
  $("servedVal").textContent = G.served;
  $("comboVal").textContent = "×" + Math.max(1, G.combo);
  $("comboStat").classList.toggle("hot", G.combo >= 3);
  // hearts
  const on = Math.ceil(hp / 20);
  const hEls = $("hearts").children;
  for (let i = 0; i < hEls.length; i++) hEls[i].classList.toggle("on", i < on);
  $("jenMood").textContent = hp >= 82 ? "Smitten" : hp >= 58 ? "Interested" : hp >= 30 ? "Watching" : "Unimpressed";
  // water
  $("waterFill").style.width = (p ? p.water * 100 : 100) + "%";
  updateFireHud();
  updateMeatSelection();
  updatePrompt();
  updateRoster(false);
  updateInvite();
  // intro hints
  if (playing) {
    if (!introFlags.a && G.timeLeft < PARTY_TIME - 3) {
      introFlags.a = true;
      toast(isTouch ? "Drag to look. Tap a meat card to grab, then aim at the grill and tap E." : "Look down at the grill. 1–6 grabs meat, E places it, F flips it.");
    }
    if (!introFlags.b && G.timeLeft < PARTY_TIME - 15) {
      introFlags.b = true;
      toast(isTouch ? "Firewood is at the pile on the left. Tap E to grab, then aim at the fire and tap E." : "Firewood is at the pile on the left. Aim at the fire and hold SPACE to spray.");
    }
    if (!introFlags.perfect && G.perfect > 0) {
      introFlags.perfect = true;
      toast(isTouch ? "Perfect! Aim at it, tap E to take it off, then tap E on a guest." : "Perfect! Aim at it and press E to take it off, then aim at a guest and press E.");
    }
    if (!introFlags.cold && G.zones.some((z) => z.coal < 0.15)) {
      introFlags.cold = true;
      toast("A fire zone is going cold. Grab wood and toss it in!");
    }
  }
}
function updateInvite() {
  const label = $("invLabel"), code = $("invCode"), btn = $("copyBtn");
  if (netCode) {
    label.textContent = isHost ? "Invite code" : "Party code";
    code.textContent = "#" + netCode;
    btn.disabled = false;
  } else {
    label.textContent = "Solo braai";
    code.textContent = "—";
    btn.disabled = true;
  }
}
function updateRoster(force) {
  if (!G || mode !== "play") return;
  const list = G.players.slice().sort((a, b) => (a.id === localId ? -1 : b.id === localId ? 1 : 0));
  const key = list.map((p) => p.id + ":" + p.name + ":" + p.score).join("|") + netCode + isHost;
  if (!force && key === rosterKey) return;
  rosterKey = key;
  const el = $("roster");
  const show = chromeOn && (G.players.length > 1 || !!netCode);
  el.hidden = !show;
  if (!show) return;
  el.innerHTML = "";
  for (const p of list) {
    const d = document.createElement("div");
    d.className = "rp";
    const dot = document.createElement("i");
    dot.style.background = p.color; dot.style.color = p.color;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = p.name + (p.id === localId ? " (you)" : "");
    const sc = document.createElement("b");
    sc.textContent = p.score;
    d.appendChild(dot); d.appendChild(nm); d.appendChild(sc);
    el.appendChild(d);
  }
}
function updateBest() {
  let best = 0;
  try { best = +(localStorage.getItem("braaiMasterBest") || 0); } catch (e) {}
  $("bestScore").textContent = best > 0 ? "Best: " + best.toLocaleString("en-ZA") : "Best: —";
}
function toggleMute() {
  muted = !muted;
  sound.setMuted(muted);
  try { localStorage.setItem("braaiMasterMuted", muted ? "1" : "0"); } catch (e) {}
  updateSoundIcon();
  toast(muted ? "Sound off" : "Sound on");
}
function updateSoundIcon() {
  document.querySelectorAll("#soundBtn .sndOn").forEach((el) => el.style.display = muted ? "none" : "");
  document.querySelectorAll("#soundBtn .sndOff").forEach((el) => el.style.display = muted ? "" : "none");
  const ms = document.querySelector("#menuSound span");
  if (ms) ms.textContent = muted ? "Sound off" : "Sound on";
}

/* ------------------------------------------------------------------ touch */
function setupTouch() {
  const stick = $("stick"), knob = stick.querySelector("i");
  let sid = null;
  const setKnob = (dx, dy) => {
    const max = 38;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    touchInput.x = dx / max; touchInput.y = dy / max; touchInput.active = len > 3;
  };
  stick.addEventListener("pointerdown", (e) => {
    e.preventDefault(); sid = e.pointerId;
    try { stick.setPointerCapture(sid); } catch (err) {}
    const r = stick.getBoundingClientRect();
    setKnob(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  });
  stick.addEventListener("pointermove", (e) => {
    if (e.pointerId !== sid) return;
    const r = stick.getBoundingClientRect();
    setKnob(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  });
  const end = (e) => {
    if (e.pointerId !== sid) return;
    sid = null; touchInput.x = touchInput.y = 0; touchInput.active = false;
    knob.style.transform = "";
  };
  stick.addEventListener("pointerup", end);
  stick.addEventListener("pointercancel", end);
  document.querySelectorAll("[data-tact]").forEach((b) => {
    const act = b.getAttribute("data-tact");
    if (act === "spray") {
      const down = (e) => { e.preventDefault(); touchSpray = true; b.setPointerCapture && e.pointerId != null && b.setPointerCapture(e.pointerId); };
      const up = (e) => { e.preventDefault(); touchSpray = false; };
      b.addEventListener("pointerdown", down);
      b.addEventListener("pointerup", up);
      b.addEventListener("pointercancel", up);
      b.addEventListener("pointerleave", up);
    } else {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        localAction({ a: act === "flip" ? "flip" : "use", target: serializeTarget(lookTarget) });
      });
    }
  });
}

/* ------------------------------------------------------------------ setup */
function updateSound(dt) {
  if (!sound.started || !G) return;
  let siz = 0, fire = 0;
  for (let i = 0; i < G.slots.length; i++) {
    const it = G.slots[i];
    if (!it) continue;
    const h = zoneHeat(G.zones[slotZone(i)]);
    siz += (0.18 + h * 0.75) * (it.ch > 0.55 ? 0.5 : 1);
  }
  for (const z of G.zones) fire += z.flame * 0.7 + z.coal * 0.35;
  fire = clamp(fire / G.zones.length, 0, 1);
  siz = clamp(siz / 7, 0, 1);
  const p = localPlayer();
  const spray = !!(localInput.spray && p && p.water > 0.01 && mode === "play");
  sound.update(dt, { sizzle: siz, fire, spray });
}
function updateMenuDemo(dt, D) {
  if (!D || D.phase !== "menu") return;
  menuDemoT += dt;
  for (let i = 0; i < D.zones.length; i++) {
    D.zones[i].flame = 0.10 + Math.sin(menuDemoT * 1.7 + i * 1.9) * 0.035;
    D.zones[i].coal = 0.62 + Math.sin(menuDemoT * 0.5 + i) * 0.02;
  }
  for (const p of D.players) p.walk = (p.walk || 0) + dt * 1.4;
  for (const gm of D.guests) gm.walk = (gm.walk || 0) + dt * 0.6;

}
function setupInput() {
  const isCoarse = (window.matchMedia && matchMedia("(pointer: coarse)").matches) || "ontouchstart" in window;
  isTouch = isCoarse;
  if (isTouch) { $("keyhint").style.display = "none"; }
  window.addEventListener("keydown", (e) => {
    const c = e.code;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(c)) e.preventDefault();
    if (e.repeat) return;
    if (mode === "menu") {
      if (c === "Enter") { const f = $("startForm"); if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); }
      return;
    }
    if (!$("joining").hidden) return;
    if (resultsShown && (c === "Enter" || c === "Space")) { e.preventDefault(); requestRestart(); return; }
    if (c === "KeyM") { toggleMute(); return; }
    if (G.phase === "won" && !resultsShown && c === "Space") { skipCut(); return; }
    if (c === "Space") { keys.add("Space"); localInput.spray = true; return; }
    if (c === "KeyE") { localAction({ a: "use", target: serializeTarget(lookTarget) }); return; }
    if (c === "KeyF") { localAction({ a: "flip", target: serializeTarget(lookTarget) }); return; }
    if (c === "KeyQ") { localAction({ a: "emote", txt: pick(["Lekker!", "Kom ons braai!", "Chef's kiss", "Hot hot hot!", "Who's hungry?"]) }); return; }
    if (c.startsWith("Digit")) {
      const n = +c.slice(5);
      if (n >= 1 && n <= 6) selectMeat(n - 1, false);
      return;
    }
    keys.add(c);
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
    if (e.code === "Space") localInput.spray = false;
  });
  window.addEventListener("blur", () => { keys.clear(); localInput.spray = false; touchSpray = false; });
  $("soundBtn").addEventListener("click", toggleMute);
  $("menuSound").addEventListener("click", toggleMute);
  $("copyBtn").addEventListener("click", async () => {
    if (!netCode) return;
    const url = location.href.split("#")[0] + "#" + netCode;
    try {
      await navigator.clipboard.writeText(url);
      toast("Invite link copied");
    } catch (e) {
      try { prompt("Send this link to your friends:", url); } catch (e2) {}
    }
  });
  $("startForm").addEventListener("submit", (e) => { e.preventDefault(); startGame(false); });
  $("soloBtn").addEventListener("click", () => startGame(true));
  $("againBtn").addEventListener("click", requestRestart);
  $("menuBtn").addEventListener("click", goMenu);
  $("skipCut").addEventListener("click", skipCut);
  document.addEventListener("pointerdown", () => { sound.init(); }, { passive: true });
  setupTouch();
  window.addEventListener("hashchange", () => {
    if (mode === "menu") updateMenuNote();
  });
}
function skipCut() {
  if (G.phase !== "won" || resultsShown) return;
  forceResults = true;
  if (isHost) G.winT = 6.3;
  showResults();
}
function updateMenuNote() {
  const h = hashCode();
  const b = $("startBtn");
  if (h) {
    b.textContent = "Join the party";
    $("soloBtn").textContent = "Solo";
    $("netnote").textContent = `You're joining party #${h}. The host is already braaing.`;
  } else {
    b.textContent = "Light the fire";
    $("soloBtn").textContent = "Solo";
    $("netnote").textContent = "Online co-op: start a braai, then send the link in the top-right. Friends drop into your fire.";
  }
}

/* ------------------------------------------------------------------- loop */
let lastFrame = performance.now();
let clockTime = 0;
function loop(now) {
  if (document.hidden && !net && mode === "play") { lastFrame = now; requestAnimationFrame(loop); return; }
  let dt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (!Number.isFinite(dt) || dt < 0) dt = 0;
  dt = Math.min(dt, 0.05);
  clockTime = now / 1000;
  if (mode === "play" && G) {
    if (isHost) {
      hostUpdate(G, dt, localId, localInput, netInputs);
      hostBroadcast(dt);
    } else {
      updateGuestLocal(dt);
    }
    processEvents(G);
    VG = buildView(G, dt, localId, isHost, pred);
    updateWorld3D(VG, clockTime, dt, localId, false);
    updateCamera3D(VG, clockTime, dt, localId, false);
    updateLookTarget3D(VG);
    updateCrosshairAndLook();
    updateHud();
    updateSound(dt);
    syncPhase();
    if (G.phase !== "playing" && G.phase !== "menu") { localInput.spray = false; touchSpray = false; }
    renderer.render(scene, camera);
    drawOverlay(VG, clockTime, dt, localId, false);
  } else {
    updateMenuDemo(dt, G);
    VG = G;
    updateWorld3D(G, clockTime, dt, "solo", true);
    updateCamera3D(G, clockTime, dt, "solo", true);
    updateCrosshairAndLook();
    updateSound(dt);
    renderer.render(scene, camera);
    drawOverlay(G, clockTime, dt, "solo", true);
  }
  requestAnimationFrame(loop);
}
function updateGuestLocal(dt) {
  if (G && G.phase === "playing" && predReady) {
    const yaw = localInput.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let wx = fx * localInput.fwd + rx * localInput.strafe;
    let wz = fz * localInput.fwd + rz * localInput.strafe;
    const wl = Math.hypot(wx, wz);
    if (wl > 1) { wx /= wl; wz /= wl; }
    if (wl > 0.08) {
      const spd = PLAY.speed * (localInput.sprint ? 1.38 : 1);
      pred.x = clamp(pred.x + wx * spd * dt, PLAY.minX, PLAY.maxX);
      pred.y = clamp(pred.y + wz * spd * dt, PLAY.minY, PLAY.maxY);
    }
  }
  netInputAcc += dt;
  if (netInputAcc >= 1 / 30) {
    netInputAcc = 0;
    guestSend(null);
  }
}
function collectInput() {
  let strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  let fwd = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  if (touchInput.active) { strafe += touchInput.x; fwd -= touchInput.y; }
  const l = Math.hypot(fwd, strafe);
  if (l > 1) { fwd /= l; strafe /= l; }
  if (Math.abs(strafe) < 0.04) strafe = 0;
  if (Math.abs(fwd) < 0.04) fwd = 0;
  localInput.fwd = fwd; localInput.strafe = strafe;
  localInput.yaw = viewYaw; localInput.pitch = viewPitch;
  localInput.sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  localInput.spray = keys.has("Space") || touchSpray;
  const tz = lookTarget ? targetZoneIndex({ k: lookTarget.k, i: lookTarget.i, z: lookTarget.z }) : -1;
  if (tz >= 0) localInput.sz = tz;
  else {
    const p = localPlayer();
    localInput.sz = p ? nearestZone(p.x) : 0;
  }
}
function inputLoop() {
  collectInput();
  requestAnimationFrame(inputLoop);
}

/* ------------------------------------------------------------------- init */
function init() {
  CW = window.innerWidth; CH = window.innerHeight;
  if (!init3D()) {
    $("startBtn").disabled = true;
    $("soloBtn").disabled = true;
    $("nameIn").disabled = true;
    $("netnote").innerHTML = "<b>Couldn't start WebGL.</b> Braai Master needs a browser with WebGL enabled. Try Chrome, Edge or Firefox.";
    return;
  }
  resize3D();
  window.addEventListener("resize", resize3D, { passive: true });
  setupLookControls();
  buildHearts();
  buildMeatCards();
  buildFireHud();
  setupInput();
  try {
    myName = sanitizeName(localStorage.getItem("braaiMasterName")) || "Braai Master";
    $("nameIn").value = myName;
    muted = localStorage.getItem("braaiMasterMuted") === "1";
  } catch (e) { myName = "Braai Master"; }
  if (isTouch) {
    $("keyhint").style.display = "none";
    const wk = document.querySelector("#waterhud kbd");
    if (wk) wk.textContent = "SPRAY";
    const tn = $("touchnote"); if (tn) tn.hidden = false;
  }
  updateSoundIcon();
  updateBest();
  updateMenuNote();
  updateInvite();
  G = makeDemo();
  VG = G;
  resetView();
  requestAnimationFrame(loop);
  requestAnimationFrame(inputLoop);
  // tiny debug/testing hook
  window.__braai = {
    get G() { return G; },
    get mode() { return mode; },
    get myId() { return myId; },
    startSolo() { if (mode === "menu") startGame(true); },
    start() { if (mode === "menu") startGame(false); },
    addGuest() { if (G) spawnGuest(G); },
    use() { localAction({ a: "use" }); },
    flip() { localAction({ a: "flip" }); },
    grab(i) { selectMeat(clamp(i | 0, 0, MEATS.length - 1), false); },
    setSpray(v) { localInput.spray = !!v; },
    teleport(x, y) { const p = localPlayer(); if (p) { p.x = clamp(+x, PLAY.minX, PLAY.maxX); p.y = clamp(+y, PLAY.minY, PLAY.maxY); } },
    player() { const p = localPlayer(); return p ? { x: p.x, y: p.y, carry: p.carry, water: p.water, score: p.score } : null; },
    slots() { return G.slots.map((s, i) => s ? { i, type: s.type, name: MEATS[s.type].name, q: qualityOf(s), a: r2(s.a), b: r2(s.b), ch: r2(s.ch), down: s.down, x: r2(slotPos(i).x) } : null); },
    guestInfo() { return G.guests.map((g) => ({ id: g.id, name: g.name, state: g.state, order: g.order, x: r2(g.x), y: r2(g.y), pat: r2(g.patience) })); },
    zoneInfo() { return G.zones.map((z) => ({ coal: r2(z.coal), flame: r2(z.flame), logs: z.logs.length, wet: r2(z.wet) })); },
    wood() { const p = localPlayer(); if (p) { p.x = WOODPILE.x; p.y = WOODPILE.y; } localAction({ a: "use" }); },
    setHype(v) { if (G) G.hype = clamp(+v || 0, 0, 100); },
    setCoal(v) { if (G) G.zones.forEach((z) => { z.coal = clamp(+v || 0, 0, 1.1); }); },
    win() { if (G) winGame(G); },
    tick(sec) { if (mode === "play" && isHost) { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) hostUpdate(G, 1 / 60, localId, localInput, netInputs); } },
    state() {
      return {
        mode, phase: G.phase, players: G.players.length, guests: G.guests.length,
        slots: G.slots.filter(Boolean).length, hype: r1(G.hype), time: r1(G.timeLeft), score: G.score,
        fire: G.zones.map((z) => [r2(z.coal), r2(z.flame)]),
        online: !!net, netCode, netReady, host: isHost, joined: stateJoined,
        names: G.players.map((p) => p.name + (p.id === localId ? "*" : "")),
      };
    },
    aim(yaw, pitch) { viewYaw = finite(yaw, viewYaw); viewPitch = clamp(finite(pitch, viewPitch), -1.24, 1.24); },
    target() { return lookTarget ? { k: lookTarget.k, i: lookTarget.i, z: lookTarget.z, label: lookTarget.label, actionable: !!lookTarget.actionable } : null; },
    camera() { return camera ? { x: +camera.position.x.toFixed(2), y: +camera.position.y.toFixed(2), z: +camera.position.z.toFixed(2), yaw: +viewYaw.toFixed(2), pitch: +viewPitch.toFixed(2) } : null; },
    renderer: () => renderer, scene: () => scene, threeCamera: () => camera,
    meats: MEATS, slotXs: Array.from({ length: SLOT_COUNT }, (_, i) => slotPos(i).x), zoneXs: Array.from({ length: BRAAI.zoneCount }, (_, i) => zoneCenter(i)),
  };
}
init();
})();
