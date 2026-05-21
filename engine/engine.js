// ====================== OpenSee 3.0 · engine.js ======================
// 卦象生成 —— 唯一计算核心
// 不包含任何语义、文本逻辑、DOM 操作、fetch 调用
// 输入: seed (hex string)
// 输出: { hexId, yaos }

function hexToUint32(hex) {
  return parseInt(hex.slice(0, 8), 16) >>> 0;
}

function xorshift32(seed) {
  let x = seed >>> 0;
  return function () {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 0x100000000;
  };
}

function randomYao(rnd) {
  if (rnd < 0.125) return 9;
  if (rnd < 0.5)   return 7;
  if (rnd < 0.875) return 8;
  return 6;
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

function yaosToHexagramId(yaos) {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = (yaos[i] === 7 || yaos[i] === 9) ? 1 : 0;
    bits |= (isYang << i);
  }
  const kingWen = BITS_TO_KING_WEN[bits];
  return 'Q' + kingWen;
}

export function generateHexagram(seed) {
  const seed32 = hexToUint32(seed);
  const rng = xorshift32(seed32);
  const yaos = Array.from({ length: 6 }, () => randomYao(rng()));
  const hexId = yaosToHexagramId(yaos);
  return { hexId, yaos };
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeEngine = { generateHexagram, xorshift32, randomYao, yaosToHexagramId, hexToUint32 };
}
