// ====================== OpenSee 3.0 · s2.js ======================
// 场域定义 —— 仅 UI 层使用
// 不参与 seed / engine / 随机性
// 可用于: UI 展示 / semantic 解释过滤（后续扩展）

export const S2_FIELDS = {
  relation: { key: 'relation', label: '关系',   description: '人际、情感、家庭' },
  career:   { key: 'career',   label: '事业',   description: '工作、方向、成长' },
  wealth:   { key: 'wealth',   label: '资源',   description: '财务、物质、积累' },
  decision: { key: 'decision', label: '决策',   description: '选择、判断、行动' }
};

export const S2_KEYS = Object.keys(S2_FIELDS);

export function getS2Field(key) {
  return S2_FIELDS[key] || null;
}

// Browser global fallback
if (typeof window !== 'undefined') {
  window.OpenSeeS2 = { S2_FIELDS, S2_KEYS, getS2Field };
}
