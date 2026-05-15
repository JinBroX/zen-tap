// ====================== OpenSee 3.0 · ui/index.js ======================
// 入口交互 —— 纯 UI 层
// 负责: aura 呼吸圆、涟漪、鼠标轨迹、seed 生成、页面跳转
// 不参与: 卦象计算、语义判断

import { generateSeed } from '/core/seed.js';
import { S2_FIELDS } from '/s2/s2.js';

// ---------- UID ----------
function getUid() {
  let uid = localStorage.getItem('opensee_uid');
  if (!uid) {
    uid = 'opensee_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('opensee_uid', uid);
  }
  return uid;
}

// ---------- S2 Field ----------
let currentS2 = 'decision';

function initS2Selector() {
  const sel = document.getElementById('s2Selector');
  if (!sel) return;
  sel.addEventListener('click', (e) => {
    const btn = e.target.closest('.s2-btn');
    if (!btn) return;
    e.stopPropagation();
    sel.querySelectorAll('.s2-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentS2 = btn.dataset.s2;
  });
}

// ---------- Config ----------
const CFG = {
  auraCount: window.innerWidth < 768 ? 9 : 13,
  trailMaxLen: 10,
  trailWindow: 200,
  breatheMin: 5,
  breatheRange: 4,
  rippleDuration: 900,
};

const AURA_COLORS = [
  'rgba(185,165,130, 0.22)',
  'rgba(160,150,140, 0.18)',
  'rgba(140,155,170, 0.16)',
  'rgba(175,158,130, 0.20)',
  'rgba(150,145,138, 0.15)',
  'rgba(180,168,140, 0.19)',
  'rgba(135,148,162, 0.14)',
  'rgba(165,148,122, 0.17)',
];

// ---------- Mouse Trail ----------
let mouseTrail = [];

function recordMove(e) {
  const now = Date.now();
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  mouseTrail.push({ x, y, t: now });
  const cutoff = now - CFG.trailWindow;
  mouseTrail = mouseTrail.filter(p => p.t >= cutoff).slice(-CFG.trailMaxLen);
}

// ---------- Ripple ----------
function ripple(x, y) {
  const el = document.createElement('div');
  el.className = 'ripple';
  const c = AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)];
  el.style.cssText = `
    left: ${x}px; top: ${y}px;
    width: 80px; height: 80px;
    background: ${c};
    border: 1px solid ${c};
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), CFG.rippleDuration);
}

// ---------- Generate & Navigate ----------
async function onTouch(e) {
  e.preventDefault();
  const x = Math.round(e.clientX || e.touches?.[0]?.clientX || 0);
  const y = Math.round(e.clientY || e.touches?.[0]?.clientY || 0);
  const ts = Date.now();
  const uid = getUid();
  const entropy = `${x},${y}|${JSON.stringify(mouseTrail)}|s2:${currentS2}`;

  const seed = await generateSeed({ timestamp: ts, uid, entropy });

  ripple(x, y);
  setTimeout(() => {
    const params = new URLSearchParams({ seed, s2: currentS2 });
    location.href = `content.html?${params}`;
  }, 350);
}

// ---------- Aura ----------
class Aura {
  constructor(layer) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const minD = Math.min(W, H);

    this.w = minD * (0.25 + Math.random() * 0.45);
    this.h = this.w * (0.8 + Math.random() * 0.4);
    this.x = Math.random() * (W - this.w);
    this.y = Math.random() * (H - this.h);
    this.colorIdx = Math.floor(Math.random() * AURA_COLORS.length);
    this.phase = Math.random() * Math.PI * 2;
    this.speed = 0.18 + Math.random() * 0.14;
    this.breathe = CFG.breatheMin + Math.random() * CFG.breatheRange;

    this.el = document.createElement('div');
    this.el.className = 'aura';
    this.el.style.cssText = `
      width: ${this.w}px; height: ${this.h}px;
      background: ${AURA_COLORS[this.colorIdx]};
      filter: blur(1px);
    `;
    layer.appendChild(this.el);
    this.update();
  }

  update() {
    const t = Date.now() * 0.001;
    const cycle = (t * this.speed + this.phase) % (this.breathe * 2);
    const breathRatio = cycle < this.breathe
      ? cycle / this.breathe
      : 2 - cycle / this.breathe;

    const opacity = 0.05 + breathRatio * 0.25;
    const dx = Math.sin(t * 0.6 + this.phase) * 12;
    const dy = Math.cos(t * 0.5 + this.phase * 1.3) * 8;

    this.el.style.opacity = opacity;
    this.el.style.left = (this.x + dx) + 'px';
    this.el.style.top = (this.y + dy) + 'px';
    this.el.style.transform = `scale(${0.9 + breathRatio * 0.2})`;

    requestAnimationFrame(() => this.update());
  }

  destroy() { this.el?.remove(); }
}

// ---------- Init ----------
let auras = [];

function initAuras() {
  const layer = document.getElementById('auraLayer');
  auras.forEach(a => a.destroy());
  auras = [];
  for (let i = 0; i < CFG.auraCount; i++) {
    auras.push(new Aura(layer));
  }
}

// ---------- Bootstrap ----------
document.addEventListener('DOMContentLoaded', () => {
  initAuras();
  initS2Selector();
  document.addEventListener('mousemove', recordMove, { passive: true });
  document.addEventListener('touchmove', recordMove, { passive: true });
  document.addEventListener('click', onTouch);
  document.addEventListener('touchend', onTouch, { passive: true });
});

window.addEventListener('resize', () => setTimeout(initAuras, 300));

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r') initAuras();
});
