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

// 之卦：动爻变后产生的新卦
// 6 (老阴) → 7 (少阳), 9 (老阳) → 8 (少阴), 7/8 不变
const CHANGE = { 6: 7, 7: 7, 8: 8, 9: 8 };

export function getChangedYaos(yaos) {
  return yaos.map(y => CHANGE[y]);
}

export function yaosToHexagramId(yaos) {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = (yaos[i] === 7 || yaos[i] === 9) ? 1 : 0;
    bits |= (isYang << i);
  }
  return 'Q' + (bits + 1);
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeLineEngine = { getMovingLines, getChangedYaos, yaosToHexagramId };
}
