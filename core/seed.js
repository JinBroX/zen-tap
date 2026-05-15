// ====================== OpenSee 3.0 · seed.js ======================
// 纯输入采样 —— 不读取 S2 / semantic / 业务逻辑
// 输入: { timestamp, uid, entropy }
// 输出: SHA-256 hex string

export async function generateSeed(opts = {}) {
  const timestamp = opts.timestamp || Date.now();
  const uid = opts.uid || 'anonymous';
  const entropy = opts.entropy || '';
  const seedBase = `${timestamp}|${uid}|${entropy}`;
  const enc = new TextEncoder();
  const data = enc.encode(seedBase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeSeed = { generateSeed };
}
