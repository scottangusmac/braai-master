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
const JEN = { x: 1476, y: 716 };
const PLAY = {
  minX: 64, maxX: 1536, minY: 648, maxY: 852, speed: 356,
  braaiY: 700, braaiReach: 112, guestReach: 124, slotReach: 104,
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
const ctx = canvas.getContext("2d", { alpha: false });

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
    x, y, dir: 1, carry: null, water: 1, spraying: false, sz: 0,
    score: 0, served: 0, perfect: 0, emoteT: 0, emote: "", walk: Math.random() * 7,
    actCd: 0, joinT: 1.2,
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
  G.players = [makePlayer("demo1", "You", PLAYER_COLORS[0], 452, 690), makePlayer("demo2", "Sipho", PLAYER_COLORS[1], 1130, 706)];
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
    pl: G.players.map((p) => [p.id, p.name, p.color, r1(p.x), r1(p.y), p.dir, packCarry(p.carry), p.spraying ? 1 : 0, p.sz | 0, r2(p.water), p.score | 0, p.served | 0, p.perfect | 0, r2(p.emoteT), p.emote || "", r2(p.walk || 0)]),
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
      id: p[0], name: p[1], color: p[2], x: finite(p[3]), y: finite(p[4]), dir: finite(p[5], 1),
      carry: unpackCarry(p[6]), spraying: !!p[7], sz: p[8] | 0, water: finite(p[9], 1),
      score: p[10] | 0, served: p[11] | 0, perfect: p[12] | 0, emoteT: finite(p[13]), emote: p[14] || "",
      walk: finite(p[15]), actCd: 0, joinT: 0,
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
function feedWood(G, p) {
  const z = nearestZone(p.x);
  addLog(G, z, null);
  p.carry.n--;
  if (p.carry.n <= 0) p.carry = null;
  pushEvent(G, "wood", p.x, p.y, `${z + 1}`);
}

/* --------------------------------------------------------------- actions */
function doUse(G, id) {
  const p = playerOf(G, id);
  if (!p || G.phase !== "playing" || p.actCd > 0) return;
  p.actCd = 0.09;
  // firewood pile
  if (distTo(p, WOODPILE) < WOODPILE.r) {
    if (!p.carry) { p.carry = { k: "w", n: 1 }; pushEvent(G, "wood", p.x, p.y, "1"); return; }
    if (p.carry.k === "w") {
      if (p.carry.n < 3) { p.carry.n++; pushEvent(G, "wood", p.x, p.y, String(p.carry.n)); }
      else pushEvent(G, "hint", p.x, p.y, "Arms full of wood");
      return;
    }
  }
  // serve a guest
  const gm = nearestWaitingGuest(G, p);
  if (gm && p.carry && p.carry.k === "m") {
    const cq = qualityOf({ a: p.carry.a, b: p.carry.b, ch: p.carry.ch, type: p.carry.t });
    if (gm.order === p.carry.t && cq !== "raw") { serveGuest(G, p, gm); return; }
    if (!(nearBraai(p) && cq === "raw")) {
      if (gm.order !== p.carry.t) pushEvent(G, "hint", p.x, p.y, `They asked for ${MEATS[gm.order].name}`);
      else pushEvent(G, "hint", p.x, p.y, "That's still raw — keep it on the fire");
      return;
    }
  }
  // bin
  if (distTo(p, BIN) < BIN.r && p.carry && p.carry.k === "m") {
    p.carry = null;
    pushEvent(G, "bin", BIN.x, BIN.y, "");
    return;
  }
  // the braai itself
  if (nearBraai(p)) {
    if (p.carry && p.carry.k === "w") { feedWood(G, p); return; }
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
}
function doFlip(G, id) {
  const p = playerOf(G, id);
  if (!p || G.phase !== "playing" || p.actCd > 0) return;
  p.actCd = 0.07;
  if (!nearBraai(p)) return;
  const slot = findItemSlot(G, p);
  if (slot < 0) return;
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
    let dx = inp ? finite(inp.dx) : 0;
    let dy = inp ? finite(inp.dy) : 0;
    let len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; len = 1; }
    if (len > 0.08) {
      p.x = clamp(p.x + dx * PLAY.speed * dt, PLAY.minX, PLAY.maxX);
      p.y = clamp(p.y + dy * PLAY.speed * dt, PLAY.minY, PLAY.maxY);
      p.walk = (p.walk || 0) + len * dt * 9.5;
      if (Math.abs(dx) > 0.1) p.dir = dx > 0 ? 1 : -1;
    }
    p.emoteT = Math.max(0, (p.emoteT || 0) - dt);
    p.joinT = Math.max(0, (p.joinT || 0) - dt);
    p.actCd = Math.max(0, (p.actCd || 0) - dt);
    const wantSpray = !!(inp && inp.spray) && p.water > 0.015;
    p.spraying = wantSpray;
    p.sz = nearestZone(p.x);
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
    np.y = 678 + (i % 2) * 30;
    np.walk = Math.random() * 7;
    return np;
  });
  seedGuests(ng);
  ng.spawnT = 7;
  ng.demo = demo;
  return ng;
}
/* ------------------------------------------------------------ canvas / fx */
let DPR = 1, CW = 0, CH = 0, SCALE = 1, OX = 0, OY = 0;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  CW = window.innerWidth; CH = window.innerHeight;
  canvas.width = Math.max(1, Math.round(CW * DPR));
  canvas.height = Math.max(1, Math.round(CH * DPR));
  canvas.style.width = CW + "px"; canvas.style.height = CH + "px";
  SCALE = Math.min(CW / VW, CH / VH);
  OX = (CW - VW * SCALE) / 2;
  OY = (CH - VH * SCALE) / 2;
}
window.addEventListener("resize", resize, { passive: true });

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
function glowCircle(g, x, y, r, c1, c2 = "transparent") {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, c1); gr.addColorStop(1, c2);
  g.fillStyle = gr; ellipse(g, x, y, r, r); g.fill();
}

/* --------------------------------------------------------------- backdrop */
let backdrop = null;
function buildBackdrop() {
  const b = document.createElement("canvas");
  b.width = VW; b.height = VH;
  const g = b.getContext("2d");
  // night sky
  let sky = g.createLinearGradient(0, 0, 0, 470);
  sky.addColorStop(0, "#070b1d");
  sky.addColorStop(0.38, "#151029");
  sky.addColorStop(0.68, "#361d2c");
  sky.addColorStop(0.87, "#67332c");
  sky.addColorStop(1, "#2a1715");
  g.fillStyle = sky; g.fillRect(0, 0, VW, 470);
  // stars
  const R = rng(87123);
  for (let i = 0; i < 210; i++) {
    const x = R() * VW, y = R() * 330, s = R() < 0.92 ? 0.6 + R() * 1.2 : 1.6 + R() * 1.4;
    g.globalAlpha = 0.2 + R() * 0.72;
    g.fillStyle = R() < 0.18 ? "#ffd8a8" : "#d7e4ff";
    ellipse(g, x, y, s, s); g.fill();
  }
  g.globalAlpha = 1;
  // moon
  g.save();
  glowCircle(g, 1318, 104, 150, "rgba(255,225,170,.17)", "rgba(255,225,170,0)");
  glowCircle(g, 1318, 104, 58, "rgba(255,240,205,.5)", "rgba(255,240,205,0)");
  g.fillStyle = "#f7e9c8"; ellipse(g, 1318, 104, 38, 38); g.fill();
  g.fillStyle = "rgba(198,178,142,.22)";
  ellipse(g, 1307, 92, 8, 6); g.fill(); ellipse(g, 1327, 113, 6, 8); g.fill(); ellipse(g, 1328, 93, 4, 4); g.fill();
  g.restore();
  // distant hills
  g.fillStyle = "#151b2a";
  g.beginPath(); g.moveTo(0, 360);
  g.bezierCurveTo(190, 302, 360, 338, 540, 318);
  g.bezierCurveTo(730, 295, 860, 350, 1040, 326);
  g.bezierCurveTo(1220, 302, 1420, 348, 1600, 316);
  g.lineTo(1600, 470); g.lineTo(0, 470); g.closePath(); g.fill();
  // distant trees
  const tree = (x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = "#0d121d";
    g.fillRect(-4, -170, 8, 170);
    const blob = (bx, by, r) => { g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fill(); };
    blob(-30, -150, 48); blob(20, -162, 58); blob(62, -142, 42); blob(-62, -122, 34); blob(4, -200, 40);
    g.restore();
  };
  tree(80, 400, 1.1); tree(176, 412, 0.78); tree(1510, 400, 1.15); tree(1420, 416, 0.7);
  // house silhouette left
  g.save();
  g.fillStyle = "#100f18";
  g.fillRect(238, 216, 270, 166);
  g.beginPath(); g.moveTo(214, 220); g.lineTo(372, 138); g.lineTo(532, 220); g.closePath(); g.fill();
  g.fillStyle = "#1a1520";
  g.fillRect(468, 120, 24, 92);
  const win = (x, y, w, h, a) => {
    g.fillStyle = `rgba(255,184,91,${a})`; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(255,244,214,.65)"; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle = "rgba(30,18,12,.55)"; g.fillRect(x + w / 2 - 1, y, 2, h); g.fillRect(x, y + h / 2 - 1, w, 2);
  };
  win(270, 250, 30, 40, 0.42); win(322, 250, 30, 40, 0.6); win(382, 250, 30, 40, 0.35);
  win(438, 250, 30, 40, 0.62); win(314, 316, 34, 46, 0.5);
  g.restore();
  // ground / deck
  const deck = g.createLinearGradient(0, 560, 0, 900);
  deck.addColorStop(0, "#3b2417");
  deck.addColorStop(0.34, "#2b1a12");
  deck.addColorStop(1, "#1a100b");
  g.fillStyle = deck; g.fillRect(0, 560, VW, 340);
  // plank rows
  for (let y = 566, row = 0; y < 910; y += 36, row++) {
    g.fillStyle = row % 2 ? "rgba(255,190,120,.028)" : "rgba(0,0,0,.10)";
    g.fillRect(0, y, VW, 35);
    g.strokeStyle = "rgba(8,5,4,.55)"; g.lineWidth = 2;
    line(g, 0, y, VW, y);
    for (let x = row % 2 ? 90 : 210; x < VW; x += 288) {
      g.strokeStyle = "rgba(10,6,5,.4)"; g.lineWidth = 1.5;
      line(g, x, y + 2, x, y + 33);
    }
    // grain
    for (let k = 0; k < 2; k++) {
      const gy = y + 8 + R() * 20;
      g.strokeStyle = "rgba(255,199,139,.035)"; g.lineWidth = 1 + R();
      g.beginPath();
      for (let x = 0; x <= VW; x += 120) g.lineTo(x, gy + Math.sin(x * 0.008 + row) * 2);
      g.stroke();
    }
  }
  // warm pool of light from the braai
  g.save();
  g.globalCompositeOperation = "lighter";
  glowCircle(g, 770, 620, 640, "rgba(255,118,38,.20)", "rgba(255,118,38,0)");
  glowCircle(g, 770, 520, 470, "rgba(255,90,24,.12)", "rgba(255,90,24,0)");
  g.restore();
  // braai shadow
  g.fillStyle = "rgba(0,0,0,.42)";
  ellipse(g, 770, 606, 710, 52); g.fill();
  // stone surround
  const stone = g.createLinearGradient(0, 284, 0, 526);
  stone.addColorStop(0, "#554034"); stone.addColorStop(0.16, "#3e2d24");
  stone.addColorStop(0.8, "#2c211b"); stone.addColorStop(1, "#1b1411");
  g.fillStyle = stone;
  rr(g, BRAAI.x0 - 30, 284, BRAAI.x1 - BRAAI.x0 + 60, 246, 18); g.fill();
  // stone blocks on surround
  g.save();
  rr(g, BRAAI.x0 - 30, 284, BRAAI.x1 - BRAAI.x0 + 60, 246, 18); g.clip();
  const SR = rng(5001);
  for (let y = 288; y < 528; y += 24) {
    const off = (y / 24) % 2 ? 38 : 0;
    for (let x = BRAAI.x0 - 30 - off; x < BRAAI.x1 + 32; x += 76) {
      g.fillStyle = `rgba(${60 + SR() * 36 | 0},${44 + SR() * 26 | 0},${34 + SR() * 20 | 0},.32)`;
      rr(g, x + 2, y + 2, 72, 20, 5); g.fill();
      g.strokeStyle = "rgba(10,7,5,.33)"; g.lineWidth = 1.4;
      rr(g, x + 2, y + 2, 72, 20, 5); g.stroke();
    }
  }
  g.restore();
  // charcoal bed
  const bed = g.createLinearGradient(0, 302, 0, 502);
  bed.addColorStop(0, "#1c1512"); bed.addColorStop(0.45, "#0f0b0a"); bed.addColorStop(1, "#181110");
  g.fillStyle = bed;
  rr(g, BRAAI.x0 + 2, 302, BRAAI.x1 - BRAAI.x0 - 4, 200, 10); g.fill();
  // inner rim highlight
  g.strokeStyle = "rgba(255,193,126,.16)"; g.lineWidth = 3;
  rr(g, BRAAI.x0 + 1, 301, BRAAI.x1 - BRAAI.x0 - 2, 202, 10); g.stroke();
  // ash texture in bed
  const AR = rng(8841);
  for (let i = 0; i < 340; i++) {
    const x = BRAAI.x0 + 8 + AR() * (BRAAI.x1 - BRAAI.x0 - 16);
    const y = 310 + AR() * 186;
    g.fillStyle = `rgba(${120 + AR() * 70 | 0},${105 + AR() * 55 | 0},${95 + AR() * 40 | 0},${0.02 + AR() * 0.06})`;
    ellipse(g, x, y, 1 + AR() * 3.4, 1 + AR() * 2);
    g.fill();
  }
  // front brick face
  const face = g.createLinearGradient(0, 506, 0, 598);
  face.addColorStop(0, "#4b3324"); face.addColorStop(0.16, "#38251b"); face.addColorStop(1, "#211610");
  g.fillStyle = face;
  rr(g, BRAAI.x0 - 20, 500, BRAAI.x1 - BRAAI.x0 + 40, 96, 7); g.fill();
  g.save();
  rr(g, BRAAI.x0 - 20, 500, BRAAI.x1 - BRAAI.x0 + 40, 96, 7); g.clip();
  const BR = rng(1977);
  for (let y = 506; y < 602; y += 22) {
    const off = (y / 22) % 2 ? 32 : 0;
    for (let x = BRAAI.x0 - 20 - off; x < BRAAI.x1 + 22; x += 64) {
      g.fillStyle = `rgb(${60 + BR() * 34 | 0},${37 + BR() * 24 | 0},${26 + BR() * 17 | 0})`;
      rr(g, x + 1.5, y + 1.5, 61, 19, 3); g.fill();
      g.fillStyle = "rgba(255,194,132,.035)";
      g.fillRect(x + 3, y + 3, 57, 2);
    }
  }
  g.restore();
  // top rim highlight and front edge
  g.strokeStyle = "rgba(255,210,155,.2)"; g.lineWidth = 2.5;
  rr(g, BRAAI.x0 - 20, 500, BRAAI.x1 - BRAAI.x0 + 40, 96, 7); g.stroke();
  // front shelf / rail
  const rail = g.createLinearGradient(0, 570, 0, 586);
  rail.addColorStop(0, "#8d6a4b"); rail.addColorStop(0.45, "#583d29"); rail.addColorStop(1, "#2a1b12");
  g.fillStyle = rail;
  rr(g, BRAAI.x0 + 14, 570, BRAAI.x1 - BRAAI.x0 - 28, 14, 5); g.fill();
  for (let x = BRAAI.x0 + 46; x < BRAAI.x1 - 20; x += 130) {
    g.fillStyle = "rgba(20,12,8,.7)"; rr(g, x, 572, 4, 10, 2); g.fill();
  }
  // side end caps
  const cap = g.createLinearGradient(0, 290, 0, 600);
  cap.addColorStop(0, "#5b4333"); cap.addColorStop(1, "#231811");
  g.fillStyle = cap;
  rr(g, BRAAI.x0 - 42, 296, 30, 300, 10); g.fill();
  rr(g, BRAAI.x1 + 12, 296, 30, 300, 10); g.fill();
  g.strokeStyle = "rgba(255,205,150,.16)"; g.lineWidth = 2;
  rr(g, BRAAI.x0 - 42, 296, 30, 300, 10); g.stroke();
  rr(g, BRAAI.x1 + 12, 296, 30, 300, 10); g.stroke();
  // woodpile
  g.save();
  g.translate(WOODPILE.x, WOODPILE.y);
  g.fillStyle = "rgba(0,0,0,.38)"; ellipse(g, 4, 28, 104, 30); g.fill();
  g.fillStyle = "#2a1b12"; rr(g, -104, -14, 208, 44, 8); g.fill();
  const LR = rng(661);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4 - row; i++) {
      const lx = -78 + i * 50 + row * 25 + (LR() - 0.5) * 8;
      const ly = -20 + row * -21 + (LR() - 0.5) * 4;
      g.save(); g.translate(lx, ly); g.rotate((LR() - 0.5) * 0.14);
      const lg = g.createLinearGradient(0, -13, 0, 13);
      lg.addColorStop(0, "#9a6c42"); lg.addColorStop(0.5, "#6c4528"); lg.addColorStop(1, "#3a2415");
      g.fillStyle = lg; rr(g, -45, -12, 90, 24, 10); g.fill();
      g.strokeStyle = "rgba(40,24,14,.6)"; g.lineWidth = 1;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-38 + k * 22, -11); g.lineTo(-34 + k * 22, 11); g.stroke(); }
      g.fillStyle = "#c29463"; ellipse(g, 43, 0, 5, 11); g.fill();
      g.strokeStyle = "#8a613c"; g.lineWidth = 1.4; ellipse(g, 43, 0, 2.6, 6.5); g.stroke();
      g.restore();
    }
  }
  g.restore();
  // wood sign
  g.save();
  g.translate(WOODPILE.x, WOODPILE.y - 82);
  g.fillStyle = "rgba(0,0,0,.28)"; ellipse(g, 2, 7, 44, 10); g.fill();
  g.fillStyle = "#4a3020"; rr(g, -38, -13, 76, 26, 5); g.fill();
  g.strokeStyle = "rgba(255,205,150,.18)"; g.lineWidth = 1.2; rr(g, -38, -13, 76, 26, 5); g.stroke();
  g.fillStyle = "#e9c79a"; g.font = "800 12px Outfit, sans-serif"; g.textAlign = "center";
  g.fillText("WOOD", 2, 5);
  g.restore();
  // bin
  g.save();
  g.translate(BIN.x, BIN.y);
  g.fillStyle = "rgba(0,0,0,.34)"; ellipse(g, 0, 15, 44, 15); g.fill();
  const binG = g.createLinearGradient(-30, 0, 30, 0);
  binG.addColorStop(0, "#2c3237"); binG.addColorStop(0.45, "#4b5459"); binG.addColorStop(1, "#22272a");
  g.fillStyle = binG; rr(g, -28, -40, 56, 54, 8); g.fill();
  g.fillStyle = "#161b1e"; rr(g, -31, -48, 62, 12, 5); g.fill();
  g.fillStyle = "rgba(255,255,255,.09)"; rr(g, -24, -37, 7, 44, 3); g.fill();
  g.fillStyle = "#2b3134"; rr(g, -6, -54, 12, 10, 3); g.fill();
  g.fillStyle = "rgba(255,180,74,.6)"; g.font = "800 8px Outfit, sans-serif"; g.textAlign = "center"; g.fillText("BIN", 0, -14);
  g.restore();
  // cooler / drinks table
  g.save();
  g.translate(1288, 826);
  g.fillStyle = "rgba(0,0,0,.34)"; ellipse(g, 0, 20, 62, 18); g.fill();
  g.fillStyle = "#e8e3d6"; rr(g, -50, -40, 100, 52, 7); g.fill();
  g.fillStyle = "#2a7cab"; rr(g, -50, -40, 100, 32, 7); g.fill();
  g.fillStyle = "#1e5f86"; rr(g, -50, -40, 100, 11, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(-44, -35, 4, 20);
  g.fillStyle = "#f0ebdf"; rr(g, -54, -48, 108, 12, 5); g.fill();
  g.fillStyle = "#ffb24a"; g.font = "800 9px Outfit, sans-serif"; g.textAlign = "center"; g.fillText("BRAAI", 0, -17);
  g.fillStyle = "#e8e3d6"; g.fillRect(-54, 12, 8, 14); g.fillRect(46, 12, 8, 14);
  g.restore();
  // hose reel
  g.save();
  g.translate(1466, 812);
  g.fillStyle = "rgba(0,0,0,.32)"; ellipse(g, 0, 18, 40, 14); g.fill();
  g.fillStyle = "#25332f"; ellipse(g, 0, -12, 35, 35); g.fill();
  g.fillStyle = "#3b7f73"; ellipse(g, 0, -12, 29, 29); g.fill();
  g.fillStyle = "#1d2926"; ellipse(g, 0, -12, 21, 21); g.fill();
  g.strokeStyle = "#5cc0aa"; g.lineWidth = 3; ellipse(g, 0, -12, 25, 25); g.stroke();
  g.fillStyle = "#6d8a82"; rr(g, -3, 22, 6, 16, 2); g.fill();
  g.restore();
  // hose line across the deck
  g.strokeStyle = "rgba(54,132,115,.55)"; g.lineWidth = 4; g.lineCap = "round";
  g.beginPath(); g.moveTo(1458, 828);
  g.bezierCurveTo(1320, 872, 1120, 876, 940, 858);
  g.bezierCurveTo(760, 842, 560, 874, 380, 862);
  g.bezierCurveTo(260, 854, 190, 846, 128, 854);
  g.stroke();
  g.strokeStyle = "rgba(126,230,206,.22)"; g.lineWidth = 1.5; g.stroke();
  // plates stack
  g.save();
  g.translate(1018, 846);
  g.fillStyle = "rgba(0,0,0,.28)"; ellipse(g, 0, 12, 40, 12); g.fill();
  for (let i = 0; i < 7; i++) {
    g.fillStyle = i % 2 ? "#ddd6c8" : "#f2ece0"; ellipse(g, 0, -i * 3, 37, 9); g.fill();
    g.strokeStyle = "rgba(130,115,95,.35)"; g.lineWidth = 1; g.stroke();
  }
  g.restore();
  // Jennifer rug + side table
  g.save();
  g.translate(JEN.x, JEN.y + 26);
  const rug = g.createRadialGradient(0, 0, 8, 0, 0, 122);
  rug.addColorStop(0, "#66324a"); rug.addColorStop(0.65, "#4b2436"); rug.addColorStop(1, "#25131c");
  g.fillStyle = rug; ellipse(g, 0, 0, 122, 54); g.fill();
  g.strokeStyle = "rgba(255,184,120,.28)"; g.lineWidth = 2; ellipse(g, 0, 0, 112, 48); g.stroke();
  g.strokeStyle = "rgba(255,184,120,.14)"; g.lineWidth = 1; ellipse(g, 0, 0, 96, 40); g.stroke();
  g.restore();
  g.save();
  g.translate(JEN.x + 82, JEN.y + 46);
  g.fillStyle = "rgba(0,0,0,.3)"; ellipse(g, 0, 16, 26, 10); g.fill();
  g.fillStyle = "#3b2a20"; rr(g, -20, -20, 40, 38, 4); g.fill();
  g.fillStyle = "#5d4432"; rr(g, -23, -25, 46, 7, 3); g.fill();
  g.fillStyle = "#ff6f9e"; rr(g, -7, -42, 14, 18, 3); g.fill();
  g.fillStyle = "rgba(255,255,255,.55)"; rr(g, -7, -42, 14, 4, 2); g.fill();
  g.strokeStyle = "#d9dfe2"; g.lineWidth = 1; line(g, 0, -42, 0, -52);
  g.restore();
  return b;
}

/* ---------------------------------------------------------------- particles */
const fx = {
  smoke: [], embers: [], sparks: [], steam: [], hearts: [], texts: [], water: [], fireflies: [],
  shake: 0, flash: 0, haze: 0,
};
function initFireflies() {
  const R = rng(3311);
  fx.fireflies = Array.from({ length: 26 }, () => ({
    x: 40 + R() * 1520, y: 300 + R() * 380, p: R() * TAU, sp: 0.3 + R() * 0.8,
    amp: 12 + R() * 26, r: 0.8 + R() * 1.4,
  }));
}
function spawnSmoke(x, y, amt = 1, dark = false) {
  if (fx.smoke.length > 120) return;
  fx.smoke.push({
    x: x + (Math.random() - 0.5) * 26, y: y + (Math.random() - 0.5) * 12,
    vx: (Math.random() - 0.5) * 16, vy: -16 - Math.random() * 30 * amt,
    r: 9 + Math.random() * 18 * amt, life: 0, max: 2.2 + Math.random() * 2.6,
    a: (dark ? 0.14 : 0.08) * amt, rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 0.5,
    dark,
  });
}
function spawnEmber(x, y, spread = 40) {
  if (fx.embers.length > 150) return;
  fx.embers.push({
    x: x + (Math.random() - 0.5) * spread, y, vx: (Math.random() - 0.5) * 26,
    vy: -28 - Math.random() * 70, life: 0, max: 0.9 + Math.random() * 1.5,
    r: 0.8 + Math.random() * 2, hue: 22 + Math.random() * 26,
  });
}
function spawnSpark(x, y, color = "#ffd56b") {
  if (fx.sparks.length > 180) return;
  fx.sparks.push({
    x: x + (Math.random() - 0.5) * 46, y: y + (Math.random() - 0.5) * 14,
    vx: (Math.random() - 0.5) * 36, vy: -18 - Math.random() * 54,
    life: 0, max: 0.35 + Math.random() * 0.5, r: 0.7 + Math.random() * 1.6, color,
  });
}
function spawnSteam(x, y) {
  if (fx.steam.length > 90) return;
  fx.steam.push({
    x: x + (Math.random() - 0.5) * 90, y: y - 20, vx: (Math.random() - 0.5) * 14,
    vy: -46 - Math.random() * 38, r: 9 + Math.random() * 16, life: 0, max: 1.1 + Math.random() * 1.2,
    a: 0.18,
  });
}
function spawnHeart(x, y, color = "#ff6f9e", big = false) {
  if (fx.hearts.length > 90) return;
  fx.hearts.push({
    x, y, vx: (Math.random() - 0.5) * (big ? 120 : 54), vy: -50 - Math.random() * (big ? 110 : 46),
    life: 0, max: 1.2 + Math.random() * 1.2, s: (big ? 1.6 : 0.7) + Math.random() * (big ? 1.1 : 0.55),
    color, rot: (Math.random() - 0.5) * 0.8,
  });
}
function floatText(x, y, text, color = "#ffe4b3", size = 18, life = 1.5) {
  if (fx.texts.length > 24) fx.texts.shift();
  fx.texts.push({ x, y, text, color, size, life: 0, max: life });
}
function updateFx(dt, G) {
  fx.shake = Math.max(0, fx.shake - dt * 22);
  fx.flash = Math.max(0, fx.flash - dt * 2.6);
  for (let i = fx.smoke.length - 1; i >= 0; i--) {
    const p = fx.smoke[i]; p.life += dt;
    if (p.life > p.max) { fx.smoke.splice(i, 1); continue; }
    p.x += p.vx * dt + Math.sin(p.life * 1.2 + p.rot) * 4 * dt * 10;
    p.y += p.vy * dt; p.vy *= 0.996; p.r += dt * 8; p.rot += p.spin * dt;
  }
  for (let i = fx.embers.length - 1; i >= 0; i--) {
    const p = fx.embers[i]; p.life += dt;
    if (p.life > p.max) { fx.embers.splice(i, 1); continue; }
    p.x += p.vx * dt + Math.sin(p.life * 7 + p.r) * 12 * dt;
    p.y += p.vy * dt; p.vy += 12 * dt;
  }
  for (let i = fx.sparks.length - 1; i >= 0; i--) {
    const p = fx.sparks[i]; p.life += dt;
    if (p.life > p.max) { fx.sparks.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 48 * dt;
  }
  for (let i = fx.steam.length - 1; i >= 0; i--) {
    const p = fx.steam[i]; p.life += dt;
    if (p.life > p.max) { fx.steam.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 13;
  }
  for (let i = fx.hearts.length - 1; i >= 0; i--) {
    const p = fx.hearts[i]; p.life += dt;
    if (p.life > p.max) { fx.hearts.splice(i, 1); continue; }
    p.x += p.vx * dt + Math.sin(p.life * 5 + p.s) * 10 * dt; p.y += p.vy * dt;
  }
  for (let i = fx.texts.length - 1; i >= 0; i--) {
    const p = fx.texts[i]; p.life += dt; p.y -= 34 * dt;
    if (p.life > p.max) fx.texts.splice(i, 1);
  }
  if (!G || G.phase === "menu") return;
  // continuous fire particles
  const t = performance.now() / 1000;
  for (let z = 0; z < G.zones.length; z++) {
    const zn = G.zones[z];
    const cx = zoneCenter(z);
    if (zn.flame > 0.08) {
      if (Math.random() < dt * (5 + zn.flame * 12)) spawnEmber(cx + (Math.random() - 0.5) * ZONE_W, 448, ZONE_W * 0.7);
    }
    if (zn.coal > 0.16) {
      if (Math.random() < dt * (1.7 + zn.coal * 3.2)) spawnSmoke(cx + (Math.random() - 0.5) * ZONE_W * 0.8, 430, 0.8 + zn.coal * 0.7);
    }
    if (zn.wet > 0.05 && Math.random() < dt * 10) spawnSteam(cx + (Math.random() - 0.5) * ZONE_W, 420);
  }
  // sizzle sparks off meat
  for (let i = 0; i < G.slots.length; i++) {
    const it = G.slots[i];
    if (!it) continue;
    const h = zoneHeat(G.zones[slotZone(i)]);
    if (h < 0.35) continue;
    const s = slotPos(i);
    if (Math.random() < dt * (0.7 + h * 2.2)) spawnSpark(s.x, s.y + 4);
    if (it.ch > 0.35 && Math.random() < dt * 2.2) spawnSmoke(s.x, s.y - 8, 0.55, true);
  }
  // fireflies
  for (const f of fx.fireflies) f.p += dt * f.sp;
}

/* --------------------------------------------------------------- fx event */
let lastEventId = 0;
function processEvents(G) {
  for (const e of G.events) {
    if (e.id <= lastEventId) continue;
    lastEventId = e.id;
    handleEvent(e);
    if (e.kind === "flare") banner("FLARE-UP!", "Spray it before the meat burns", "#ff9258");
    else if (e.kind === "guestleave") banner("GUEST LEFT", "The vibe takes a knock", "#d8c4b0");
    else if (e.kind === "streak") banner(`${e.txt} PERFECT IN A ROW`, "The party is loving it", "#ffd56b");
  }
}
function handleEvent(e) {
  const pan = e.pan || 0;
  switch (e.kind) {
    case "perfect":
      for (let i = 0; i < 9; i++) spawnHeart(e.x + (Math.random() - 0.5) * 50, e.y - 20, i % 3 ? "#ffd56b" : "#ff6f9e", true);
      floatText(e.x, e.y - 38, "PERFECT!", "#a8e063", 24, 1.5);
      sound.sfx("perfect", pan);
      fx.flash = Math.min(0.18, fx.flash + 0.1);
      break;
    case "good":
      for (let i = 0; i < 3; i++) spawnHeart(e.x, e.y - 20, "#ffd56b");
      floatText(e.x, e.y - 34, "GOOD", "#ffd56b", 17, 1.2);
      sound.sfx("good", pan);
      break;
    case "raw":
      floatText(e.x, e.y - 34, "RAW!", "#ff8f9c", 20, 1.4);
      sound.sfx("raw", pan);
      break;
    case "over":
      floatText(e.x, e.y - 34, "OVERCOOKED", "#ff8a66", 18, 1.4);
      sound.sfx("over", pan);
      break;
    case "ruined":
      floatText(e.x, e.y - 34, "RUINED", "#ff5c46", 20, 1.4);
      for (let i = 0; i < 8; i++) spawnSmoke(e.x, e.y - 10, 0.7, true);
      sound.sfx("ruined", pan);
      break;
    case "guestleave":
      floatText(e.x, e.y - 40, "LEFT HUNGRY", "#c4b2a0", 14, 1.5);
      sound.sfx("guestleave", pan);
      break;
    case "flare":
      fx.shake = 10;
      fx.flash = Math.min(0.4, fx.flash + 0.22);
      floatText(e.x, 350, "FLARE-UP!", "#ff6a2b", 26, 1.6);
      for (let i = 0; i < 20; i++) spawnEmber(e.x + (Math.random() - 0.5) * 240, 420, 240);
      for (let i = 0; i < 10; i++) spawnSmoke(e.x + (Math.random() - 0.5) * 220, 400, 1.3, true);
      sound.sfx("flare", pan);
      break;
    case "toss":
      for (let i = 0; i < 16; i++) spawnEmber(e.x + (Math.random() - 0.5) * 90, 438, 80);
      sound.sfx("toss", pan);
      break;
    case "wood": sound.sfx("wood", pan); break;
    case "place": sound.sfx("place", pan); for (let i = 0; i < 6; i++) spawnSpark(e.x, e.y); break;
    case "flip": sound.sfx("flip", pan); for (let i = 0; i < 5; i++) spawnSpark(e.x, e.y); break;
    case "pick":
      sound.sfx("pick", pan);
      if (e.txt === "Perfect") floatText(e.x, e.y - 24, "PERFECT PICK", "#a8e063", 14, 1.1);
      else floatText(e.x, e.y - 24, e.txt || "", "#ffe4b3", 13, 0.9);
      break;
    case "grab": sound.sfx("grab", pan); break;
    case "bin": sound.sfx("wood", pan); break;
    case "hint":
      sound.sfx("select", pan);
      toast(e.txt);
      break;
    case "streak":
      sound.sfx("perfect", pan);
      break;
    case "win":
      sound.sfx("win");
      for (let i = 0; i < 26; i++) spawnHeart(200 + Math.random() * 1200, 500 + Math.random() * 260, i % 2 ? "#ff6f9e" : "#ffd56b", true);
      fx.flash = 0.55;
      break;
    case "lose": sound.sfx("lose"); break;
  }
}

/* ------------------------------------------------------------------- fire */
function drawCoals(g, G, time) {
  for (let z = 0; z < G.zones.length; z++) {
    const zn = G.zones[z];
    const cx = zoneCenter(z);
    const inten = clamp(zn.coal + zn.flame * 0.2, 0, 1.3);
    // under-glow
    g.save();
    g.globalCompositeOperation = "lighter";
    glowCircle(g, cx, 430, 230, `rgba(255,96,22,${0.08 + inten * 0.2})`, "rgba(255,60,10,0)");
    glowCircle(g, cx, 430, 120, `rgba(255,155,48,${0.06 + inten * 0.16})`, "rgba(255,120,20,0)");
    g.restore();
    const R = rng(zn.seed || 99);
    const n = 42;
    for (let i = 0; i < n; i++) {
      const px = BRAAI.x0 + z * ZONE_W + 12 + R() * (ZONE_W - 24);
      const py = 320 + R() * 174;
      const fl = 0.55 + 0.45 * Math.sin(time * (1.1 + R() * 2.4) + i * 2.7);
      const heat = clamp(inten * fl, 0, 1.2);
      if (heat < 0.08) continue;
      const rr2 = 2 + R() * 5;
      g.fillStyle = `rgba(${Math.round(70 + 180 * heat)},${Math.round(28 + 92 * heat)},${Math.round(16 + 18 * heat)},${0.32 + heat * 0.55})`;
      ellipse(g, px, py, rr2 * (0.8 + fl * 0.5), rr2 * 0.62); g.fill();
    }
    // logs
    for (let li = 0; li < zn.logs.length; li++) {
      const l = zn.logs[li];
      const prog = clamp(1 - l.ign / FIRE.ignite, 0, 1);
      const lx = cx + ((li % 3) - 1) * 46 + Math.sin((l.seed || 0)) * 12;
      const ly = 398 + ((li / 3) | 0) * 30 + ((l.seed || 0) % 10) - 5;
      g.save(); g.translate(lx, ly); g.rotate((((l.seed || 0) % 20) - 10) * 0.035);
      const lg = g.createLinearGradient(0, -9, 0, 9);
      lg.addColorStop(0, "#3b2416"); lg.addColorStop(0.5, "#1d120c"); lg.addColorStop(1, "#0f0907");
      g.fillStyle = lg; rr(g, -34, -9, 68, 18, 8); g.fill();
      g.strokeStyle = `rgba(255,${90 + prog * 80 | 0},30,${0.18 + prog * 0.6})`; g.lineWidth = 1.6;
      rr(g, -34, -9, 68, 18, 8); g.stroke();
      g.fillStyle = `rgba(255,${110 + prog * 100 | 0},40,${0.12 + prog * 0.5})`;
      for (let k = 0; k < 4; k++) { ellipse(g, -24 + k * 16, -4 + (k % 2) * 5, 4 + prog * 3, 2 + prog * 2); g.fill(); }
      g.fillStyle = "#b18355"; ellipse(g, 34, 0, 4, 8); g.fill();
      g.restore();
    }
  }
}
function drawFlames(g, G, time) {
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let z = 0; z < G.zones.length; z++) {
    const zn = G.zones[z];
    const cx = zoneCenter(z);
    const power = clamp(zn.flame + zn.coal * 0.44 + 0.025 * Math.sin(time * 3.1 + z * 1.7) - zn.wet * 0.55, 0, 1.7);
    if (power < 0.06) continue;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const r = rng((zn.seed || 7) * 17 + i * 31);
      const bx = cx + (r() - 0.5) * ZONE_W * 0.95;
      const speed = 1.5 + r() * 2.1;
      const ph = time * speed + i * 2.1;
      const h = (26 + power * (65 + r() * 105)) * (0.7 + 0.3 * Math.sin(ph));
      const w = 5 + power * (10 + r() * 8);
      const sway = Math.sin(ph * 0.8 + i) * (5 + power * 12);
      const tipX = bx + sway * 1.8;
      const top = 438 - h;
      const grad = g.createLinearGradient(bx, 456, tipX, top);
      grad.addColorStop(0, `rgba(255,${130 + r() * 60 | 0},40,${0.038 + power * 0.085})`);
      grad.addColorStop(0.35, `rgba(255,${100 + r() * 60 | 0},24,${0.055 + power * 0.12})`);
      grad.addColorStop(0.75, `rgba(255,${60 + r() * 40 | 0},10,${0.03 + power * 0.065})`);
      grad.addColorStop(1, "rgba(255,40,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(bx - w, 448);
      g.bezierCurveTo(bx - w * 0.9, 448 - h * 0.32, tipX - w * 0.35, top + h * 0.3, tipX, top);
      g.bezierCurveTo(tipX + w * 0.4, top + h * 0.28, bx + w * 0.9, 448 - h * 0.3, bx + w, 448);
      g.quadraticCurveTo(bx, 462, bx - w, 448);
      g.fill();
      if (power > 0.55) {
        const cg = g.createLinearGradient(bx, 452, tipX, top + h * 0.3);
        cg.addColorStop(0, `rgba(255,245,190,${0.035 + power * 0.06})`);
        cg.addColorStop(0.65, `rgba(255,210,90,${0.018 + power * 0.035})`);
        cg.addColorStop(1, "rgba(255,170,40,0)");
        g.fillStyle = cg;
        g.beginPath();
        g.moveTo(bx - w * 0.45, 452);
        g.bezierCurveTo(bx - w * 0.35, 452 - h * 0.4, tipX - w * 0.2, top + h * 0.45, tipX, top + h * 0.25);
        g.bezierCurveTo(tipX + w * 0.2, top + h * 0.45, bx + w * 0.35, 452 - h * 0.4, bx + w * 0.45, 452);
        g.fill();
      }
    }
    // hot core
    glowCircle(g, cx, 444, ZONE_W * 0.42, `rgba(255,190,80,${0.018 + power * 0.045})`, "rgba(255,120,20,0)");
  }
  g.restore();
}
function drawGrate(g) {
  // long bars
  g.save();
  for (let row = 0; row < 5; row++) {
    const y = 326 + row * 38;
    const lg = g.createLinearGradient(0, y - 3, 0, y + 3);
    lg.addColorStop(0, "#e5dfd4"); lg.addColorStop(0.32, "#8f8c85");
    lg.addColorStop(0.55, "#454b4f"); lg.addColorStop(0.8, "#a4a39c"); lg.addColorStop(1, "#33383b");
    g.fillStyle = lg;
    rr(g, BRAAI.x0 + 2, y - 3, BRAAI.x1 - BRAAI.x0 - 4, 5.5, 2.5); g.fill();
    g.fillStyle = "rgba(255,255,255,.2)";
    g.fillRect(BRAAI.x0 + 8, y - 2.2, BRAAI.x1 - BRAAI.x0 - 16, 1);
  }
  // cross bars
  for (let c = 0; c <= BRAAI.cols; c += 2) {
    const x = BRAAI.x0 + (c / BRAAI.cols) * (BRAAI.x1 - BRAAI.x0);
    const lg = g.createLinearGradient(x - 2.5, 0, x + 3.5, 0);
    lg.addColorStop(0, "#34393c"); lg.addColorStop(0.4, "#b6b4ad"); lg.addColorStop(0.7, "#666b6d"); lg.addColorStop(1, "#2b3032");
    g.fillStyle = lg;
    rr(g, x - 2.6, 312, 5.2, 192, 2.6); g.fill();
    g.fillStyle = "rgba(255,255,255,.16)"; g.fillRect(x - 1.5, 316, 1, 184);
    g.fillStyle = "rgba(20,16,13,.5)"; ellipse(g, x, 315, 4.5, 2.5); g.fill();
    ellipse(g, x, 501, 4.5, 2.5); g.fill();
  }
  // subtle heat haze on bars
  g.globalCompositeOperation = "lighter";
  g.fillStyle = "rgba(255,120,40,.03)";
  g.fillRect(BRAAI.x0, 330, BRAAI.x1 - BRAAI.x0, 160);
  g.restore();
}

/* ------------------------------------------------------------------- meat */
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
    if (ch > 0.12) { g.fillStyle = burnt; for (let i = 0; i < 9; i++) { const a = i * 2.1; ellipse(g, Math.cos(a) * 21, Math.sin(a) * 15, 2 + (i % 3), 1.5); g.fill(); } }
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
    for (let i = 0; i < 30; i++) { ellipse(g, -24 + KR() * 48, -7 + KR() * 14, 1.8, 1.4); g.fill(); }
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
function drawSlotGauge(g, i, it, time) {
  const d = MEATS[it.type];
  const total = it.a + it.b;
  const s = slotPos(i);
  const w = 70, h = 4.5, x = s.x - w / 2, y = s.y + 31;
  const q = qualityOf(it);
  const perfect = q === "perfect";
  g.save();
  g.fillStyle = "rgba(10,7,5,.7)"; rr(g, x - 1, y - 1, w + 2, h + 2, 3); g.fill();
  // target window
  const lo = inv(0, 1.08, d.lo), hi = inv(0, 1.08, d.hi);
  g.fillStyle = "rgba(139,212,80,.38)"; g.fillRect(x + w * lo, y, w * (hi - lo), h);
  g.strokeStyle = perfect ? "rgba(190,255,130,.95)" : "rgba(139,212,80,.50)"; g.lineWidth = 1;
  g.strokeRect(x + w * lo, y - 0.5, w * (hi - lo), h + 1);
  // fill
  const fill = clamp(total / 1.08, 0, 1);
  if (!perfect) {
    const fg = g.createLinearGradient(x, 0, x + w, 0);
    fg.addColorStop(0, "#e07a7d"); fg.addColorStop(0.5, "#b76c3a"); fg.addColorStop(1, "#5c2f18");
    g.fillStyle = fg; g.fillRect(x, y, w * fill, h);
  } else {
    g.fillStyle = "rgba(168,224,99,.9)"; g.fillRect(x, y, w * fill, h);
  }
  g.fillStyle = "rgba(255,240,210,.92)"; g.fillRect(x + w * fill - 1, y - 2.5, 2, h + 5);
  if (it.ch > 0.18) {
    g.fillStyle = `rgba(30,18,12,${0.25 + it.ch * 0.5})`; g.fillRect(x, y, w, h);
  }
  // perfect pulse
  if (perfect) {
    const a = 0.24 + 0.14 * Math.sin(time * 5 + i);
    g.strokeStyle = `rgba(168,224,99,${a})`; g.lineWidth = 2;
    rr(g, s.x - 43, s.y - 29, 86, 58, 10); g.stroke();
    g.fillStyle = "#c6ff8f"; g.font = "800 8px Outfit, sans-serif"; g.textAlign = "center";
    g.fillText("READY", s.x, y + 13);
  } else if (it.ch > 0.45) {
    g.fillStyle = "#ff6a4d"; g.font = "800 8px Outfit, sans-serif"; g.textAlign = "center";
    g.fillText("BURNING", s.x, y + 13);
  }
  g.restore();
}
function drawSlots(g, G, time, localId) {
  const local = G.players.find((p) => p.id === localId);
  let nearSlot = -1;
  if (local && nearBraai(local)) {
    if (local.carry && local.carry.k === "m") nearSlot = findEmptySlot(G, local);
    else if (!local.carry) nearSlot = findItemSlot(G, local);
  }
  // empty-slot hint
  if (local && nearBraai(local) && local.carry && local.carry.k === "m" && nearSlot >= 0) {
    const s = slotPos(nearSlot);
    g.save();
    g.setLineDash([6, 5]); g.lineDashOffset = -time * 24;
    g.strokeStyle = "rgba(255,205,130,.7)"; g.lineWidth = 2;
    rr(g, s.x - 40, s.y - 28, 80, 54, 10); g.stroke();
    g.setLineDash([]);
    g.fillStyle = "rgba(255,205,130,.10)"; rr(g, s.x - 40, s.y - 28, 80, 54, 10); g.fill();
    g.restore();
  }
  for (let i = 0; i < SLOT_COUNT; i++) {
    const it = G.slots[i];
    if (!it) continue;
    const s = slotPos(i);
    if (i === nearSlot && local && !local.carry) {
      g.save();
      g.setLineDash([5, 4]); g.lineDashOffset = -time * 20;
      g.strokeStyle = "rgba(255,244,220,.55)"; g.lineWidth = 1.6;
      rr(g, s.x - 42, s.y - 28, 84, 56, 10); g.stroke(); g.restore();
    }
    const q = qualityOf(it);
    // dark pad to lift the meat off the busy fire
    g.save();
    const pad = g.createRadialGradient(s.x, s.y + 4, 3, s.x, s.y + 4, 55);
    pad.addColorStop(0, "rgba(8,5,3,.58)"); pad.addColorStop(0.65, "rgba(8,5,3,.26)"); pad.addColorStop(1, "rgba(8,5,3,0)");
    g.fillStyle = pad; ellipse(g, s.x, s.y + 4, 55, 38); g.fill();
    g.restore();
    if (q === "perfect") {
      g.save(); g.globalCompositeOperation = "lighter";
      glowCircle(g, s.x, s.y, 46, `rgba(168,224,99,${0.10 + 0.06 * Math.sin(time * 4 + i)})`, "rgba(168,224,99,0)");
      g.restore();
    }
    drawMeat(g, it.type, s.x, s.y, 1.06, it, time);
    drawSlotGauge(g, i, it, time);
  }
}

/* ------------------------------------------------------------------ props */
function drawDeckProps(g, G, time) {
  // firewood pile glow / loose logs
  const zn = G.zones;
  // bin lid swing
  g.save();
  g.translate(BIN.x, BIN.y);
  if (G.phase !== "menu" && Math.random() < 0.002) spawnSmoke(BIN.x, BIN.y - 20, 0.3, true);
  g.restore();
  // woodpile small labels
  const wp = G.players.some((p) => distTo(p, WOODPILE) < WOODPILE.r);
  if (wp) {
    g.save();
    g.globalAlpha = 0.7 + 0.2 * Math.sin(time * 4);
    g.strokeStyle = "rgba(255,205,130,.55)"; g.lineWidth = 2;
    rr(g, WOODPILE.x - 100, WOODPILE.y - 48, 200, 86, 14); g.stroke();
    g.fillStyle = "#ffe4b3"; g.font = "700 11px Outfit, sans-serif"; g.textAlign = "center";
    g.fillText("FIREWOOD", WOODPILE.x, WOODPILE.y - 58);
    g.restore();
  }
  // zone warnings
  for (let z = 0; z < zn.length; z++) {
    const zone = zn[z];
    const cx = zoneCenter(z);
    if (zone.flame > 0.86) {
      const a = 0.65 + 0.35 * Math.sin(time * 8);
      g.save();
      g.globalAlpha = a;
      g.fillStyle = "rgba(255,94,45,.92)";
      rr(g, cx - 44, 262, 88, 25, 12); g.fill();
      g.fillStyle = "#1a0c06"; g.font = "800 10px Outfit, sans-serif"; g.textAlign = "center";
      g.fillText("FLARE RISK", cx, 279);
      g.restore();
    } else if (zone.coal < 0.14) {
      g.save();
      g.globalAlpha = 0.6 + 0.2 * Math.sin(time * 3);
      g.fillStyle = "rgba(120,150,170,.20)";
      rr(g, cx - 32, 266, 64, 21, 10); g.fill();
      g.strokeStyle = "rgba(160,200,220,.4)"; g.lineWidth = 1; rr(g, cx - 32, 266, 64, 21, 10); g.stroke();
      g.fillStyle = "#bcdceb"; g.font = "800 9px Outfit, sans-serif"; g.textAlign = "center";
      g.fillText("COLD", cx, 280);
      g.restore();
    }
  }
}
/* ----------------------------------------------------------------- people */
const SKINS = ["#f0c7a2", "#e2ab7d", "#c98b62", "#a86c47", "#8f5d3c", "#7a4a30", "#5c3522", "#4a2a1b"];
const HAIRS = ["#19100b", "#2a1810", "#3b2417", "#4b3020", "#6b4026", "#b86a32", "#d7a14a", "#e3c27a", "#8a8a8a"];
function chefLook(id) {
  const h = hash32("chef-look-" + id);
  return {
    skin: SKINS[h % SKINS.length], hair: HAIRS[(h >>> 3) % HAIRS.length],
    hat: (h >>> 6) % 4, hairStyle: (h >>> 8) % 4,
    apron: (h >>> 10) % 3, facial: (h >>> 12) % 3,
  };
}
function drawShadow(g, x, y, rx = 28, ry = 9) {
  const gr = g.createRadialGradient(x, y, 1, x, y, rx);
  gr.addColorStop(0, "rgba(0,0,0,.42)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; ellipse(g, x, y, rx, ry); g.fill();
}
function limb(g, x1, y1, x2, y2, w, color) {
  g.strokeStyle = color; g.lineWidth = w; g.lineCap = "round";
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
function drawHair(g, style, color, headY, r) {
  g.fillStyle = color;
  if (style === 0) {
    g.beginPath();
    g.arc(0, headY - 3, r + 1.5, Math.PI * 0.92, Math.PI * 2.08);
    g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.10)";
    g.beginPath(); g.arc(-5, headY - 8, 7, Math.PI * 1.05, Math.PI * 1.7); g.fill();
  } else if (style === 1) {
    g.beginPath(); g.arc(0, headY, r + 2, Math.PI * 0.78, Math.PI * 2.22); g.fill();
    rr(g, -r - 2, headY - 2, 7, 25, 3); g.fill();
    rr(g, r - 5, headY - 2, 7, 25, 3); g.fill();
  } else if (style === 2) {
    g.beginPath(); g.arc(0, headY - 2, r + 1, Math.PI * 0.9, Math.PI * 2.1); g.fill();
    g.beginPath(); g.arc(0, headY - r - 5, r * 0.44, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,.1)"; g.beginPath(); g.arc(-3, headY - r - 8, 3, 0, TAU); g.fill();
  } else {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + i * 0.34;
      g.beginPath(); g.arc(Math.cos(a) * (r - 2), headY + Math.sin(a) * (r - 1), r * 0.42, 0, TAU); g.fill();
    }
  }
}
function drawGuestFigure(g, guest, time, x, y, scale = 1, opts = {}) {
  const look = guest.look || guestLook(guest.id);
  const state = guest.state || "waiting";
  const mood = opts.mood || state;
  const R = rng(hash32("gl" + guest.id));
  const sway = Math.sin(time * 1.5 + (guest.id || 0) * 1.7) * 1.2;
  const bounce = state === "happy" ? Math.abs(Math.sin(time * 7)) * -5 : 0;
  const shake = state === "angry" ? Math.sin(time * 28) * 1.6 : 0;
  const s = scale * look.height;
  g.save();
  drawShadow(g, x, y + 2, 28 * s, 8 * s);
  g.translate(x + sway + shake, y + bounce);
  g.scale(s, s);
  const walk = state === "walkin" || state === "leaving" ? (guest.walk || 0) : time * 0.6;
  const swing = Math.sin(walk * 5) * (state === "walkin" || state === "leaving" ? 8 : 0.7);
  const pants = "#2d2a33";
  // legs
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1;
    g.save(); g.translate(side * 8, -34); g.rotate(side * swing * 0.035);
    g.fillStyle = pants; rr(g, -6, 0, 12, 31, 5); g.fill();
    g.fillStyle = "#171317"; rr(g, -7, 27, 15, 8, 4); g.fill();
    g.restore();
  }
  // torso
  const sh = look.shirt;
  const tg = g.createLinearGradient(-18, -92, 18, -34);
  tg.addColorStop(0, sh); tg.addColorStop(0.55, sh); tg.addColorStop(1, "rgba(0,0,0,.32)");
  g.fillStyle = tg;
  g.beginPath();
  g.moveTo(-20, -90); g.quadraticCurveTo(-25, -70, -18, -52);
  g.quadraticCurveTo(-16, -35, -12, -32);
  g.lineTo(12, -32); g.quadraticCurveTo(16, -35, 18, -52);
  g.quadraticCurveTo(25, -70, 20, -90);
  g.quadraticCurveTo(0, -98, -20, -90); g.closePath(); g.fill();
  // collar
  g.fillStyle = "rgba(255,255,255,.16)";
  g.beginPath(); g.moveTo(-10, -91); g.lineTo(0, -80); g.lineTo(10, -91); g.closePath(); g.fill();
  // arms
  const armCol = look.skin;
  const holding = state === "waiting" || state === "happy" || state === "angry";
  if (holding) {
    limb(g, -19, -82, -25, -60, 9, sh);
    limb(g, -25, -60, -14, -50, 8, armCol);
    limb(g, 19, -82, 25, -60, 9, sh);
    limb(g, 25, -60, 14, -50, 8, armCol);
    // plate
    g.fillStyle = "rgba(0,0,0,.18)"; ellipse(g, 0, -42, 25, 6); g.fill();
    g.fillStyle = "#efe9dc"; ellipse(g, 0, -45, 24, 7); g.fill();
    g.strokeStyle = "rgba(150,135,115,.4)"; g.lineWidth = 1; ellipse(g, 0, -45, 24, 7); g.stroke();
    g.fillStyle = "rgba(255,255,255,.5)"; ellipse(g, -4, -48, 10, 2.3); g.fill();
  } else {
    limb(g, -19, -82, -26, -56, 9, sh);
    limb(g, -26, -56, -23, -40, 8, armCol);
    limb(g, 19, -82, 26, -56, 9, sh);
    limb(g, 26, -56, 23, -40, 8, armCol);
  }
  // neck
  g.fillStyle = look.skin; rr(g, -6, -100, 12, 12, 4); g.fill();
  // head
  const headY = -113;
  const hg = g.createRadialGradient(-6, headY - 6, 2, 0, headY, 22);
  hg.addColorStop(0, "rgba(255,240,215,.55)"); hg.addColorStop(0.3, look.skin);
  hg.addColorStop(1, "rgba(70,35,20,.55)");
  g.fillStyle = hg; ellipse(g, 0, headY, 18, 20); g.fill();
  // ears
  g.fillStyle = look.skin; ellipse(g, -17, headY + 2, 4, 5.5); g.fill(); ellipse(g, 17, headY + 2, 4, 5.5); g.fill();
  drawHair(g, look.hairStyle, look.hair, headY, 18);
  // face
  const blink = Math.sin(time * 1.8 + (guest.id || 0) * 2.3) > 0.975;
  g.fillStyle = "#24150e";
  if (mood === "happy") {
    g.strokeStyle = "#24150e"; g.lineWidth = 1.7;
    g.beginPath(); g.arc(-6, headY - 1, 3, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.beginPath(); g.arc(6, headY - 1, 3, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  } else if (mood === "angry") {
    g.strokeStyle = "#24150e"; g.lineWidth = 1.8;
    line(g, -9, headY - 8, -3, headY - 5); line(g, 9, headY - 8, 3, headY - 5);
    ellipse(g, -6, headY, 2.2, 2.2); g.fill(); ellipse(g, 6, headY, 2.2, 2.2); g.fill();
  } else if (blink) {
    g.strokeStyle = "#24150e"; g.lineWidth = 1.4;
    line(g, -8, headY, -4, headY); line(g, 4, headY, 8, headY);
  } else {
    ellipse(g, -6, headY - 1, 2.4, 2.8); g.fill(); ellipse(g, 6, headY - 1, 2.4, 2.8); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; ellipse(g, -5.2, headY - 2, 0.8, 1); g.fill(); ellipse(g, 6.8, headY - 2, 0.8, 1); g.fill();
  }
  // nose + mouth
  g.strokeStyle = "rgba(70,32,18,.55)"; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(0, headY + 1); g.quadraticCurveTo(-1, headY + 5, 2, headY + 4); g.stroke();
  if (mood === "happy") {
    g.fillStyle = "#7d2e28";
    g.beginPath(); g.arc(0, headY + 8, 6, 0.1, Math.PI - 0.1); g.fill();
    g.fillStyle = "#fff"; rr(g, -4, headY + 8, 8, 2.5, 1); g.fill();
    g.fillStyle = "rgba(255,120,120,.2)"; ellipse(g, -11, headY + 7, 3.5, 2); g.fill(); ellipse(g, 11, headY + 7, 3.5, 2); g.fill();
  } else if (mood === "angry") {
    g.strokeStyle = "#5b211c"; g.lineWidth = 1.8;
    g.beginPath(); g.arc(0, headY + 12, 5, Math.PI + 0.25, TAU - 0.25); g.stroke();
  } else {
    g.strokeStyle = "#6d2e28"; g.lineWidth = 1.4;
    g.beginPath(); g.arc(0, headY + 7, 4, 0.2, Math.PI - 0.2); g.stroke();
  }
  // accessories
  if (look.accessory === 1) {
    g.fillStyle = "rgba(20,24,28,.88)"; rr(g, -14, headY - 7, 11, 5, 2); g.fill(); rr(g, 3, headY - 7, 11, 5, 2); g.fill();
    g.strokeStyle = "rgba(20,24,28,.88)"; g.lineWidth = 1.3; line(g, -3, headY - 5, 3, headY - 5);
  } else if (look.accessory === 2) {
    g.fillStyle = "#ffb24a";
    g.beginPath(); g.moveTo(-10, headY - 17); g.lineTo(10, headY - 17); g.lineTo(4, headY - 35); g.closePath(); g.fill();
    g.fillStyle = "#ff8a3d"; g.beginPath(); g.moveTo(-10, headY - 17); g.lineTo(-2, headY - 17); g.lineTo(4, headY - 35); g.closePath(); g.fill();
    g.fillStyle = "#ffe4b3"; ellipse(g, 4, headY - 35, 2, 2); g.fill();
  } else if (look.accessory === 3) {
    g.strokeStyle = "#ffd56b"; g.lineWidth = 1.2;
    ellipse(g, -17, headY + 5, 2.2, 3); g.stroke(); ellipse(g, 17, headY + 5, 2.2, 3); g.stroke();
  }
  g.restore();
}
function drawGuestBubble(g, guest, time, x, y, scale = 1) {
  const st = guest.state;
  if (!st || st === "leaving") return;
  const s = scale;
  const bx = x, by = y - 172 * s;
  const w = 136, h = 50;
  const accent = MEATS[guest.order] ? MEATS[guest.order].accent : "#ffb24a";
  const w2 = w / 2;
  g.save();
  // connector
  g.fillStyle = "rgba(18,12,9,.93)";
  g.beginPath(); g.moveTo(bx - 7, by + h - 2); g.lineTo(bx + 2, by + h + 10); g.lineTo(bx + 7, by + h - 2); g.closePath(); g.fill();
  const bg = g.createLinearGradient(0, by, 0, by + h);
  bg.addColorStop(0, "rgba(43,28,20,.97)"); bg.addColorStop(1, "rgba(17,11,8,.97)");
  g.fillStyle = bg; rr(g, bx - w2, by, w, h, 11); g.fill();
  g.strokeStyle = "rgba(255,224,186,.18)"; g.lineWidth = 1.2; rr(g, bx - w2, by, w, h, 11); g.stroke();
  // meat icon
  g.save();
  g.beginPath(); rr(g, bx - w2 + 7, by + 8, 36, 32, 8); g.clip();
  g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(bx - w2 + 7, by + 8, 36, 32);
  drawMeat(g, guest.order, bx - w2 + 25, by + 25, 0.34, { a: MEATS[guest.order].hi * 0.5, b: MEATS[guest.order].hi * 0.4, ch: 0, flipT: 0, placeT: 0 }, time);
  g.restore();
  g.strokeStyle = accent; g.globalAlpha = 0.35; g.lineWidth = 1; rr(g, bx - w2 + 7, by + 8, 36, 32, 8); g.stroke(); g.globalAlpha = 1;
  // text
  g.textAlign = "left";
  g.fillStyle = "rgba(255,240,220,.55)"; g.font = "700 8px Outfit, sans-serif";
  g.fillText(guest.name.toUpperCase(), bx - w2 + 50, by + 19);
  g.fillStyle = "#fff1da"; g.font = "700 12px Outfit, sans-serif";
  g.fillText(MEATS[guest.order].name, bx - w2 + 50, by + 34);
  // patience
  if (st === "waiting") {
    const ratio = clamp(guest.patience / (guest.maxPat || 1), 0, 1);
    const col = ratio > 0.55 ? "#8bd450" : ratio > 0.25 ? "#ffb24a" : "#ff5c46";
    g.fillStyle = "rgba(0,0,0,.45)"; rr(g, bx - w2 + 9, by + 41, w - 18, 4, 2); g.fill();
    g.fillStyle = col; rr(g, bx - w2 + 9, by + 41, (w - 18) * ratio, 4, 2); g.fill();
  } else if (st === "happy") {
    g.fillStyle = "#a8e063"; g.font = "800 8px Outfit, sans-serif"; g.textAlign = "center";
    g.fillText(guest.reactText || "LEKKER!", bx, by + 46);
  } else if (st === "angry") {
    g.fillStyle = "#ff6a4d"; g.font = "800 8px Outfit, sans-serif"; g.textAlign = "center";
    g.fillText(guest.reactText || "EISH!", bx, by + 46);
  } else if (st === "walkin") {
    g.fillStyle = "rgba(255,240,220,.45)"; g.font = "800 9px Outfit, sans-serif"; g.textAlign = "center";
    g.fillText("…", bx, by + 45);
  }
  g.restore();
}

/* ------------------------------------------------------------------ chefs */
function drawChefFigure(g, p, time, x, y, scale = 1, opts = {}) {
  const look = chefLook(p.id);
  const faceDir = (p.dir || 1) >= 0 ? 1 : -1;
  const walking = p.moving !== false && opts.walking !== false;
  const swing = Math.sin((p.walk || 0) * 2.4) * (walking ? 7 : 0.7);
  const bob = walking ? Math.abs(Math.sin((p.walk || 0) * 2.4)) * -1.8 : Math.sin(time * 1.4 + (p.id || "a").length) * 0.8;
  const carry = p.carry;
  g.save();
  drawShadow(g, x, y + 2, 31 * scale, 10 * scale);
  g.translate(x, y + bob);
  g.scale(scale * faceDir, scale);
  // legs
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1;
    g.save(); g.translate(side * 8, -36); g.rotate(side * swing * 0.032);
    const pg = g.createLinearGradient(-6, 0, 6, 30);
    pg.addColorStop(0, "#3b3442"); pg.addColorStop(1, "#221e29");
    g.fillStyle = pg; rr(g, -6.5, 0, 13, 32, 5); g.fill();
    g.fillStyle = "#141117"; rr(g, -8, 28, 16, 9, 4); g.fill();
    g.fillStyle = "rgba(255,255,255,.08)"; rr(g, -7, 30, 13, 2.5, 1); g.fill();
    g.restore();
  }
  // torso / shirt
  const shirt = p.color || "#ffb24a";
  const tg = g.createLinearGradient(-20, -96, 20, -34);
  tg.addColorStop(0, shirt);
  tg.addColorStop(0.55, shirt);
  tg.addColorStop(1, "rgba(0,0,0,.42)");
  g.fillStyle = tg;
  g.beginPath();
  g.moveTo(-21, -92); g.quadraticCurveTo(-27, -70, -19, -50);
  g.quadraticCurveTo(-17, -37, -13, -34); g.lineTo(13, -34);
  g.quadraticCurveTo(17, -37, 19, -50); g.quadraticCurveTo(27, -70, 21, -92);
  g.quadraticCurveTo(0, -102, -21, -92); g.closePath(); g.fill();
  // apron
  const apronCol = look.apron === 0 ? "#f1e5cf" : look.apron === 1 ? "#e7d7ba" : "#2c2a33";
  g.fillStyle = apronCol;
  g.beginPath();
  g.moveTo(-13, -86); g.lineTo(13, -86); g.lineTo(16, -37);
  g.quadraticCurveTo(0, -30, -16, -37); g.closePath(); g.fill();
  g.strokeStyle = "rgba(70,50,35,.24)"; g.lineWidth = 1; g.stroke();
  g.fillStyle = "rgba(110,70,35,.18)";
  ellipse(g, -5, -62, 5, 3, 0.4); g.fill();
  ellipse(g, 7, -48, 3, 2, -0.5); g.fill();
  g.strokeStyle = "rgba(70,50,35,.22)"; g.lineWidth = 1.4;
  rr(g, -8, -72, 16, 11, 3); g.stroke();
  // arms
  const armCol = shirt;
  if (carry) {
    if (carry.k === "w") {
      // arms holding logs
      limb(g, -20, -82, -27, -62, 10, armCol);
      limb(g, -27, -62, -18, -52, 8, look.skin);
      limb(g, 20, -82, 27, -62, 10, armCol);
      limb(g, 27, -62, 18, -52, 8, look.skin);
      const n = clamp(carry.n | 0, 1, 3);
      for (let i = 0; i < n; i++) {
        const ly = -56 - i * 11;
        const lg = g.createLinearGradient(-28, ly, 28, ly + 11);
        lg.addColorStop(0, "#a97a4c"); lg.addColorStop(0.55, "#71492b"); lg.addColorStop(1, "#3a2415");
        g.fillStyle = lg; rr(g, -30, ly, 60, 10, 5); g.fill();
        g.strokeStyle = "rgba(45,27,15,.6)"; g.lineWidth = 1;
        g.beginPath(); g.moveTo(-18, ly + 1); g.lineTo(-15, ly + 9); g.stroke();
        g.fillStyle = "#c99a66"; ellipse(g, 29, ly + 5, 3.5, 5); g.fill();
      }
    } else {
      // raw meat on a little board / in hands
      limb(g, -20, -82, -21, -58, 10, armCol);
      limb(g, -21, -58, -7, -48, 8, look.skin);
      limb(g, 20, -82, 21, -58, 10, armCol);
      limb(g, 21, -58, 7, -48, 8, look.skin);
      drawMeat(g, carry.t, 2, -54, 0.62, { a: carry.a, b: carry.b, ch: carry.ch, flipT: 0, placeT: 0 }, time);
      g.fillStyle = "rgba(255,255,255,.12)"; ellipse(g, 2, -44, 24, 4); g.fill();
    }
  } else {
    // tongs hand
    limb(g, -20, -82, -28, -60, 10, armCol);
    limb(g, -28, -60, -24, -44, 8, look.skin);
    limb(g, 20, -82, 28, -60, 10, armCol);
    limb(g, 28, -60, 24, -42, 8, look.skin);
    g.strokeStyle = "#c9ced1"; g.lineWidth = 2.2; g.lineCap = "round";
    g.beginPath(); g.moveTo(-24, -44); g.lineTo(-31, -20); g.moveTo(-24, -44); g.lineTo(-22, -19); g.stroke();
    g.strokeStyle = "#7d858a"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-29, -25); g.lineTo(-22, -25); g.stroke();
  }
  // neck + head
  g.fillStyle = look.skin; rr(g, -6, -103, 12, 13, 4); g.fill();
  const headY = -116;
  const hg = g.createRadialGradient(-7, headY - 7, 2, 0, headY, 23);
  hg.addColorStop(0, "rgba(255,240,215,.6)"); hg.addColorStop(0.35, look.skin); hg.addColorStop(1, "rgba(65,32,18,.55)");
  g.fillStyle = hg; ellipse(g, 0, headY, 18.5, 20.5); g.fill();
  g.fillStyle = look.skin; ellipse(g, -17, headY + 2, 4, 5.5); g.fill(); ellipse(g, 17, headY + 2, 4, 5.5); g.fill();
  drawHair(g, look.hairStyle, look.hair, headY, 18);
  // face
  const blink = Math.sin(time * 2.1 + (p.id || "x").length * 1.3) > 0.978;
  g.fillStyle = "#22130c";
  if (blink) {
    g.strokeStyle = "#22130c"; g.lineWidth = 1.4;
    line(g, -8, headY, -4, headY); line(g, 4, headY, 8, headY);
  } else {
    ellipse(g, -6, headY - 1, 2.5, 2.9); g.fill(); ellipse(g, 6, headY - 1, 2.5, 2.9); g.fill();
    g.fillStyle = "rgba(255,255,255,.6)"; ellipse(g, -5.2, headY - 2, 0.9, 1.1); g.fill(); ellipse(g, 6.8, headY - 2, 0.9, 1.1); g.fill();
  }
  g.strokeStyle = "rgba(65,28,15,.5)"; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(0, headY + 1); g.quadraticCurveTo(-1, headY + 5, 2, headY + 4); g.stroke();
  g.strokeStyle = "#6a2a26"; g.lineWidth = 1.6;
  g.beginPath(); g.arc(0, headY + 7, 5, 0.15, Math.PI - 0.15); g.stroke();
  g.fillStyle = "rgba(255,120,120,.18)"; ellipse(g, -11, headY + 7, 3.5, 2); g.fill(); ellipse(g, 11, headY + 7, 3.5, 2); g.fill();
  // hat
  if (look.hat === 0) {
    const hg2 = g.createLinearGradient(0, headY - 38, 0, headY - 16);
    hg2.addColorStop(0, "#fffdf6"); hg2.addColorStop(1, "#d8ccb7");
    g.fillStyle = hg2;
    rr(g, -17, headY - 24, 34, 10, 4); g.fill();
    g.beginPath(); g.arc(-12, headY - 28, 10, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, headY - 34, 12, 0, TAU); g.fill();
    g.beginPath(); g.arc(12, headY - 27, 9, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(-4, headY - 38, 6, 0, TAU); g.fill();
  } else if (look.hat === 1) {
    g.fillStyle = shirt;
    g.beginPath(); g.arc(0, headY - 8, 19, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.fillStyle = "rgba(0,0,0,.2)"; rr(g, -20, headY - 12, 40, 5, 2); g.fill();
    g.fillStyle = "rgba(255,255,255,.18)"; rr(g, -8, headY - 22, 16, 4, 2); g.fill();
  } else if (look.hat === 2) {
    g.fillStyle = "#d94f4f";
    g.beginPath(); g.moveTo(-18, headY - 11); g.quadraticCurveTo(0, headY - 30, 18, headY - 11); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.arc(-5, headY - 17, 6, 0, TAU); g.fill();
    g.strokeStyle = "#d94f4f"; g.lineWidth = 3;
    line(g, 17, headY - 13, 24, headY - 5);
  } else {
    g.fillStyle = "#d4c7a9";
    g.beginPath(); g.arc(0, headY - 10, 20, Math.PI * 1.0, Math.PI * 2.0); g.fill();
    rr(g, -24, headY - 12, 48, 6, 3); g.fill();
    g.fillStyle = "rgba(0,0,0,.16)"; rr(g, -20, headY - 19, 40, 4, 2); g.fill();
  }
  g.restore();
  // player ring (world coords)
  if (opts.ring !== false) {
    g.save();
    g.strokeStyle = p.color || "#ffb24a";
    g.globalAlpha = opts.local ? 0.92 : 0.5;
    g.lineWidth = opts.local ? 2.6 : 1.8;
    if (opts.local) { g.setLineDash([7, 5]); g.lineDashOffset = -time * 26; }
    ellipse(g, x, y + 2, 33, 11); g.stroke();
    g.restore();
  }
}
function drawChefTag(g, p, time, x, y, scale = 1, opts = {}) {
  const by = y + 21 * scale;
  g.save();
  g.textAlign = "center";
  g.font = "700 11px Outfit, sans-serif";
  const name = (p.name || "Chef").slice(0, 14);
  const tw = Math.max(34, g.measureText(name).width + 18);
  g.fillStyle = "rgba(14,9,7,.78)";
  rr(g, x - tw / 2, by - 9, tw, 19, 9); g.fill();
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; rr(g, x - tw / 2, by - 9, tw, 19, 9); g.stroke();
  g.fillStyle = p.color || "#ffb24a"; g.fillText(name, x, by + 4);
  if (opts.local) {
    g.fillStyle = p.color || "#ffb24a";
    g.beginPath(); g.moveTo(x, by + 10); g.lineTo(x - 4, by + 14); g.lineTo(x + 4, by + 14); g.closePath(); g.fill();
    g.fillStyle = "rgba(14,9,7,.88)"; rr(g, x - 15, by + 15, 30, 11, 5); g.fill();
    g.fillStyle = "#fff3de"; g.font = "800 7px Outfit, sans-serif"; g.fillText("YOU", x, by + 23);
  }
  if (p.carry && p.carry.k === "w") {
    g.fillStyle = "rgba(14,9,7,.82)"; rr(g, x + tw / 2 + 4, by - 7, 24, 16, 7); g.fill();
    g.fillStyle = "#ffb24a"; g.font = "800 9px Outfit, sans-serif"; g.fillText("LOG" + p.carry.n, x + tw / 2 + 16, by + 4);
  }
  g.restore();
}
function drawEmoteBubble(g, p, x, y, scale = 1) {
  if (!p.emoteT || !p.emote) return;
  const a = clamp(p.emoteT / 0.3, 0, 1);
  g.save();
  g.globalAlpha = a;
  g.textAlign = "center";
  g.font = "800 12px Outfit, sans-serif";
  const w = Math.max(70, g.measureText(p.emote).width + 24);
  const by = y - 196 * scale - (1 - a) * 8;
  g.fillStyle = "rgba(255,178,74,.95)";
  rr(g, x - w / 2, by, w, 25, 12); g.fill();
  g.fillStyle = "#1a0e05"; g.fillText(p.emote, x, by + 17);
  g.restore();
}
function drawSpray(g, p, time) {
  if (!p.spraying || !(p.water > 0.005)) return;
  const tx = zoneCenter(p.sz || 0), ty = 430;
  const sx = p.x + (p.dir || 1) * 20, sy = p.y - 68;
  const cx = (sx + tx) / 2, cy = Math.min(sy, ty) - 130;
  g.save();
  g.globalCompositeOperation = "lighter";
  g.strokeStyle = "rgba(120,217,255,.35)"; g.lineWidth = 5; g.lineCap = "round";
  g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cx, cy, tx, ty); g.stroke();
  g.strokeStyle = "rgba(220,250,255,.55)"; g.lineWidth = 1.7; g.stroke();
  // droplets along curve
  for (let i = 0; i < 12; i++) {
    const t = ((i / 12) + time * 1.7) % 1;
    const mt = 1 - t;
    const px = mt * mt * sx + 2 * mt * t * cx + t * t * tx;
    const py = mt * mt * sy + 2 * mt * t * cy + t * t * ty;
    g.fillStyle = `rgba(190,245,255,${0.65 * (1 - t) + 0.12})`;
    ellipse(g, px, py, 1.4 + (i % 3) * 0.8, 2.2 + (i % 2)); g.fill();
  }
  g.restore();
  // nozzle
  g.save();
  g.fillStyle = "#d7dde0"; rr(g, sx - 3, sy - 4, 13, 6, 3); g.fill();
  g.fillStyle = "#78d9ff"; rr(g, sx + 9, sy - 3, 4, 4, 2); g.fill();
  g.restore();
}

/* --------------------------------------------------------------- Jennifer */
function drawJenniferFigure(g, x, y, scale, time, opts = {}) {
  const mood = opts.mood || "watching";
  const sway = Math.sin(time * 1.1) * 1.5;
  g.save();
  drawShadow(g, x, y + 3, 33 * scale, 10 * scale);
  g.translate(x + sway, y);
  g.scale(scale, scale);
  // legs
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1;
    g.fillStyle = JEN_LOOK.skin;
    rr(g, side * 7 - 5, -35, 10, 34, 5); g.fill();
    g.fillStyle = "#0c090b"; rr(g, side * 7 - 6, 26, 12, 8, 4); g.fill();
    g.fillStyle = "rgba(255,255,255,.1)"; rr(g, side * 7 - 3, 27, 9, 2, 1); g.fill();
  }
  // dress
  const dg = g.createLinearGradient(-22, -98, 22, -30);
  dg.addColorStop(0, "#2b2229"); dg.addColorStop(0.45, JEN_LOOK.dress); dg.addColorStop(1, "#050405");
  g.fillStyle = dg;
  g.beginPath();
  g.moveTo(-18, -94); g.quadraticCurveTo(-26, -72, -20, -50);
  g.quadraticCurveTo(-24, -36, -29, -22); g.lineTo(29, -22);
  g.quadraticCurveTo(24, -36, 20, -50); g.quadraticCurveTo(26, -72, 18, -94);
  g.quadraticCurveTo(0, -104, -18, -94); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.05)";
  g.beginPath(); g.moveTo(-10, -88); g.quadraticCurveTo(-16, -60, -8, -28); g.lineTo(-2, -28); g.quadraticCurveTo(-8, -60, -3, -88); g.closePath(); g.fill();
  // slit
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1.2;
  line(g, 13, -40, 19, -23);
  // arms
  // left hand on hip
  limb(g, -18, -88, -29, -66, 8, JEN_LOOK.skin);
  limb(g, -29, -66, -16, -50, 7, JEN_LOOK.skin);
  // right arm holding cocktail
  limb(g, 18, -88, 27, -69, 8, JEN_LOOK.skin);
  limb(g, 27, -69, 29, -52, 7, JEN_LOOK.skin);
  // cocktail
  g.save();
  g.translate(30, -56); g.rotate(-0.08);
  g.fillStyle = "rgba(255,120,160,.85)";
  g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.lineTo(1, 11); g.lineTo(-1, 11); g.closePath(); g.fill();
  g.strokeStyle = "rgba(230,245,255,.7)"; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.lineTo(0, 12); g.closePath(); g.stroke();
  g.fillStyle = "#ffd56b"; ellipse(g, -3, 2, 1.3, 1.3); g.fill();
  line(g, 1, 1, 4, -11);
  g.restore();
  // necklace
  g.strokeStyle = "rgba(255,214,140,.75)"; g.lineWidth = 1;
  g.beginPath(); g.arc(0, -86, 9, 0.3, Math.PI - 0.3); g.stroke();
  g.fillStyle = "#ffe4a3"; ellipse(g, 0, -75, 2.2, 2.6); g.fill();
  // neck + head
  g.fillStyle = JEN_LOOK.skin; rr(g, -6, -106, 12, 13, 4); g.fill();
  const headY = -120;
  const hg = g.createRadialGradient(-7, headY - 7, 2, 0, headY, 23);
  hg.addColorStop(0, "rgba(255,245,230,.7)"); hg.addColorStop(0.4, JEN_LOOK.skin); hg.addColorStop(1, "rgba(110,62,44,.5)");
  g.fillStyle = hg; ellipse(g, 0, headY, 18, 20); g.fill();
  g.fillStyle = JEN_LOOK.skin; ellipse(g, -17, headY + 2, 3.8, 5.4); g.fill(); ellipse(g, 17, headY + 2, 3.8, 5.4); g.fill();
  // blonde bob
  const hairG = g.createLinearGradient(-20, headY - 22, 20, headY + 16);
  hairG.addColorStop(0, "#f7df9d"); hairG.addColorStop(0.45, JEN_LOOK.hair); hairG.addColorStop(1, "#b58b45");
  g.fillStyle = hairG;
  g.beginPath(); g.arc(0, headY - 3, 21, Math.PI * 0.82, Math.PI * 2.18); g.fill();
  g.beginPath(); g.moveTo(-21, headY - 3); g.quadraticCurveTo(-25, headY + 18, -17, headY + 24); g.lineTo(-12, headY + 6); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(21, headY - 3); g.quadraticCurveTo(25, headY + 18, 17, headY + 24); g.lineTo(12, headY + 6); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.22)";
  g.beginPath(); g.arc(-8, headY - 9, 8, Math.PI * 1.1, Math.PI * 1.65); g.fill();
  // sunglasses on head
  g.fillStyle = "rgba(18,14,16,.92)";
  rr(g, -16, headY - 12, 13, 6, 3); g.fill(); rr(g, 3, headY - 12, 13, 6, 3); g.fill();
  g.strokeStyle = "rgba(18,14,16,.92)"; g.lineWidth = 1.4; line(g, -3, headY - 9, 3, headY - 9);
  // face
  g.fillStyle = "#2b1a12";
  const blink = Math.sin(time * 1.5) > 0.985;
  if (blink || mood === "bored") {
    g.strokeStyle = "#2b1a12"; g.lineWidth = 1.4;
    line(g, -9, headY, -4, headY); line(g, 4, headY, 9, headY);
  } else {
    ellipse(g, -6, headY - 1, 2.8, 3.2); g.fill(); ellipse(g, 6, headY - 1, 2.8, 3.2); g.fill();
    g.fillStyle = "rgba(120,190,220,.7)"; ellipse(g, -6, headY - 2, 1.2, 1.4); g.fill(); ellipse(g, 6, headY - 2, 1.2, 1.4); g.fill();
    g.fillStyle = "rgba(255,255,255,.75)"; ellipse(g, -5.2, headY - 2.4, 0.7, 0.8); g.fill(); ellipse(g, 6.8, headY - 2.4, 0.7, 0.8); g.fill();
  }
  // brows
  g.strokeStyle = "#8a6334"; g.lineWidth = 1.5;
  line(g, -9, headY - 7, -4, headY - 8); line(g, 4, headY - 8, 9, headY - 7);
  // nose
  g.strokeStyle = "rgba(110,60,40,.55)"; g.lineWidth = 1.1;
  g.beginPath(); g.moveTo(0, headY + 1); g.quadraticCurveTo(-1, headY + 5, 2, headY + 4); g.stroke();
  // lips
  g.fillStyle = "#c93f5c";
  g.beginPath(); g.moveTo(-6, headY + 9); g.quadraticCurveTo(0, headY + 6, 6, headY + 9); g.quadraticCurveTo(0, headY + 14, -6, headY + 9); g.fill();
  g.fillStyle = "rgba(255,255,255,.25)"; ellipse(g, -1, headY + 9, 2, 0.8); g.fill();
  // earrings
  g.strokeStyle = "#ffe4a3"; g.lineWidth = 1.2;
  ellipse(g, -17, headY + 6, 2.2, 3); g.stroke(); ellipse(g, 17, headY + 6, 2.2, 3); g.stroke();
  g.restore();
}
function jenMoodFor(G) { return G.hype >= 78 ? "flirty" : G.hype >= 42 ? "watching" : "bored"; }
function drawJenniferSpotlight(g) {
  g.save();
  g.globalCompositeOperation = "lighter";
  const sl = g.createRadialGradient(JEN.x, JEN.y - 70, 10, JEN.x, JEN.y - 60, 220);
  sl.addColorStop(0, "rgba(255,190,140,.13)"); sl.addColorStop(1, "rgba(255,150,100,0)");
  g.fillStyle = sl; ellipse(g, JEN.x, JEN.y - 60, 220, 160); g.fill();
  g.restore();
}
function drawJenniferBody(g, G, time) {
  const mood = jenMoodFor(G);
  drawJenniferFigure(g, JEN.x, JEN.y, 1.12, time, { mood });
  if (mood === "bored") {
    g.save();
    g.translate(JEN.x + 24, JEN.y - 62); g.rotate(-0.3);
    g.fillStyle = "#101014"; rr(g, -6, -12, 12, 22, 3); g.fill();
    g.fillStyle = "rgba(120,217,255,.7)"; rr(g, -4.5, -10, 9, 17, 2); g.fill();
    g.restore();
    g.save(); g.globalAlpha = 0.5 + 0.3 * Math.sin(time * 2);
    g.fillStyle = "rgba(255,255,255,.22)"; g.font = "700 20px Outfit, sans-serif"; g.textAlign = "center";
    g.fillText("…", JEN.x + 74, JEN.y - 130); g.restore();
  }
}
function drawJenniferOverlay(g, G, time) {
  const mood = jenMoodFor(G);
  // name tag
  g.save();
  g.textAlign = "center"; g.font = "800 10px Outfit, sans-serif";
  const tw = g.measureText("JENNIFER").width + 26;
  g.fillStyle = "rgba(24,12,18,.78)"; rr(g, JEN.x - tw / 2, JEN.y - 184, tw, 20, 10); g.fill();
  g.strokeStyle = "rgba(255,120,170,.35)"; g.lineWidth = 1; rr(g, JEN.x - tw / 2, JEN.y - 184, tw, 20, 10); g.stroke();
  g.fillStyle = "#ffb9c8"; g.fillText("JENNIFER", JEN.x, JEN.y - 170);
  g.restore();
  // hearts
  if (mood === "flirty") {
    for (let i = 0; i < 4; i++) {
      const a = time * 1.4 + i * 1.7;
      const hx = JEN.x + Math.sin(a) * 44;
      const hy = JEN.y - 150 - ((time * 16 + i * 22) % 60);
      g.save(); g.globalAlpha = 0.5 + 0.4 * Math.sin(time * 3 + i);
      drawHeartIcon(g, hx, hy, 6 + (i % 2) * 2, "#ff6f9e");
      g.restore();
    }
  }
  // quote bubble
  const q = jenQuote(G, time);
  if (q) {
    const bx = JEN.x - 30, by = JEN.y - 232;
    g.save();
    g.font = "600 11px Outfit, sans-serif";
    const lines = wrapText(g, q, 170);
    const bh = 18 + lines.length * 14;
    const bw = 196;
    g.fillStyle = "rgba(26,14,20,.88)"; rr(g, bx - bw / 2, by, bw, bh, 12); g.fill();
    g.strokeStyle = "rgba(255,130,175,.22)"; g.lineWidth = 1; rr(g, bx - bw / 2, by, bw, bh, 12); g.stroke();
    g.beginPath(); g.moveTo(bx - 6, by + bh - 1); g.lineTo(bx + 3, by + bh + 9); g.lineTo(bx + 8, by + bh - 1); g.closePath(); g.fill();
    g.fillStyle = "#ffd7e0"; g.textAlign = "center";
    lines.forEach((ln, i) => g.fillText(ln, bx, by + 16 + i * 14));
    g.restore();
  }
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
let quoteState = { idx: 0, next: 4, show: true };
function jenQuote(G, time) {
  if (G.phase === "menu") return JEN_QUOTES[0];
  if (time > quoteState.next) {
    quoteState.next = time + 8.5;
    quoteState.idx = (quoteState.idx + 1 + ((Math.random() * 3) | 0)) % (G.hype >= 70 ? JEN_HIGH.length : G.hype < 35 ? JEN_LOW.length : JEN_QUOTES.length);
    quoteState.high = G.hype >= 70;
    quoteState.low = G.hype < 35;
  }
  const list = quoteState.high ? JEN_HIGH : quoteState.low ? JEN_LOW : JEN_QUOTES;
  return list[quoteState.idx % list.length];
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
function drawHeartIconPath(g, x, y, s) {
  // path only, caller sets fillStyle
  g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s, y - s * 0.35, x - s * 0.9, y - s * 1.1, x - s * 0.35, y - s * 1.1);
  g.bezierCurveTo(x - s * 0.1, y - s * 1.1, x, y - s * 0.92, x, y - s * 0.78);
  g.bezierCurveTo(x, y - s * 0.92, x + s * 0.1, y - s * 1.1, x + s * 0.35, y - s * 1.1);
  g.bezierCurveTo(x + s * 0.9, y - s * 1.1, x + s, y - s * 0.35, x, y + s * 0.35);
  g.closePath();
}
/* --------------------------------------------------------------- sprites */
let smokeSprite = null, steamSprite = null, grainPattern = null, bulbGlow = null, overlayCanvas = null;
function buildSprites() {
  smokeSprite = document.createElement("canvas"); smokeSprite.width = smokeSprite.height = 128;
  let g = smokeSprite.getContext("2d");
  let gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(78,72,72,.52)"); gr.addColorStop(0.45, "rgba(58,54,56,.24)"); gr.addColorStop(1, "rgba(40,38,42,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  steamSprite = document.createElement("canvas"); steamSprite.width = steamSprite.height = 128;
  g = steamSprite.getContext("2d");
  gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(235,248,255,.55)"); gr.addColorStop(0.45, "rgba(200,225,238,.22)"); gr.addColorStop(1, "rgba(180,210,225,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  // bulb glow
  bulbGlow = document.createElement("canvas"); bulbGlow.width = bulbGlow.height = 64;
  g = bulbGlow.getContext("2d");
  gr = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,225,160,.85)"); gr.addColorStop(0.35, "rgba(255,185,90,.34)"); gr.addColorStop(1, "rgba(255,170,70,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  // grain
  const gc = document.createElement("canvas"); gc.width = gc.height = 160;
  g = gc.getContext("2d");
  const id = g.createImageData(160, 160);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  grainPattern = ctx.createPattern(gc, "repeat");
}
function buildOverlay() {
  const c = document.createElement("canvas"); c.width = VW; c.height = VH;
  const g = c.getContext("2d");
  g.globalCompositeOperation = "lighter";
  const warm = g.createLinearGradient(0, 480, 0, 900);
  warm.addColorStop(0, "rgba(255,110,30,.045)");
  warm.addColorStop(0.45, "rgba(255,100,30,.022)");
  warm.addColorStop(1, "rgba(255,170,70,0)");
  g.fillStyle = warm; g.fillRect(0, 480, VW, 420);
  g.globalCompositeOperation = "source-over";
  const vg = g.createRadialGradient(VW / 2, VH * 0.47, VH * 0.22, VW / 2, VH * 0.52, VH * 0.92);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(0.7, "rgba(0,0,0,.16)"); vg.addColorStop(1, "rgba(0,0,0,.62)");
  g.fillStyle = vg; g.fillRect(0, 0, VW, VH);
  if (grainPattern) {
    g.globalAlpha = 0.03; g.globalCompositeOperation = "overlay";
    g.fillStyle = grainPattern; g.fillRect(0, 0, VW, VH);
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }
  return c;
}
function drawSmokeLayer(g) {
  g.save();
  g.globalCompositeOperation = "source-over";
  for (const p of fx.smoke) {
    const t = p.life / p.max;
    const a = p.a * (1 - t) * (t < 0.18 ? t / 0.18 : 1);
    if (a <= 0.002) continue;
    g.globalAlpha = a;
    const s = p.r * 2.6;
    g.drawImage(p.dark ? smokeSprite : steamSprite || smokeSprite, p.x - s / 2, p.y - s / 2, s, s * 0.9);
  }
  for (const p of fx.steam) {
    const t = p.life / p.max;
    g.globalAlpha = p.a * (1 - t);
    const s = p.r * 2.6;
    g.drawImage(steamSprite, p.x - s / 2, p.y - s / 2, s, s * 0.8);
  }
  g.restore();
}
function drawParticleFront(g, time) {
  g.save();
  // embers
  for (const p of fx.embers) {
    const t = p.life / p.max;
    g.globalAlpha = (1 - t) * 0.9;
    g.fillStyle = `hsl(${p.hue},100%,${58 + (1 - t) * 22}%)`;
    ellipse(g, p.x, p.y, p.r * (1 - t * 0.4), p.r * (1 - t * 0.4)); g.fill();
    if (p.r > 1.7) {
      g.globalAlpha *= 0.28; ellipse(g, p.x, p.y, p.r * 3, p.r * 3); g.fill();
    }
  }
  // sparks
  for (const p of fx.sparks) {
    const t = p.life / p.max;
    g.globalAlpha = 1 - t;
    g.fillStyle = p.color;
    ellipse(g, p.x, p.y, p.r * (1 - t * 0.5), p.r * (1 - t * 0.5)); g.fill();
  }
  // hearts
  for (const p of fx.hearts) {
    const t = p.life / p.max;
    g.globalAlpha = (1 - t) * 0.95;
    drawHeartIcon(g, p.x, p.y, p.s * (1 + t * 0.25), p.color);
  }
  // floating text
  for (const p of fx.texts) {
    const t = p.life / p.max;
    const a = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.65) / 0.35);
    g.globalAlpha = clamp(a, 0, 1);
    const sc = t < 0.15 ? 0.75 + (t / 0.15) * 0.35 : 1;
    g.save();
    g.translate(p.x, p.y); g.scale(sc, sc);
    g.textAlign = "center";
    g.font = `800 ${p.size}px Outfit, sans-serif`;
    g.lineWidth = 4; g.strokeStyle = "rgba(16,9,5,.7)"; g.strokeText(p.text, 0, 0);
    g.fillStyle = p.color; g.fillText(p.text, 0, 0);
    g.restore();
  }
  // fireflies above the crowd
  for (const f of fx.fireflies) {
    const x = f.x + Math.sin(f.p) * f.amp;
    const y = f.y + Math.cos(f.p * 0.8) * f.amp * 0.55;
    const a = 0.2 + 0.7 * (0.5 + 0.5 * Math.sin(f.p * 3.1));
    g.globalAlpha = a;
    g.fillStyle = "#ffe58a";
    ellipse(g, x, y, f.r, f.r); g.fill();
    g.globalAlpha = a * 0.18; ellipse(g, x, y, f.r * 4, f.r * 4); g.fill();
  }
  g.restore();
}

/* -------------------------------------------------------------- sky/bulbs */
function drawSkyDynamic(g, time) {
  // twinkles
  g.save();
  for (let i = 0; i < 26; i++) {
    const R = rng(i * 71 + 5);
    const x = R() * VW, y = R() * 300, r = 0.8 + R() * 1.6;
    g.globalAlpha = 0.12 + 0.5 * Math.max(0, Math.sin(time * (0.7 + R() * 1.8) + i));
    g.fillStyle = i % 5 === 0 ? "#ffd9a0" : "#dce8ff";
    ellipse(g, x, y, r, r); g.fill();
  }
  g.restore();
  // party crowd silhouettes behind the braai
  g.save();
  g.beginPath(); g.rect(0, 160, VW, 140); g.clip();
  for (let i = 0; i < 18; i++) {
    const R = rng(900 + i * 53);
    const x = 40 + i * 90 + R() * 34;
    const y = 318 + R() * 16;
    const s = 0.75 + R() * 0.42;
    const sway = Math.sin(time * (0.8 + R() * 0.8) + i) * 6;
    g.save();
    g.translate(x + sway, y); g.scale(s, s);
    g.fillStyle = `rgba(${10 + R() * 14 | 0},${12 + R() * 12 | 0},${18 + R() * 14 | 0},.9)`;
    // legs/body
    rr(g, -15, -68, 30, 70, 12); g.fill();
    ellipse(g, 0, -80, 14, 15); g.fill();
    // raised arm for some
    if (i % 3 === 0) {
      g.strokeStyle = g.fillStyle; g.lineWidth = 8; g.lineCap = "round";
      g.beginPath(); g.moveTo(11, -64); g.lineTo(23 + Math.sin(time * 2 + i) * 5, -104); g.stroke();
    }
    if (i % 4 === 1) {
      g.strokeStyle = g.fillStyle; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(-11, -64); g.lineTo(-23, -96); g.stroke();
    }
    g.restore();
  }
  g.restore();
  // string lights
  const drawWire = (y, sag, phaseOff, n) => {
    g.save();
    g.strokeStyle = "rgba(18,14,16,.85)"; g.lineWidth = 1.6;
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = t * VW;
      const yy = y + Math.sin(t * Math.PI) * sag + Math.sin(time * 0.8 + phaseOff) * 1.5;
      if (i === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
    g.stroke();
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = t * VW;
      const yy = y + Math.sin(t * Math.PI) * sag + Math.sin(time * 0.8 + phaseOff) * 1.5 + 4;
      const col = i % 7 === 0 ? "#ff9ec4" : i % 11 === 0 ? "#8fe8ff" : i % 5 === 0 ? "#ffd56b" : "#ffc47a";
      const pulse = 0.72 + 0.28 * Math.sin(time * 2.3 + i * 1.7);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.55 * pulse;
      if (bulbGlow) g.drawImage(bulbGlow, x - 15, yy + 5 - 15, 30, 30);
      g.globalAlpha = 0.95;
      g.fillStyle = col; ellipse(g, x, yy, 3.1, 4.4); g.fill();
      g.globalAlpha = 0.55; g.fillStyle = "#fff7dd"; ellipse(g, x - 0.7, yy - 1, 1.2, 1.7); g.fill();
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "rgba(20,16,16,.9)"; rr(g, x - 2, yy - 6, 4, 5, 1.5); g.fill();
    }
    g.restore();
  };
  drawWire(54, 54, 0, 27);
  drawWire(110, 42, 2.2, 23);
  // bunting line
  g.save();
  g.strokeStyle = "rgba(20,16,18,.6)"; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(0, 168); g.quadraticCurveTo(800, 215, 1600, 160); g.stroke();
  const flags = ["#c94f4f", "#e0a33a", "#4c9c8a", "#c77a3e", "#8d5ab2"];
  for (let i = 0; i < 22; i++) {
    const t = (i + 0.5) / 22;
    const x = t * VW;
    const y = 168 + Math.sin(t * Math.PI) * 40;
    const sway = Math.sin(time * 1.6 + i) * 1.8;
    g.fillStyle = flags[i % flags.length];
    g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.lineTo(x + sway, y + 20); g.closePath(); g.fill();
    g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + 7, y); g.lineTo(x + sway, y + 20); g.closePath(); g.fill();
  }
  g.restore();
}
function drawFireLight(g, G, time) {
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let z = 0; z < G.zones.length; z++) {
    const zn = G.zones[z];
    const power = clamp(zn.coal * 0.6 + zn.flame * 0.5 - zn.wet * 0.2, 0, 1.2);
    if (power < 0.02) continue;
    const cx = zoneCenter(z);
    const flick = 0.88 + 0.12 * Math.sin(time * 8 + z * 2.2);
    glowCircle(g, cx, 610, 300, `rgba(255,110,30,${0.055 * power * flick})`, "rgba(255,80,20,0)");
    glowCircle(g, cx, 500, 180, `rgba(255,150,50,${0.07 * power * flick})`, "rgba(255,110,30,0)");
  }
  glowCircle(g, 770, 780, 620, "rgba(255,150,60,.035)", "rgba(255,120,30,0)");
  g.restore();
}

/* --------------------------------------------------------------- entities */
function drawEntities(g, G, time, localId) {
  if (G.phase === "won") return;
  const items = [];
  for (const p of G.players) {
    if (G.phase === "menu" && !p.id.startsWith("demo")) continue;
    items.push({ y: p.y, kind: "p", p });
  }
  for (const gm of G.guests) items.push({ y: gm.y, kind: "g", g: gm });
  if (G.phase !== "lost") items.push({ y: JEN.y, kind: "j" });
  items.sort((a, b) => a.y - b.y || (a.kind === "p" && a.p.id === localId ? 1 : -1));
  // jennifer glow behind everyone
  drawJenniferSpotlight(g);
  for (const it of items) {
    if (it.kind === "p") {
      const p = it.p;
      drawChefFigure(g, p, time, p.x, p.y, 1, { local: p.id === localId });
    } else if (it.kind === "g") {
      drawGuestFigure(g, it.g, time, it.g.x, it.g.y, 1);
    } else if (it.kind === "j") {
      drawJenniferBody(g, G, time);
    }
  }
  // labels above everyone
  for (const it of items) {
    if (it.kind === "p") {
      const p = it.p;
      if (G.phase !== "menu") drawChefTag(g, p, time, p.x, p.y, 1, { local: p.id === localId });
      drawEmoteBubble(g, p, p.x, p.y, 1);
    } else if (it.kind === "g") {
      drawGuestBubble(g, it.g, time, it.g.x, it.g.y, 1);
    } else if (it.kind === "j") {
      drawJenniferOverlay(g, G, time);
    }
  }
  // spray arcs on top
  for (const p of G.players) {
    if (p.id === "demo1" || p.id === "demo2") continue;
    drawSpray(g, p, time);
  }
}

/* ------------------------------------------------------------- menu/cutscene */
function drawMenuScene(g, G, time) {
  // little vignette focus on the demo chef
  g.save();
  g.globalCompositeOperation = "lighter";
  glowCircle(g, 430, 690, 240, "rgba(255,170,80,.05)", "rgba(255,150,60,0)");
  g.restore();
}
function drawWinCutscene(g, G, time) {
  if (G.phase !== "won" || resultsShown) return;
  const t = G.winT;
  const fade = clamp(t / 0.9, 0, 1);
  g.save();
  g.fillStyle = `rgba(8,4,5,${0.66 * fade})`;
  g.fillRect(0, 0, VW, VH);
  // spotlight
  g.globalCompositeOperation = "lighter";
  const spot = g.createRadialGradient(800, 500, 20, 800, 500, 480);
  spot.addColorStop(0, `rgba(255,190,190,${0.2 * fade})`); spot.addColorStop(0.6, `rgba(255,110,150,${0.06 * fade})`); spot.addColorStop(1, "rgba(255,90,130,0)");
  g.fillStyle = spot; g.fillRect(0, 0, VW, VH);
  g.restore();
  const approach = smooth(clamp((t - 0.7) / 2.4, 0, 1));
  const chefX = lerp(600, 735, approach);
  const jenX = lerp(1010, 878, approach);
  const chef = G.players.find((p) => p.id === myId) || G.players[0] || makePlayer("solo", "You", "#ffb24a", 0, 0);
  g.save(); g.translate(chefX, 690); g.rotate(0.06 * approach);
  drawChefFigure(g, { ...chef, carry: null, moving: false }, time, 0, 0, 1.72, { walking: false, ring: false });
  g.restore();
  g.save(); g.translate(jenX, 690); g.rotate(-0.06 * approach);
  drawJenniferFigure(g, 0, 0, 1.72, time, { mood: "flirty" });
  g.restore();
  // hearts between
  if (approach > 0.42) {
    const pulse = 0.75 + 0.25 * Math.sin(time * 6);
    g.save();
    g.globalAlpha = clamp((approach - 0.42) / 0.3, 0, 1);
    drawHeartIcon(g, (chefX + jenX) / 2, 472, 34 * pulse, "#ff6f9e");
    for (let i = 0; i < 12; i++) {
      const a = time * 1.2 + i * 1.7;
      drawHeartIcon(g, 800 + Math.sin(a) * (120 + i * 7), 400 + Math.cos(a * 0.8) * 90 - ((time * 26 + i * 18) % 120), 7 + (i % 3) * 3, i % 2 ? "#ffd56b" : "#ff8da9");
    }
    g.restore();
  }
  // text
  const ta = clamp((t - 1.4) / 0.8, 0, 1);
  g.save();
  g.globalAlpha = ta;
  g.textAlign = "center";
  g.font = '400 48px "Alfa Slab One", Impact, serif';
  const gr = g.createLinearGradient(0, 130, 0, 190);
  gr.addColorStop(0, "#fff6e0"); gr.addColorStop(0.6, "#ffc25e"); gr.addColorStop(1, "#ff7f39");
  g.fillStyle = gr;
  g.fillText("JENNIFER ANISTON IS", 800, 152);
  g.fillText("MAKING OUT WITH YOU", 800, 204);
  g.font = "700 12px Outfit, sans-serif"; g.fillStyle = "#ffd6df"; g.letterSpacing = "0.28em";
  g.fillText("THE BOEREWORS IS ON FIRE. WORTH IT.", 800, 244);
  g.restore();
  // closing fade
  if (t > 5.35) {
    g.fillStyle = `rgba(4,2,3,${clamp((t - 5.35) / 0.9, 0, 1)})`;
    g.fillRect(0, 0, VW, VH);
  }
}

/* ------------------------------------------------------------------ render */
function renderScene(G, time, localId) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = "#080504";
  ctx.fillRect(0, 0, CW, CH);
  ctx.save();
  ctx.translate(OX, OY);
  ctx.scale(SCALE, SCALE);
  ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
  // shake
  if (fx.shake > 0.1) {
    ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
  }
  // scene
  ctx.drawImage(backdrop, 0, 0, VW, VH);
  drawSkyDynamic(ctx, time);
  drawFireLight(ctx, G, time);
  drawCoals(ctx, G, time);
  drawFlames(ctx, G, time);
  drawGrate(ctx);
  drawSmokeLayer(ctx);
  drawSlots(ctx, G, time, localId);
  drawDeckProps(ctx, G, time);
  drawMenuScene(ctx, G, time);
  drawEntities(ctx, G, time, localId);
  drawParticleFront(ctx, time);
  // pre-baked warm haze, vignette and grain
  if (overlayCanvas) ctx.drawImage(overlayCanvas, 0, 0, VW, VH);
  // flash
  if (fx.flash > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,232,190,${clamp(fx.flash, 0, 0.8)})`;
    ctx.fillRect(0, 0, VW, VH);
    ctx.restore();
  }
  drawWinCutscene(ctx, G, time);
  ctx.restore();
  // letterbox fill
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = "#070403";
  if (OY > 0.5) { ctx.fillRect(0, 0, CW, OY); ctx.fillRect(0, OY + VH * SCALE, CW, CH - OY - VH * SCALE); }
  if (OX > 0.5) { ctx.fillRect(0, 0, OX, CH); ctx.fillRect(OX + VW * SCALE, 0, CW - OX - VW * SCALE, CH); }
}
/* ------------------------------------------------------------------ input */
const keys = new Set();
const localInput = { dx: 0, dy: 0, spray: false };
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
let pred = { x: 800, y: 650 };
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
    netInputs[id] = { dx: finite(d.dx), dy: finite(d.dy), spray: !!d.spray, at: performance.now() };
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
  const p = makePlayer(id, name || "Chef", PLAYER_COLORS[i % PLAYER_COLORS.length], clamp(700 + (i - 1) * 95, 300, 1300), 638 + (i % 2) * 32);
  p.joinT = 1.3;
  G.players.push(p);
}
function applyRemoteAction(id, d) {
  const kind = String(d.a || "");
  if (kind === "use") doUse(G, id);
  else if (kind === "flip") doFlip(G, id);
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
    dx: localInput.dx, dy: localInput.dy, spray: localInput.spray ? 1 : 0,
    a: action ? action.a : null, m: action && Number.isFinite(action.m) ? action.m : selectedMeat,
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
  else G.players = [makePlayer("solo", myName, PLAYER_COLORS[0], VW / 2, 650)];
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
  keys.clear(); localInput.dx = localInput.dy = 0; localInput.spray = false;
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
  G = resetGame(makeDemo(), [makePlayer("solo", myName, PLAYER_COLORS[0], VW / 2, 650)]);
  resetView(); predReady = false; hideJoining(); clearTimeout(joinTimer);
  clearUrl(); updateInvite(); updateRoster(true);
  updateUrl();
  banner("BRAAI MASTER", "Keep the party vibe alive", "#ffd56b");
  toast("Solo braai. The party is watching.");
}
function beginHost(code) {
  isHost = true; localId = "host"; myId = "host"; netCode = code; netReady = false;
  stateJoined = true; netInputs = {}; lastSnapSeq = -1;
  G = resetGame(makeDemo(), [makePlayer("host", myName, PLAYER_COLORS[0], VW / 2, 650)]);
  resetView(); predReady = false; hideJoining(); clearTimeout(joinTimer);
  setUrl(code); updateInvite(); updateRoster(true);
  banner("BRAAI MASTER", "Keep the party vibe alive", "#ffd56b");
  toast("Braai lit. Send the invite link.");
  connectHost(code);
}
async function connectHost(code) {
  try {
    const n = await createNet(code, true);
    if (netCode !== code) { n.close(); return; }
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
    if (!netCode) { n.close(); return; }
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
      toast("Couldn't join — solo braai it is");
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
  resetView(); resetFx(); resetIntro();
  lastSnapSeq = -1;
  resultsShown = false; forceResults = false;
  $("results").hidden = true; $("skipCut").hidden = true;
  sound.setMusic(true);
  setChrome(true);
  netSendAcc = 1;
  toast("New braai. Same Jennifer.");
}
function goMenu() {
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
  if (!resultsShown) {
    $("skipCut").hidden = won ? (G.winT > 6.2) : true;
    if (forceResults || (won && G.winT > 6.25) || (lost && G.winT > 1.15)) showResults();
  }
}
function showResults() {
  if (resultsShown) return;
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
  fx.smoke.length = 0; fx.embers.length = 0; fx.sparks.length = 0; fx.steam.length = 0;
  fx.hearts.length = 0; fx.texts.length = 0; fx.water.length = 0;
  fx.shake = 0; fx.flash = 0;
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
    if (!sp) { sp = { x: p.x, y: p.y, walk: p.walk || 0, moving: false }; SV.players.set(p.id, sp); }
    let tx = p.x, ty = p.y;
    const isLocal = p.id === localId;
    if (isLocal && !host && prediction && predReady) { tx = prediction.x; ty = prediction.y; }
    if (isLocal && host) { sp.x = p.x; sp.y = p.y; }
    else { sp.x = lerp(sp.x, tx, k); sp.y = lerp(sp.y, ty, k); }
    const walkMoved = Math.abs((p.walk || 0) - (sp.walk || 0)) > 0.002;
    sp.walk = p.walk || 0;
    const inpMove = isLocal ? Math.hypot(localInput.dx, localInput.dy) > 0.08 : false;
    const moving = isLocal ? inpMove || walkMoved : walkMoved;
    return Object.assign({}, p, { x: sp.x, y: sp.y, moving });
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
  if (isHost) {
    if (action.a === "use") doUse(G, localId);
    else if (action.a === "flip") doFlip(G, localId);
    else if (action.a === "grab") doGrab(G, localId, action.m);
    else if (action.a === "emote") doEmote(G, localId, action.txt);
    else if (action.a === "again") { if (G.phase !== "playing") restartHost(); }
  } else {
    guestSend(action);
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
  const nearBraaiNow = nearBraai(p);
  const nearPile = distTo(p, WOODPILE) < WOODPILE.r;
  const nearBinNow = distTo(p, BIN) < BIN.r;
  const gm = nearestWaitingGuest(G, p);
  let html = "";
  if (p.carry && p.carry.k === "w") {
    if (nearPile && p.carry.n < 3) html = `${key("E")} Grab another log <span style="opacity:.6">(${p.carry.n}/3)</span>`;
    else if (nearBraaiNow) html = `${key("E")} Toss log into fire zone ${nearestZone(p.x) + 1}`;
    else html = `Carry the wood to the braai — ${key("E")} tosses it in`;
  } else if (p.carry && p.carry.k === "m") {
    const m = MEATS[p.carry.t];
    if (nearPile) html = `${key("E")} Grab firewood — you'll drop the ${esc(m.name)}`;
    else if (nearBinNow) html = `${key("E")} Bin the ${esc(m.name)}`;
    else if (gm) {
      if (gm.order === p.carry.t) html = `${key("E")} Serve <b>${esc(gm.name)}</b> the ${esc(m.name)}`;
      else html = `<span class="warn">${esc(gm.name)} wants ${esc(MEATS[gm.order].name)}</span> — keep cooking`;
    } else if (nearBraaiNow) {
      const slot = findEmptySlot(G, p);
      html = slot >= 0 ? `${key("E")} Put the ${esc(m.name)} on the braai` : `<span class="warn">The braai is full</span>`;
    } else html = `Take it to a guest or back to the braai`;
  } else if (nearPile) {
    html = `${key("E")} Grab firewood`;
  } else if (nearBinNow) {
    html = `Nothing to bin`;
  } else if (nearBraaiNow) {
    const slot = findItemSlot(G, p);
    if (slot >= 0) {
      const it = G.slots[slot];
      const q = qualityOf(it);
      html = `${key("E")} Pick up ${esc(MEATS[it.type].name)} · ${key("F")} Flip <span style="color:${qualityColor(q)};font-weight:700">${qualityText(it)}</span>`;
    } else {
      html = isTouch ? `Tap a meat card to grab · ${key("E")} use · ${key("F")} flip · ${key("SPACE")} spray`
        : `${key("1–6")} Grab meat · ${key("F")} Flip · ${key("SPACE")} Spray`;
    }
  } else {
    const z = G.zones[nearestZone(p.x)];
    if (z.flame > 0.86) html = `<span class="warn">Flare-up!</span> ${key("SPACE")} Spray water`;
    else if (z.coal < 0.16) html = `<span class="warn">Cold zone</span> — grab wood at the pile`;
    else html = isTouch ? `Tap a meat card · ${key("E")} use · ${key("F")} flip · ${key("SPACE")} spray`
      : `${key("1–6")} Grab meat · ${key("E")} use · ${key("F")} flip · ${key("SPACE")} spray`;
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
      toast(isTouch ? "Tap a meat card to grab. E places it. FLIP turns it." : "Grab meat with 1–6. E places it. F flips it.");
    }
    if (!introFlags.b && G.timeLeft < PARTY_TIME - 15) {
      introFlags.b = true;
      toast(isTouch ? "Tap the woodpile for firewood. E tosses it on the fire." : "Firewood is at the pile on the left. Keep every zone alive.");
    }
    if (!introFlags.perfect && G.perfect > 0) {
      introFlags.perfect = true;
      toast(isTouch ? "Perfect! Tap E to take it off, then E at a guest to serve." : "Perfect! Take it off with E, then serve a guest with E.");
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
        localAction({ a: act === "flip" ? "flip" : "use" });
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
  if (Math.random() < dt * 1.8) spawnSpark(zoneCenter((Math.random() * 4) | 0), 430);
  if (Math.random() < dt * 1.2) spawnEmber(zoneCenter((Math.random() * 4) | 0), 430, 200);
  if (Math.random() < dt * 0.35) spawnHeart(JEN.x + (Math.random() - 0.5) * 60, JEN.y - 140, "#ff6f9e");
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
    if (c === "KeyE") { localAction({ a: "use" }); return; }
    if (c === "KeyF") { localAction({ a: "flip" }); return; }
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
    updateFx(dt, VG);
    updateHud();
    updateSound(dt);
    syncPhase();
    if (G.phase !== "playing" && G.phase !== "menu") { localInput.spray = false; touchSpray = false; }
  } else {
    updateMenuDemo(dt, G);
    VG = G;
    updateFx(dt, G);
    renderScene(G, clockTime, localId);
    requestAnimationFrame(loop);
    return;
  }
  renderScene(VG, clockTime, localId);
  requestAnimationFrame(loop);
}
function updateGuestLocal(dt) {
  if (!G || stateJoined) {
    // movement prediction
    if (G && G.phase === "playing" && predReady) {
      let dx = localInput.dx, dy = localInput.dy;
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      if (len > 0.08) {
        pred.x = clamp(pred.x + dx * PLAY.speed * dt, PLAY.minX, PLAY.maxX);
        pred.y = clamp(pred.y + dy * PLAY.speed * dt, PLAY.minY, PLAY.maxY);
      }
    }
  }
  netInputAcc += dt;
  if (netInputAcc >= 1 / 30) {
    netInputAcc = 0;
    guestSend(null);
  }
}
function collectInput() {
  let dx = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  let dy = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  if (touchInput.active) { dx += touchInput.x; dy += touchInput.y; }
  const l = Math.hypot(dx, dy);
  if (l > 1) { dx /= l; dy /= l; }
  if (Math.abs(dx) < 0.04) dx = 0;
  if (Math.abs(dy) < 0.04) dy = 0;
  localInput.dx = dx; localInput.dy = dy;
  localInput.spray = keys.has("Space") || touchSpray;
}
function inputLoop() {
  collectInput();
  requestAnimationFrame(inputLoop);
}

/* ------------------------------------------------------------------- init */
function init() {
  resize();
  backdrop = buildBackdrop();
  buildSprites();
  overlayCanvas = buildOverlay();
  initFireflies();
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
    renderScene: (id) => renderScene(G, clockTime, id || localId),
    meats: MEATS, slotXs: Array.from({ length: SLOT_COUNT }, (_, i) => slotPos(i).x), zoneXs: Array.from({ length: BRAAI.zoneCount }, (_, i) => zoneCenter(i)),
  };
}
init();
})();
