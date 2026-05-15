// ====================== OpenSee 3.0 · line_engine.js ======================
// 动爻规则 —— 铜钱规则映射
// 输入: yaos (number[6])
// 输出: moving_lines (number[])
// 规则: 6 (老阴) / 9 (老阳) = 动爻, 7 (少阳) / 8 (少阴) = 静爻

export function getMovingLines(yaos) {
  const moving = [];
  for (let i = 0; i < yaos.length; i++) {
    if (yaos[i] === 6 || yaos[i] === 9) {
      moving.push(i + 1);
    }
  }
  return moving;
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeLineEngine = { getMovingLines };
}
