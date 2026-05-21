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
- [x] s2 场域集成 — 首页场域选择器 + URL传递 + 结果页标签
- [x] transitions 系统 — 错卦/综卦/互卦，结果页底部三个卦变卡片
- [x] Phase 1: decision 场域数据升级 v3.0（yaoCode + scene + transitions）
- [x] Phase 2: relation/career/wealth 三场域场景化爻辞生成（192 文件）

## 建议下一步

1. **场域切换前端体验** — 用户切换场域后动态更新爻辞 scene 展示
2. **数据质量抽查** — 人工审查 10-20 卦的场域差异化质量
3. **响应式优化** — 移动端进一步测试
