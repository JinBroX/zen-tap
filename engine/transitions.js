// ====================== OpenSee 3.0 · transitions.js ======================
// 卦变关系 —— 错卦 / 综卦 / 互卦
// 输入: yaos (number[6])，输出: { opposite, reverse, mutual } hex IDs

const FLIP = { 6: 9, 9: 6, 7: 8, 8: 7 };

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

function yaosToId(yaos) {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = (yaos[i] === 7 || yaos[i] === 9) ? 1 : 0;
    bits |= (isYang << i);
  }
  const kingWen = BITS_TO_KING_WEN[bits];
  return 'Q' + kingWen;
}

export function getOpposite(yaos) {
  return yaos.map(y => FLIP[y]);
}

export function getReverse(yaos) {
  return [...yaos].reverse();
}

export function getMutual(yaos) {
  // Lower trigram = lines 2,3,4 / Upper trigram = lines 3,4,5 (1-indexed)
  return [yaos[1], yaos[2], yaos[3], yaos[2], yaos[3], yaos[4]];
}

export function getTransitions(yaos) {
  const opposite = yaosToId(getOpposite(yaos));
  const reverse  = yaosToId(getReverse(yaos));
  const mutual   = yaosToId(getMutual(yaos));
  return { opposite, reverse, mutual };
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeTransitions = { getOpposite, getReverse, getMutual, getTransitions };
}
