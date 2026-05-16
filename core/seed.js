// ====================== OpenSee 3.0 · seed.js ======================
// 纯输入采样 —— 不读取 S2 / semantic / 业务逻辑
// 输入: { timestamp, uid, entropy }
// 输出: SHA-256 hex string (crypto.subtle) 或纯JS fallback (HTTP)

function simpleHash256(data) {
  // Pure JS fallback — iterated FNV-1a style hash producing 256-bit output.
  // Feeds into XORshift32 PRNG, so cryptographic strength is unnecessary.
  const bytes = new Uint8Array(data);
  const chunks = [];
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
    h >>>= 0;
  }
  // Generate 8 x 32-bit hash values by re-hashing with iteration counter
  for (let r = 0; r < 8; r++) {
    let hr = h ^ (r * 0x9e3779b9);
    hr >>>= 0;
    for (let i = 0; i < bytes.length; i++) {
      hr ^= bytes[i];
      hr = Math.imul(hr, 0x01000193);
      hr >>>= 0;
    }
    chunks.push(hr.toString(16).padStart(8, '0'));
  }
  return chunks.join('');
}

export async function generateSeed(opts = {}) {
  const timestamp = opts.timestamp || Date.now();
  const uid = opts.uid || 'anonymous';
  const entropy = opts.entropy || '';
  const seedBase = `${timestamp}|${uid}|${entropy}`;
  const enc = new TextEncoder();
  const data = enc.encode(seedBase);

  // crypto.subtle requires secure context (HTTPS/localhost).
  // Fall back to pure JS hash when unavailable (HTTP).
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const bytes = new Uint8Array(hashBuffer);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (_) {
      // crypto.subtle threw — fall through to pure JS
    }
  }

  return simpleHash256(data);
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeSeed = { generateSeed };
}
