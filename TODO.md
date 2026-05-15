# OpenSee 3.0 — TODO

## 已完成

- [x] 3.0 结构重建：engine/semantic/UI 三层分离
- [x] engine — Seed+Salt 混合取卦 + XORshift32 PRNG
- [x] engine/line_engine — 动爻检测（6/9=动爻）
- [x] core/seed — SHA-256 种子生成
- [x] decision — 轻量结果汇总
- [x] s2 — 场域定义（relation/career/wealth/decision）
- [x] 64 卦全部 semantic 内容：judgment（五字段） + lines（白话短句）
- [x] 首页 — hero背景 + Aura呼吸圆 + 涟漪 + Mouse trail + seed生成
- [x] 结果页 — 垂直轮播 7 张 Card + Particle Canvas
- [x] 前端全部从 frontend/ 迁出到根级（index.html / content.html）
- [x] server.js — 3.0 分层静态路由
- [x] 清理冗余：semantic/lines/ semantic/judgment/ frontend/旧文件

## 建议下一步

1. **s2 场域集成** — s2.js 已定义但未在管道中使用，可让用户选择场域（关系/事业/资源/决策）
2. **transitions 系统** — 卦变关系（forward/contrast/reverse）
3. **部署到服务器** — SSH root@43.128.101.103，PM2 重启
4. **响应式优化** — 移动端进一步测试
5. **动爻显示优化** — Card 5 波动卡片在无动爻时显示更友好的占位内容
