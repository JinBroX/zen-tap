// ====================== OpenSee 3.0 · ui/content.js ======================
// 渲染逻辑 — 全屏翻页式，每屏一段
// 数据流: seed → engine(hexId) → semantic fetch → render pages

import { generateHexagram } from '/engine/engine.js';
import { getS2Field } from '/s2/s2.js';

// ---------- DOM Refs ----------
const resultEl      = document.getElementById('result');
const nav           = document.getElementById('nav');
const navDivider    = document.getElementById('navDivider');
const pageSlider    = document.getElementById('pageSlider');
const pageIndicator = document.getElementById('pageIndicator');
const scrollHint    = document.getElementById('scrollHint');

const pages     = document.querySelectorAll('.page');
const dots      = document.querySelectorAll('.dot');
const totalPages = pages.length;

let currentPage = 0;

// ---------- Particle System ----------
const pCanvas = document.getElementById('particleCanvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];
let pRaf = null;

function resizeParticles() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
}

function spawnParticles() {
  const count = window.innerWidth < 768 ? 15 : 25;
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * pCanvas.width,
      y: Math.random() * pCanvas.height,
      r: 0.4 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.12 - Math.random() * 0.35,
      a: 0.06 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
      period: 14 + Math.random() * 28,
    });
  }
}

function drawParticles(t) {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  const s = t * 0.001;
  for (const p of particles) {
    p.x += p.vx + Math.sin(s * 0.4 + p.phase) * 0.06;
    p.y += p.vy;
    if (p.y < -10) { p.y = pCanvas.height + 10; p.x = Math.random() * pCanvas.width; }
    if (p.x < -10) p.x = pCanvas.width + 10;
    if (p.x > pCanvas.width + 10) p.x = -10;
    const pulse = 0.6 + 0.4 * Math.sin(s * 0.6 + p.phase);
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(195,155,105,${(p.a * pulse).toFixed(3)})`;
    pCtx.fill();
  }
  pRaf = requestAnimationFrame(drawParticles);
}

function startParticles() {
  resizeParticles();
  spawnParticles();
  pRaf = requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', () => { resizeParticles(); spawnParticles(); });

// ---------- Fetch Semantic ----------
async function fetchSemantic(hexId, field = 'decision') {
  try {
    const resp = await fetch(`/semantic/${field}/${hexId}.json`);
    if (resp.ok) return await resp.json();
  } catch (_) {}
  const resp = await fetch(`/semantic/${hexId}.json`);
  if (!resp.ok) return null;
  return resp.json();
}

// ---------- Render Content ----------
function renderAngles(semantic) {
  document.getElementById('txtSummary').textContent = semantic.summary || '';
  document.getElementById('txtLandscape').textContent = semantic.angles?.landscape || '';
  document.getElementById('txtInner').textContent = semantic.angles?.inner || '';
  document.getElementById('txtPivot').textContent = semantic.angles?.pivot || '';
  document.getElementById('txtEvolution').textContent = semantic.angles?.evolution || '';

  // 激活第一页
  activatePage(0);
}

// ---------- Page Activation ----------
function activatePage(index) {
  currentPage = index;

  // Update pages
  pages.forEach((page, i) => {
    if (i === index) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });

  // Update dots
  dots.forEach((dot, i) => {
    if (i === index) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  // Hide scroll hint after first scroll
  if (index > 0) {
    scrollHint.classList.add('hidden');
  } else {
    scrollHint.classList.remove('hidden');
  }
}

// ---------- Scroll Detection (IntersectionObserver) ----------
function setupScrollDetection() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pageIndex = parseInt(entry.target.dataset.page, 10);
        if (!isNaN(pageIndex)) {
          activatePage(pageIndex);
        }
      }
    });
  }, {
    root: pageSlider,
    threshold: 0.55,
  });

  pages.forEach(page => observer.observe(page));
}

// ---------- Dot Click Navigation ----------
function setupDotNavigation() {
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const pageIndex = parseInt(dot.dataset.page, 10);
      if (!isNaN(pageIndex)) {
        pages[pageIndex].scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ---------- Page Show ----------
function showPage() {
  resultEl.classList.add('visible');
  nav.classList.add('visible');
  navDivider.classList.add('visible');
  pageIndicator.classList.add('visible');
  scrollHint.classList.add('visible');
}

// ---------- Field Switching ----------
let currentS2 = 'decision';
let currentSeed = '';
let currentHexId = '';

function setupFieldSwitcher() {
  const label = document.getElementById('navS2Label');
  const fields = ['decision', 'relation', 'career', 'wealth'];
  let fieldIdx = 0;

  label.addEventListener('click', async () => {
    fieldIdx = (fieldIdx + 1) % fields.length;
    const newField = fields[fieldIdx];
    label.textContent = getS2Field(newField).label;
    currentS2 = newField;

    if (!currentSeed) return;

    const semantic = await fetchSemantic(currentHexId, newField);
    if (!semantic) return;

    // Reset to first page and re-render
    renderAngles(semantic);
    pageSlider.scrollTop = 0;
  });
}

// ---------- Main Pipeline ----------
function showS2Field(s2Key) {
  const field = getS2Field(s2Key);
  const label = document.getElementById('navS2Label');
  if (field && label) label.textContent = field.label;
  currentS2 = s2Key;
}

async function init() {
  startParticles();

  const params = new URLSearchParams(location.search);
  const seed = params.get('seed');
  const s2Key = params.get('s2') || 'decision';

  showS2Field(s2Key);
  setupFieldSwitcher();
  setupScrollDetection();
  setupDotNavigation();

  if (!seed) {
    document.getElementById('txtSummary').textContent = '返回首页，触碰任意位置开始';
    activatePage(0);
    showPage();
    return;
  }

  currentSeed = seed;

  try {
    const { hexId } = generateHexagram(seed);
    currentHexId = hexId;

    const semantic = await fetchSemantic(hexId, s2Key);
    if (!semantic) throw new Error('Semantic data not found');

    renderAngles(semantic);
  } catch (e) {
    console.error('Pipeline error:', e);
    document.getElementById('txtSummary').textContent = '系统异常，请返回重试';
    activatePage(0);
  }

  showPage();
}

// ---------- Bootstrap ----------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
