// ====================== OpenSee 3.0 · decision.js ======================
// 轻量结果汇总 —— 不生成新语义，只做结构归纳
// 输入: { judgment, lines, movingLines }
// 输出: { state, direction, advice }

export function summarize(judgment, lines, movingLines) {
  const hasMovement = movingLines && movingLines.length > 0;

  return {
    state:     judgment?.situation || '',
    direction: judgment?.movement  || '',
    timing:    judgment?.timing    || '',
    risk:      judgment?.risk      || '',
    advice:    judgment?.outcome   || '',
    hasMovement,
    movingLineCount: hasMovement ? movingLines.length : 0,
    relevantLines: hasMovement
      ? (lines || []).filter(l => movingLines.includes(l.line))
      : []
  };
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeDecision = { summarize };
}
