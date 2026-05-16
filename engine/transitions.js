// ====================== OpenSee 3.0 · transitions.js ======================
// 卦变关系 —— 错卦 / 综卦 / 互卦
// 输入: yaos (number[6])，输出: { opposite, reverse, mutual } hex IDs

const FLIP = { 6: 9, 9: 6, 7: 8, 8: 7 };

function yaosToId(yaos) {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = (yaos[i] === 7 || yaos[i] === 9) ? 1 : 0;
    bits |= (isYang << i);
  }
  return 'Q' + (bits + 1);
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
