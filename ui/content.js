// ====================== OpenSee 3.0 · ui/content.js ======================
// 渲染逻辑 —— 纯展示层
// 不参与计算、不参与逻辑判断
// 数据流: seed → engine → line_engine → semantic fetch → decision → render

import { generateHexagram } from '/engine/engine.js';
import { getMovingLines, getChangedYaos, yaosToHexagramId } from '/engine/line_engine.js';
import { getTransitions } from '/engine/transitions.js';
import { summarize } from '/decision/decision.js';
import { getS2Field } from '/s2/s2.js';

// ---------- DOM Refs ----------
const resultEl   = document.getElementById('result');
const nav        = document.getElementById('nav');
const navDivider = document.getElementById('navDivider');
const stage      = document.getElementById('carouselStage');
const dots       = document.getElementById('carouselDots');
const arrowUp    = document.getElementById('arrowUp');
const arrowDown  = document.getElementById('arrowDown');

let activeIdx = 0;
let cardCount = 7;
let busy = false;

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
  const count = 25;
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
// field 对应四场域子目录: decision / relation / career / wealth
// 优先读子目录文件，不存在则 fallback 到根目录（兜底）
async function fetchSemantic(hexId, field = 'decision') {
  // 尝试场域专属文件
  try {
    const resp = await fetch(`/semantic/${field}/${hexId}.json`);
    if (resp.ok) return await resp.json();
  } catch (_) { /* 网络失败直接走 fallback */ }
  // fallback: 通用语义根目录
  const resp = await fetch(`/semantic/${hexId}.json`);
  if (!resp.ok) return null;
  return resp.json();
}

// ---------- Populate Cards ----------
function populateCards(hexName, judgment, lines, movingLines, decision, changedSemantic) {
  // Card 0: 总览 - 只显示 situation，不显示卦名
  document.getElementById('cardSummary').textContent = judgment.situation || '';

  document.getElementById('cardReflection').textContent = judgment.situation || '';
  document.getElementById('cardMind').textContent = judgment.movement || '';
  document.getElementById('cardFlow').textContent = judgment.timing || '';
  document.getElementById('cardAttention').textContent = judgment.risk || '';

  // Card 5: 波动 (moving lines)
  const movingWrapper = document.getElementById('cardMovingWrapper');
  if (decision.hasMovement && decision.relevantLines.length > 0) {
    let html = '';
    for (const line of decision.relevantLines) {
      // 优先使用 scene（场景化解读），fallback 到 text（短句）
      const content = line.scene || line.text;
      html += `<div class="card-moving-item"><div>${content}</div></div>`;
    }
    document.getElementById('cardMoving').innerHTML = html;
    movingWrapper.style.display = '';
  } else {
    movingWrapper.style.display = '';
    document.getElementById('cardMoving').innerHTML =
      '<div class="card-moving-still">此卦不变，没有动爻。<br>当前状态趋于稳定。</div>';
  }

  // Card 6: 走向 → 本卦 outcome + 之卦 situation (如有动爻)，不显示卦名
  let aftermath = judgment.outcome || '';
  if (changedSemantic && decision.hasMovement) {
    aftermath += '\n\n' + (changedSemantic.judgment?.situation || '');
  }
  document.getElementById('cardAftermath').textContent = aftermath;

  buildDotIndicators();
}

function buildDotIndicators() {
  const cards = stage.querySelectorAll('.carousel-card');
  const visibleCards = [];
  cards.forEach((card, i) => {
    if (card.style.display === 'none') return;
    const body = card.querySelector('.card-body') || card.querySelector('.card-summary');
    if (body && !body.textContent.trim() && !body.innerHTML.trim()) return;
    visibleCards.push(i);
  });

  cardCount = visibleCards.length;
  if (cardCount === 0) return;

  dots.innerHTML = '';
  for (let i = 0; i < cardCount; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dots.appendChild(dot);
  }

  goTo(0, true);
  updateArrows();
}

function showPage() {
  resultEl.classList.add('visible');
  nav.classList.add('visible');
  navDivider.classList.add('visible');
  setTimeout(() => {
    arrowUp.classList.add('visible');
    arrowDown.classList.add('visible');
  }, 800);
}

// ---------- Vertical Carousel ----------
function goTo(idx, instant) {
  if (idx < 0 || idx >= cardCount || busy) return;
  busy = true;
  const prev = activeIdx;
  activeIdx = idx;

  const cards = getVisibleCards();
  if (instant) {
    cards.forEach((card, i) => {
      card.classList.remove('active', 'exit-up', 'exit-down');
      if (i === idx) card.classList.add('active');
    });
  } else if (idx > prev) {
    cards[prev].classList.add('exit-up');
    cards[prev].classList.remove('active');
    cards[idx].classList.add('active');
    cards[idx].classList.remove('exit-up', 'exit-down');
  } else {
    cards[prev].classList.add('exit-down');
    cards[prev].classList.remove('active');
    cards[idx].classList.add('active');
    cards[idx].classList.remove('exit-up', 'exit-down');
  }

  const allDots = dots.querySelectorAll('.carousel-dot');
  allDots.forEach((d, i) => d.classList.toggle('active', i === idx));

  updateArrows();
  setTimeout(() => { busy = false; }, 600);
}

function getVisibleCards() {
  return Array.from(stage.querySelectorAll('.carousel-card'))
    .filter(c => c.style.display !== 'none');
}

function updateArrows() {
  arrowUp.style.display = '';
  arrowDown.style.display = '';
}

function next() { goTo((activeIdx + 1) % cardCount); }
function prev() { goTo((activeIdx - 1 + cardCount) % cardCount); }

arrowUp.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
arrowDown.addEventListener('click', (e) => { e.stopPropagation(); next(); });
stage.addEventListener('click', () => { next(); });

document.addEventListener('keydown', e => {
  if (!resultEl.classList.contains('visible')) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); next(); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); prev(); }
});

let touchStartY = 0;
stage.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

stage.addEventListener('touchend', e => {
  if (!resultEl.classList.contains('visible')) return;
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 40) { dy > 0 ? next() : prev(); }
}, { passive: true });

stage.addEventListener('wheel', e => {
  if (!resultEl.classList.contains('visible')) return;
  if (Math.abs(e.deltaY) > 20) {
    e.preventDefault();
    e.deltaY > 0 ? next() : prev();
  }
}, { passive: false });

// ---------- Transitions ----------
async function populateTransitions(yaos, hexId, changedHexId) {
  const allTrans = getTransitions(yaos);
  const types = [
    { key: 'changed',  id: 'transChanged',  label: '之', hexId: changedHexId },
    { key: 'mutual',   id: 'transMutual',   label: '互', hexId: allTrans.mutual },
    { key: 'opposite', id: 'transOpposite', label: '错', hexId: allTrans.opposite },
    { key: 'reverse',  id: 'transReverse',  label: '综', hexId: allTrans.reverse }
  ];

  for (const t of types) {
    const targetId = t.hexId;
    const pill = document.getElementById(t.id);
    if (!pill || !targetId || targetId === hexId) continue;

    try {
      const sem = await fetchSemantic(targetId);  // transitions 用默认场域(decision)兜底
      if (sem) {
        pill.querySelector('.trans-name').textContent = sem.hexName || targetId;
        pill.querySelector('.trans-hint').textContent =
          (sem.judgment?.situation || '').slice(0, 18);
        pill.title = sem.judgment?.situation || '';
      }
    } catch (_) {
      pill.querySelector('.trans-name').textContent = targetId;
    }
  }
}

// ---------- Main Pipeline ----------
function showS2Field(s2Key) {
  const field = getS2Field(s2Key);
  const label = document.getElementById('navS2Label');
  if (field && label) {
    label.textContent = field.label;
    label.classList.add('visible');
  }
}

async function init() {
  startParticles();

  const params = new URLSearchParams(location.search);
  const seed = params.get('seed');
  const s2Key = params.get('s2') || 'decision';

  showS2Field(s2Key);

  if (!seed) {
    document.getElementById('cardSummary').textContent = '返回首页，触碰任意位置开始';
    showPage();
    return;
  }

  try {
    // 1. engine: seed → hexagram
    const { hexId, yaos } = generateHexagram(seed);

    // 2. line_engine: yaos → moving_lines
    const movingLines = getMovingLines(yaos);

    // 3. line_engine: changed hexagram (之卦)
    const changedYaos = getChangedYaos(yaos);
    const changedHexId = yaosToHexagramId(changedYaos);
    const hasMovement = movingLines.length > 0 && changedHexId !== hexId;

    // 4. semantic: 本卦 + 之卦 (if changed)，按当前场域读取
    const semantic = await fetchSemantic(hexId, s2Key);
    if (!semantic) throw new Error('Semantic data not found');
    let changedSemantic = null;
    if (hasMovement) {
      changedSemantic = await fetchSemantic(changedHexId, s2Key);
    }

    // 5. decision: structural summary
    const decision = summarize(semantic.judgment, semantic.lines, movingLines);

    // 6. render
    populateCards(semantic.hexName, semantic.judgment, semantic.lines, movingLines, decision, changedSemantic);

    // 7. transitions
    populateTransitions(yaos, hexId, changedHexId);
  } catch (e) {
    console.error('Pipeline error:', e);
    document.getElementById('cardSummary').textContent = '系统异常，请返回重试';
  }

  showPage();
}

// ---------- Bootstrap ----------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
