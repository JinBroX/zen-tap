// ====================== OpenSee 3.0 · ui/content.js ======================
// 渲染逻辑 —— 纯展示层，卷轴式单页
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
async function fetchSemantic(hexId, field = 'decision') {
  try {
    const resp = await fetch(`/semantic/${field}/${hexId}.json`);
    if (resp.ok) return await resp.json();
  } catch (_) { /* 网络失败直接走 fallback */ }
  const resp = await fetch(`/semantic/${hexId}.json`);
  if (!resp.ok) return null;
  return resp.json();
}

// ---------- Populate Page ----------
function populatePage(judgment, lines, movingLines, decision, changedSemantic, summary) {
  // Section 1: 诗化总结
  let summaryText = '';
  if (typeof summary === 'string') summaryText = summary;
  else if (Array.isArray(summary) && summary.length) summaryText = summary[0];
  document.getElementById('txtSummary').textContent = summaryText || judgment.situation || '';

  // Section 2: 局势
  document.getElementById('txtSituation').textContent = judgment.situation || '';

  // Section 3: 变化
  document.getElementById('txtMovement').textContent = judgment.movement || '';

  // Section 4: 时机
  document.getElementById('txtTiming').textContent = judgment.timing || '';

  // Section 5: 注意
  document.getElementById('txtRisk').textContent = judgment.risk || '';

  // Section 6: 波动 (only if moving lines exist)
  const segWave = document.getElementById('segWave');
  const txtWave = document.getElementById('txtWave');
  if (decision.hasMovement && decision.relevantLines.length > 0) {
    let html = '';
    for (const line of decision.relevantLines) {
      const content = line.scene || line.text;
      html += `<div class="wave-item"><div>${content}</div></div>`;
    }
    txtWave.innerHTML = html;
    segWave.style.display = '';
  } else {
    txtWave.innerHTML = '<div class="wave-still">此卦不变，没有动爻。<br>当前状态趋于稳定。</div>';
    segWave.style.display = '';
  }

  // Section 7: 走向
  let aftermath = judgment.outcome || '';
  if (changedSemantic && decision.hasMovement) {
    aftermath += '\n\n' + (changedSemantic.judgment?.situation || '');
  }
  document.getElementById('txtOutcome').textContent = aftermath;

  // Trigger scroll-in animation
  revealSegments();
}

// ---------- Scroll-triggered reveal ----------
function revealSegments() {
  const segs = document.querySelectorAll('.seg');
  // Small stagger: each seg gets visible class with slight delay
  segs.forEach((seg, i) => {
    if (seg.style.display === 'none') return;
    setTimeout(() => seg.classList.add('visible'), i * 100);
  });
}

// ---------- Transitions (卦变参照) ----------
async function populateTransitions(yaos, hexId, changedHexId) {
  const allTrans = getTransitions(yaos);
  const segRefs = document.getElementById('segRefs');
  let anyVisible = false;

  // --- 错卦 → 反面观察 ---
  if (allTrans.opposite && allTrans.opposite !== hexId) {
    try {
      const sem = await fetchSemantic(allTrans.opposite);
      if (sem) {
        document.getElementById('txtRefOpposite').textContent =
          sem.judgment?.situation || '';
        document.getElementById('refOpposite').style.display = '';
        anyVisible = true;
      }
    } catch (_) {}
  }

  // --- 综卦 → 倒转观察 ---
  if (allTrans.reverse && allTrans.reverse !== hexId) {
    try {
      const sem = await fetchSemantic(allTrans.reverse);
      if (sem) {
        document.getElementById('txtRefReverse').textContent =
          sem.judgment?.situation || '';
        document.getElementById('refReverse').style.display = '';
        anyVisible = true;
      }
    } catch (_) {}
  }

  // --- 互卦 → 内在结构 ---
  if (allTrans.mutual && allTrans.mutual !== hexId) {
    try {
      const sem = await fetchSemantic(allTrans.mutual);
      if (sem && sem.transitions?.mutual) {
        const m = sem.transitions.mutual;
        document.getElementById('txtRefMutual').textContent =
          (m.status || '') + '\n' + (m.trend || '');
        document.getElementById('refMutual').style.display = '';
        anyVisible = true;
      }
    } catch (_) {}
  }

  // --- 之卦 → 变化方向 (仅动爻) ---
  if (changedHexId && changedHexId !== hexId) {
    try {
      const sem = await fetchSemantic(changedHexId);
      if (sem && sem.transitions?.changed) {
        const c = sem.transitions.changed;
        document.getElementById('txtRefChanged').textContent =
          (c.status || '') + '\n' + (c.trend || '');
        document.getElementById('refChanged').style.display = '';
        anyVisible = true;
      }
    } catch (_) {}
  }

  if (anyVisible) {
    segRefs.style.display = '';
    setTimeout(() => segRefs.classList.add('visible'), 700);
  }
}

// ---------- Page Show ----------
function showPage() {
  resultEl.classList.add('visible');
  nav.classList.add('visible');
  navDivider.classList.add('visible');
}

// ---------- Field Switching ----------
let currentS2 = 'decision';
let currentSeed = '';
let currentYaos = null;
let currentHexId = '';
let currentChangedHexId = '';
let currentHasMovement = false;

function setupFieldSwitcher() {
  const label = document.getElementById('navS2Label');
  const fields = ['decision', 'relation', 'career', 'wealth'];
  let fieldIdx = 0;

  label.addEventListener('click', async () => {
    fieldIdx = (fieldIdx + 1) % fields.length;
    const newField = fields[fieldIdx];
    const fieldInfo = getS2Field(newField);
    label.textContent = fieldInfo.label;
    currentS2 = newField;

    // Re-fetch and re-render
    if (!currentSeed) return;

    try {
      const semantic = await fetchSemantic(currentHexId, newField);
      if (!semantic) throw new Error('Semantic data not found');

      let changedSemantic = null;
      if (currentHasMovement) {
        changedSemantic = await fetchSemantic(currentChangedHexId, newField);
      }

      const movingLines = getMovingLines(currentYaos);
      const decision = summarize(semantic.judgment, semantic.lines, movingLines);

      // Clear existing visible classes for re-animation
      document.querySelectorAll('.seg.visible').forEach(s => s.classList.remove('visible'));
      document.getElementById('segRefs').classList.remove('visible');

      populatePage(semantic.judgment, semantic.lines, movingLines, decision, changedSemantic, semantic.summary);

      // Re-populate transitions with new field's data
      await populateTransitions(currentYaos, currentHexId, currentChangedHexId);
    } catch (e) {
      console.error('Field switch error:', e);
    }
  });
}

// ---------- Main Pipeline ----------
function showS2Field(s2Key) {
  const field = getS2Field(s2Key);
  const label = document.getElementById('navS2Label');
  if (field && label) {
    label.textContent = field.label;
  }
  currentS2 = s2Key;
}

async function init() {
  startParticles();

  const params = new URLSearchParams(location.search);
  const seed = params.get('seed');
  const s2Key = params.get('s2') || 'decision';

  showS2Field(s2Key);
  setupFieldSwitcher();

  if (!seed) {
    document.getElementById('txtSummary').textContent = '返回首页，触碰任意位置开始';
    showPage();
    return;
  }

  currentSeed = seed;

  try {
    // 1. engine: seed → hexagram
    const { hexId, yaos } = generateHexagram(seed);
    currentHexId = hexId;
    currentYaos = yaos;

    // 2. line_engine: yaos → moving_lines
    const movingLines = getMovingLines(yaos);

    // 3. line_engine: changed hexagram (之卦)
    const changedYaos = getChangedYaos(yaos);
    const changedHexId = yaosToHexagramId(changedYaos);
    currentChangedHexId = changedHexId;
    currentHasMovement = movingLines.length > 0 && changedHexId !== hexId;

    // 4. semantic: 本卦 + 之卦 (if changed)
    const semantic = await fetchSemantic(hexId, s2Key);
    if (!semantic) throw new Error('Semantic data not found');
    let changedSemantic = null;
    if (currentHasMovement) {
      changedSemantic = await fetchSemantic(changedHexId, s2Key);
    }

    // 5. decision: structural summary
    const decision = summarize(semantic.judgment, semantic.lines, movingLines);

    // 6. render
    populatePage(semantic.judgment, semantic.lines, movingLines, decision, changedSemantic, semantic.summary);

    // 7. transitions
    populateTransitions(yaos, hexId, changedHexId);
  } catch (e) {
    console.error('Pipeline error:', e);
    document.getElementById('txtSummary').textContent = '系统异常，请返回重试';
  }

  showPage();
}

// ---------- Bootstrap ----------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
