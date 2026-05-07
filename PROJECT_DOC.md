# Zen-Tap 易道 — 项目结构与算法文档

## 一、项目概述

**Zen-Tap 易道**是一个基于易经六十四卦的互动占卜网站，用户在首页任意位置点击，系统通过密码学伪随机算法生成卦象，结合预置的语义解读数据，呈现个性化的人生指导。另有 AI 问卦功能（DeepSeek 大模型驱动），提供深度对话解读。

---

## 二、整体架构

```
用户浏览器 (前端)
├── 端口 3000  (静态文件服务 / serve.js 代理)
└── 端口 3001  (后端 API / server.js Express)
    ├── sql.js 数据库（文件存储：server/zen_tap.db）
    └── DeepSeek API（AI 问卦）
```

### 目录结构

```
zen-tap-main/
├── public/                          # 前端静态文件（端口3000）
│   ├── index.html                   # 首页：点击感应页
│   ├── content.html                 # 结果展示页
│   ├── ask.html                    # AI 问卦独立页（备用）
│   ├── profile.html                # 用户资料页（备用）
│   ├── js/
│   │   ├── app.js                 # 核心算法 + 卦象生成
│   │   └── api.js                 # AI API 客户端（ZenTapAI）
│   ├── data/
│   │   └── hexagrams/
│   │       ├── Q1/ ~ Q64/         # 每个卦的文件夹
│   │       │   ├── image.svg      # 卦象 SVG 图
│   │       │   ├── info.json      # 基础元信息
│   │       │   └── semantic-v1.json # 语义解读数据（升级后版本）
│   │       ├── semantic-v2.json    # 可能存在的 v2 版本（随机选用）
│   │       └── zen_outputs.json   # 预生成结果列表
│   ├── styles.css
│   └── ico.png / logo.svg
├── server/                         # 后端（端口3001）
│   ├── server.js                   # Express 主入口
│   ├── db/init.js                 # sql.js 数据库初始化
│   └── routes/
│       ├── ai-chat.js             # AI 问卦路由（POST /api/ai-chat）
│       ├── auth.js                # 认证路由
│       ├── subscription.js        # 订阅管理
│       ├── config.js              # 公共配置（PayPal ID 等）
│       ├── hexagrams.js           # 卦象数据路由
│       └── divinations.js         # 占卜记录路由
├── scripts/                        # 工具脚本
│   ├── generate_zen_semantic_library.js
│   ├── generate_full_zen_outputs.js
│   └── utils/helpers.js
├── font/                           # Logo 字体
└── zen_outputs.json               # 预生成结果数据
```

---

## 三、核心算法（app.js）

### 3.1 种子生成（首页 index.html）

用户在首页任意位置点击，产生种子字符串：

```
seed = `${timestamp}|${x},${y}|${uid}|${JSON.stringify(mouseTrail)}`
```

| 字段 | 说明 |
|------|------|
| `timestamp` | 点击时的 Unix 时间戳（毫秒）|
| `x, y` | 鼠标/触摸的屏幕坐标 |
| `uid` | localStorage 中的持久化用户 ID（`zen_` + 8位随机字符串）|
| `mouseTrail` | 最近 10 次鼠标轨迹点（200ms 窗口）|

seed 编码后作为 URL 参数跳转到 `content.html?seed=...`

### 3.2 卦象生成算法

```javascript
// 1. SHA-256 哈希 → 取前8位十六进制 → 无符号32位整数
seed32 = hexToUint32(sha256Hex(seed))  // >>>0 保证无符号

// 2. Xorshift32 PRNG（线性同余伪随机数生成器）
function xorshift32(seed) {
  let x = seed >>> 0;
  return function() {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 0x100000000;  // [0, 1) 浮点数
  };
}
rnd = xorshift32(seed32)

// 3. 生成 6 个爻（每个爻 = 7/8/9/6）
function randomYao(rnd) {
  if (rnd < 0.125) return 9;   // 老阳（动爻）
  if (rnd < 0.500) return 7;   // 少阳
  if (rnd < 0.875) return 8;   // 少阴
  return 6;                      // 老阴（动爻）
}
yaos = [randomYao(rnd()), ...]  // 共6个，索引0=初爻，5=上爻

// 4. 爻位转卦象ID（二进制 → 十进制 + 1）
function yaosToHexagramId(yaos) {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = (yaos[i] === 7 || yaos[i] === 9) ? 1 : 0;
    bits |= (isYang << i);      // bit0=初爻, bit5=上爻
  }
  return "Q" + (bits + 1);      // Q1 ~ Q64
}
```

**二进制与卦象对照举例：**

| yaos（初→上）| 二进制 | 对应卦 |
|-------------|--------|--------|
| [7,7,7,7,7,7] | 000000 | Q1 乾为天 |
| [8,8,8,8,8,8] | 111111 | Q2 坤为地 |
| [1,0,1,1,1,0] (7,9,7,7,7,6) | 011110 | Q16 雷天大壮 |

（`yaos` 存为 7/8/9/6，但 `isYang` 把 7/9 视为阳爻、8/6 视为阴爻）

### 3.3 互卦与变卦计算

```javascript
// 互卦：二三四爻为下卦，三四五爻为上卦（体用关系）
function toMutualYaos(yaos) {
  const [y1,y2,y3,y4,y5,y6] = yaos;
  return [y2, y3, y4, y3, y4, y5];
}

// 变卦：老阳变阴，老阴变阳（阴阳转换）
function toChangedYaos(yaos) {
  return yaos.map(y => y === 9 ? 8 : y === 6 ? 7 : y);
}
```

### 3.4 数据加载逻辑

```javascript
async function loadHexagram(hexId, version = null) {
  // 1. 检测可用版本（v1/v2/v3）
  availableVersions = await detectAvailableVersions(hexId)
  // 2. 随机选一个版本（均匀随机）
  targetVersion = randomPick(availableVersions)
  
  // 3. 加载 semantic-{version}.json
  data = fetch(`/data/hexagrams/${hexId}/semantic-${targetVersion}.json`)
  
  // 4. 提取 segments（兼容两种结构）
  if (data.main?.segments) {
    segments = data.main.segments   // 标准三层结构
  } else if (data.segments) {
    segments = data.segments        // 扁平结构（如 Q54）
  }
  
  return { id, summary, segments, lines, version }
}
```

---

## 四、数据文件结构

### 4.1 info.json（每个卦文件夹下）

```json
{
  "id": "Q1",
  "name": "Hexagram 1",
  "description": "I Ching Hexagram 1",
  "attributes": ["yang", "strong"],
  "element": "heaven"
}
```

### 4.2 semantic-v1.json（标准结构，Q1 ~ Q64）

```json
{
  "id": "Q1",
  "summary": "云开见山天地宽",
  "meta": {
    "hexName": "乾为天",
    "description": "天行健，君子以自强不息……"
  },
  "main": {
    "id": "Q1",
    "yaos": [1, 1, 1, 1, 1, 1],
    "segments": {
      "status":  "当前状态描述（文艺风格）",
      "trend":   "趋势走向描述",
      "mind":    "行动建议/心态描述",
      "risk":    "特别注意/风险提示"
    },
    "lines": [
      {
        "line": 1,
        "yaoCode": "潜龙",
        "text": "初爻解读文字……"
      },
      { "line": 2, "yaoCode": "见龙", "text": "……" },
      // ... 共6条
    ]
  },
  "mutual": {
    "id": "Q1_mutual",
    "segments": {
      "status": "互卦现状描述",
      "trend":  "互卦趋势",
      "mind":   "互卦心态建议",
      "risk":   "互卦风险"
    }
  },
  "changed": {
    "id": "Q1_changed",
    "segments": { ... }
  },
  "related": {           // 仅 Q1 有，其他卦通常无此字段
    "id": "Q1_related",
    "segments": { ... }
  }
}
```

### 4.3 已知数据问题

| 问题 | 说明 |
|------|------|
| Q50 文件夹 | 实际装着 Q49（泽火革）的数据，id 标为 Q49，yaos 也是革卦的 |
| Q54 | 扁平结构（只有 segments + lines，无 main/mutual/changed）|
| Q1 | 独有 `related` 字段，其他卦无此字段 |

---

## 五、前端页面流程

### 5.1 首页（index.html）

```
用户点击/触摸屏幕
    ↓
记录坐标 + 时间戳 + 鼠标轨迹 + uid
    ↓
生成 seed 字符串
    ↓
跳转: content.html?seed={编码后的seed}
    ↓
触发涟漪动画（rippleOut 900ms）
```

视觉：深暖灰背景 + 多个半透明椭圆 aura 呼吸动画 + 中央 Logo + 底部提示文字。

### 5.2 结果页（content.html）

```
解析 URL 参数 seed
    ↓
ZenTap.generateHexagramResult({ timestamp, uid })
    ↓
SHA-256(xorshift32) → yaos[6] → mainId
    ↓
loadHexagram(mainId) → 加载 semantic-v1.json
    ↓
渲染到 4 张 quad-card（四象）：
  - 当前状态  → segments.status
  - 趋势走向  → segments.trend
  - 行动建议  → segments.mind
  - 特别注意  → segments.risk
    ↓
底部按钮：[再次扫描]  [AI 问卦]
```

### 5.3 AI 问卦模态框（content.html 内嵌）

- 点击"AI 问卦"→弹出底部抽屉模态框
- 每日免费 3 次（按天重置），付费会员无限
- PayPal 订阅 ($9.99/月)，按钮通过 PayPal SDK 渲染
- 用户发消息 → POST `/api/ai-chat` → DeepSeek 回复 → 流式渲染

---

## 六、后端 API（端口 3001）

### 6.1 AI 问卦核心路由：`POST /api/ai-chat`

**请求体：**
```json
{
  "uid": "zen_xxxxxx",
  "hexagramId": "Q1",
  "question": "我最近工作很迷茫，该怎么办？",
  "yaos": [7, 9, 8, 6, 7, 8]
}
```

**系统提示词关键规则：**
- 当前时间精确到分钟，用于占卜判断
- 不得提及卦象名称（"乾卦"、"坤卦"等）
- 不得描述爻位、六爻结构等符号信息
- 禁止禅意装饰性语言，直接给判断和行动建议
- 时间必须给出具体公历日期（如"3月28日"），禁止"近日"、"下周"等模糊词
- 像实战派占卜师一样给出可操作指导

**额度控制逻辑：**
```
免费用户：每天 3 次（按日期重置）
注册用户：同上
付费用户：无限
全局月度上限：1500次/月（超限返回 503 + 3~8秒随机延迟）
```

### 6.2 其他路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/subscription` | GET | 查询订阅状态 |
| `/api/subscribe` | POST | 确认订阅（PayPal回调）|
| `/api/config` | GET | 公共配置（PayPal Client ID 等）|

### 6.3 数据库表（sql.js → `server/zen_tap.db`）

| 表名 | 用途 |
|------|------|
| `users` | 用户信息、订阅状态、剩余次数 |
| `sessions` | 登录会话 token |
| `divinations` | 所有占卜记录（种子、卦象、问答）|
| `hexagrams` | 卦象数据缓存 |
| `hexagram_classics` | 周易古经文数据（卦辞、彖传、象传、爻辞）|
| `anon_quota` | 匿名用户每日配额 |
| `global_usage` | 全局月度请求计数 |

---

## 七、部署方式

```bash
# 后端（端口3001）
node server/server.js

# 前端静态服务 + API 反向代理（端口3000）
node server/serve.js   # 纯 Express，无 http-proxy-middleware 依赖
# 或直接用任何静态服务器代理 /api/* 到 3001
```

---

## 八、技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML/CSS/JS（无框架），CSS 变量系统 |
| 前端构建 | 无（纯静态文件）|
| 后端 | Node.js + Express |
| 数据库 | sql.js（浏览器端 SQLite，文件持久化）|
| AI | DeepSeek Chat API（`deepseek-chat` 模型）|
| 支付 | PayPal JS SDK |
| 加密 | Web Crypto API（SHA-256）|

---

## 九、已知问题与待改进

1. **Q50 数据错乱**：文件夹名是 Q50，内容是 Q49 的副本
2. **Q54 扁平结构**：与其他卦不一致，缺少 main/mutual/changed 三层
3. **Q1 独有 related 字段**：数据规范不统一
4. **semantic-v2.json / v3.json**：代码支持多版本随机切换，但大部分卦只有 v1
5. **鼠标轨迹 seed**：JSON.stringify 的 mouseTrail 存在隐私问题（IP、坐标历史）
6. **本地数据库文件**：`server/zen_tap.db` 是 sql.js 的内存数据库文件，需要定期保存

---

*文档生成时间：2026-05-07 | 整理自 jinbrox/zen-tap 仓库*
