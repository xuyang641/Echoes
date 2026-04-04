# 网站性能改进与优化方案

基于目前项目的构建分析（Vite 打包日志），以下是针对提高网站运行速度和加载速度的高价值优化策略，计划于后续（明天）逐步实施。

## 1. 核心问题：代码分割与巨型 JS 文件拆分 (Code Splitting)
当前问题：`vendor-tf.js` (1.87MB), `index.js` (1.45MB), `vendor-ui.js` (805KB) 体积过大，阻塞首屏渲染。

**执行计划：**
- [ ] **路由级懒加载 (Route-based Lazy Loading)**：
  - 使用 `React.lazy()` 和 `<Suspense>` 重构 `App.tsx` 中的路由。
  - 将非首屏核心页面（如 `print-shop-view`, `account-view`, `timeline-view` 等）进行按需加载。
- [ ] **组件级动态导入 (Dynamic Import)**：
  - 将 TensorFlow (`@tensorflow-models/mobilenet`, `@tensorflow/tfjs`) 改为仅在用户点击“AI 识别”时动态加载：`const mobilenet = await import('@tensorflow-models/mobilenet')`。
  - 将 `html2canvas`、`jspdf` (用于生成海报/PDF) 改为动态加载。
  - 将地图组件 (`react-leaflet` / 高德地图) 在地图视图挂载时才加载。

## 2. 图片与媒体优化 (Image Optimization)
作为一个照片日记应用，图片是性能消耗的大头。

**执行计划：**
- [ ] **完善懒加载**：确保现有的 `LazyImage` 组件使用了 `IntersectionObserver`，实现真正的滚动可视区域加载。
- [ ] **缩略图策略 (Thumbnails)**：
  - 改造图片保存逻辑：在保存原图的同时，生成一张低分辨率（如宽 400px）的缩略图。
  - 在瀑布流（Timeline）等列表页仅加载缩略图，点击进入详情或预览时再加载原图。
- [ ] **格式检查**：确认图片在压缩时已全部稳定转换为 `webp` 格式。

## 3. 渲染性能优化 (Rendering Performance)
防止日记数量增多后导致的页面卡顿。

**执行计划：**
- [ ] **引入虚拟列表 (Virtualization)**：
  - 在日记列表页（Timeline）和回忆画廊中引入 `react-virtuoso` 或 `react-window`。
  - 只渲染当前屏幕可见的 DOM 节点，大幅减少浏览器内存占用和渲染压力。
- [ ] **组件级渲染优化**：
  - 审查 `milestones-view`、日记卡片等复杂组件。
  - 合理补充 `React.memo`、`useMemo` 和 `useCallback`，避免父组件状态变更引起不必要的子组件全量重绘。

## 4. 依赖瘦身 (Tree Shaking)
**执行计划：**
- [ ] **按需引入检查**：
  - 检查 `@mui/material` 和 `lucide-react` 的引入方式，确保未将整个库打包。
  - 检查 `date-fns`，确保没有引入无用的语言包/时区包。
- [ ] **包体积分析**：使用 `rollup-plugin-visualizer` 生成可视化的包体积依赖图，精准剔除无用依赖。

## 5. 缓存与离线策略 (PWA & Caching)
**执行计划：**
- [ ] **强化 PWA 缓存**：优化 `vite-plugin-pwa` 的 Workbox 配置，将核心静态资源（字体、关键 CSS/JS）进行强缓存。
- [ ] **数据请求优化**：考虑为 API 请求引入 SWR (Stale-While-Revalidate) 模式，优先展示本地缓存数据，后台静默更新，消除网络等待感。

---
*注：本方案将根据实际业务优先级和实施成本，由高到低逐步推进。建议首选 **路由级懒加载** 和 **TensorFlow 动态加载**，能立即获得肉眼可见的性能提升。*