# OpenSee 语义数据结构规范 v3.0

## 设计原则

融合 `semantic/decision` 的犀利现代语言风格 + `old-hexagrams` 的具象化可操作性。

## 文件结构

```
semantic/
├── decision/Q{n}.json    # 决策场域
├── relation/Q{n}.json    # 关系场域
├── career/Q{n}.json      # 事业场域
├── wealth/Q{n}.json      # 资源场域
└── Q{n}.json             # 通用 fallback（保留现有）
```

## JSON Schema

```json
{
  "id": "Q30",
  "hexName": "离为火",
  "meta": {
    "description": "明两作，离，君子以继明照于四方",
    "upper": "离",
    "lower": "离",
    "element": "fire"
  },
  "judgment": {
    "situation": "火在燃烧，光向外扩散。你在发亮——不是反射别人的光，是自己烧出来的。",
    "movement": "火必须依附在薪上才能烧。你的光需要载体：一件事、一个人、一个位置。",
    "timing": "可以亮出来。这是你发光的时刻。",
    "risk": "烧得太旺，薪尽火灭。忘了自己靠什么在烧。",
    "outcome": "明而不耀，光而不灼。温暖比刺眼更有穿透力。"
  },
  "lines": [
    {
      "line": 1,
      "yaoCode": "履错然",
      "text": "步子乱了。",
      "scene": "初涉新领域需谨慎。向行业前辈请教，以谦逊态度学习规则。"
    },
    {
      "line": 2,
      "yaoCode": "黄离元吉",
      "text": "附着在黄色上。",
      "scene": "以中正之道依附。选择价值观相符的团队，在和谐中共同成长。"
    },
    {
      "line": 3,
      "yaoCode": "日昃之离",
      "text": "太阳偏西了。",
      "scene": "光明将尽需准备。在顺境中储备资源，为可能的变化做准备。"
    },
    {
      "line": 4,
      "yaoCode": "突如其来如",
      "text": "突然就来了。",
      "scene": "突然变化保持镇定。遇到突发状况时先稳定情绪，再寻求解决方案。"
    },
    {
      "line": 5,
      "yaoCode": "出涕沱若",
      "text": "眼泪下来了。",
      "scene": "情感依附需适度。在亲密关系中保持个人空间，避免过度情绪依赖。"
    },
    {
      "line": 6,
      "yaoCode": "王用出征",
      "text": "上面的，出手了。",
      "scene": "依附成熟后独立发光。将学到的经验转化为自己的能力，开始引领他人。"
    }
  ],
  "transitions": {
    "mutual": {
      "status": "依附过程中内在光芒也在增长",
      "trend": "借光而行终将自成光源",
      "mind": "观察月亮如何反射阳光又展现独特光华",
      "risk": "长期依附可能延缓自主能力的形成"
    },
    "changed": {
      "status": "从依附转向独立，需要勇气承担",
      "trend": "积累的智慧将成为自主发光的能量",
      "mind": "像雏鹰离巢前的最后一次振翅练习",
      "risk": "突然独立可能面临经验不足的挑战"
    }
  },
  "summary": "薪火相传光明生"
}
```

## 字段说明

### judgment（卦辞）
- **situation**: 当前状态，犀利直白，semantic/decision 风格
- **movement**: 趋势，说清楚能量在往哪走
- **timing**: 时机判断，可以/不可以行动
- **risk**: 风险提示，点出盲区
- **outcome**: 走向，如果按当前路径会到哪

### lines（爻辞）
- **line**: 爻位 1-6
- **yaoCode**: 传统爻辞原文（如"履错然"）
- **text**: 短句，保留 semantic/decision 的诗意抽象（5-15字）
- **scene**: 场景化解读，old-hexagrams 风格，具体可操作（15-40字）

### transitions（卦变）
- **mutual**: 互卦的四维度（status/trend/mind/risk）
- **changed**: 之卦的四维度（动爻变化后的走向）

### meta
- 传统信息：卦辞、上下卦、五行属性

## 场域差异化策略

同一卦在不同场域的差异：

| 字段 | decision | relation | career | wealth |
|------|----------|----------|--------|--------|
| judgment | 通用 | 通用 | 通用 | 通用 |
| lines.text | 通用 | 通用 | 通用 | 通用 |
| **lines.scene** | **决策场景** | **关系场景** | **事业场景** | **财运场景** |

**示例**：离卦初九"履错然"

- **decision**: "初涉新领域需谨慎。向行业前辈请教，以谦逊态度学习规则。"
- **relation**: "新关系起步时别急着定义。观察对方的节奏，先同频再靠近。"
- **career**: "新岗位前三个月是观察期。多听少说，摸清团队文化再发力。"
- **wealth**: "新投资标的先小额试水。用小钱验证逻辑，别一上来就重仓。"

## 生成优先级

1. **Phase 1**: 补全 decision 场域的 64 卦（添加 yaoCode + scene 字段）
2. **Phase 2**: 生成 relation/career/wealth 三场域的 lines.scene（192 卦 × 6 爻 = 1152 条）
3. **Phase 3**: 为三场域生成差异化的 judgment（如需要）

## 语言风格守则

参考 `memory/semantic-constitution.md` 中的六大原则：
- 直接、具体、可验证
- 避免玄学黑话和心灵鸡汤
- 用当代人的决策语境重新表达易经智慧
