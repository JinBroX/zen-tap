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

function yaosToHexagramId(yaos) {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = (yaos[i] === 7 || yaos[i] === 9) ? 1 : 0;
    bits |= (isYang << i);
  }
  return 'Q' + (bits + 1);
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
