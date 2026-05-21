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

// bits → 文王卦序映射表（索引=bits值，值=文王序号）
const BITS_TO_KING_WEN = [
   2, 24,  7, 19, 15, 36, 46, 11,
  16, 51, 40, 54, 62, 55, 32, 34,
   8,  3, 29, 60, 39, 63, 48,  5,
  45, 17, 47, 58, 31, 49, 28, 43,
  23, 27,  4, 41, 52, 22, 18, 26,
  35, 21, 64, 38, 56, 30, 50, 14,
  20, 42, 59, 61, 53, 37, 57,  9,
  12, 25,  6, 10, 33, 13, 44,  1
];

export function yaosToHexagramId(yaos) {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = (yaos[i] === 7 || yaos[i] === 9) ? 1 : 0;
    bits |= (isYang << i);
  }
  const kingWen = BITS_TO_KING_WEN[bits];
  return 'Q' + kingWen;
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeLineEngine = { getMovingLines, getChangedYaos, yaosToHexagramId };
}
