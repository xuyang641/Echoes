# 网站性能改进与优化方案 (明日计划)

基于目前项目的构建分析（Vite 打包日志）和加载速度评估，以下是针对提高网站运行速度和加载速度的高价值优化策略，计划于明日逐步实施。

## 1. 🖼️ 图片加载与压缩（最高优先级）
作为一个照片日记应用，图片是性能消耗的大头，最容易阻塞瀑布流的首屏渲染。

**执行计划：**
- [ ] **前端上传前强制压缩**：在 `diary-entry-form.tsx` 用户选完图后，立刻调用 `browser-image-compression` 把图片压到 1MB 以内再传给 Supabase。
- [ ] **双轨制（原图+缩略图）**：改造图片保存逻辑，在保存原图的同时，生成一张低分辨率（如宽 400px）的缩略图存到 `thumbnail_url` 字段。
- [ ] **按需加载高清图**：在瀑布流（Timeline）等列表页仅加载几十 KB 的缩略图，点击放大（ImagePreviewModal）时再加载原图。

## 2. 📜 列表渲染虚拟化 (Virtual List)
防止日记数量增多（如达到 500+ 篇）后导致的 DOM 节点爆炸和页面滑动卡顿。

**执行计划：**
- [ ] **重构时光轴**：在 `timeline-view.tsx` 和回忆画廊中引入 `react-virtuoso` 替换原有的 `.map()` 渲染。
- [ ] **按需渲染**：确保无论有多少篇日记，浏览器在任何时刻都只渲染当前屏幕可见的十几篇日记的 DOM。

## 3. 🧩 更彻底的路由级代码分割 (Code Splitting)
当前问题：虽然绝大多数页面已使用 `React.lazy()`，但包含极重富文本编辑器（`@tiptap`）的 `DiaryEntryForm` 仍然是同步引入的，导致首屏加载缓慢。

**执行计划：**
- [ ] **路由级懒加载**：在 `app-routes.tsx` 中，将 `/add` 和 `/edit/:id` 路由对应的组件（包括 `DiaryEntryForm`）改为 `React.lazy()` 动态加载。

## 4. 🤖 AI 模型的按需加载 (Dynamic Import)
当前问题：`@tensorflow-models/mobilenet` 和 `@tensorflow/tfjs` 两个包打包后体积在 1.5MB 以上，拖慢全局加载速度。

**执行计划：**
- [ ] **移除同步引用**：排查并移除全局所有对 TensorFlow 的同步 `import * as tf from ...`。
- [ ] **点击时加载**：将 TensorFlow 改为仅在用户点击发日记页面的“AI 识别”按钮时，在函数内执行 `const tf = await import('@tensorflow/tfjs')` 动态拉取。

---
*注：建议明天开发时，按照上述 1 到 4 的优先级顺序推进，图片压缩和虚拟列表的体验提升最为明显。*