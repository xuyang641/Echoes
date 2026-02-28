# <div align="center"><img src="public/PWA/icon.svg" width="100" height="100" alt="Echoes Logo"></div>

# <div align="center">Echoes</div>

<div align="center">
  <strong>记录你的日常点滴 · Capture Your Daily Moments</strong>
</div>

<div align="center">
  <br />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen.svg" alt="Platform">
  <img src="https://img.shields.io/badge/status-Active%20Development-orange.svg" alt="Status">
</div>

<br />

> **Echoes** 是一款注重隐私、界面精美的照片日记应用。它帮助你轻松捕捉生活中的美好瞬间，并通过原生移动体验让回忆触手可及。
>
> **Echoes** is a beautiful, privacy-first photo diary application that helps you preserve your precious memories with ease. Built with modern web technologies and wrapped as a native mobile experience.

<br />

<div align="center">
  <img src="public/screenshots/screenshot1.png" width="200" alt="Home Screen" style="border-radius: 10px; margin: 10px;">
  <img src="public/screenshots/screenshot2.png" width="200" alt="Calendar View" style="border-radius: 10px; margin: 10px;">
  <img src="public/screenshots/screenshot3.png" width="200" alt="Map View" style="border-radius: 10px; margin: 10px;">
  <img src="public/screenshots/screenshot4.png" width="200" alt="Insights" style="border-radius: 10px; margin: 10px;">
</div>

<br />

## ✨ 功能特性 (Features)

- **📸 原生相机集成 (Native Camera)**：
  - 直接调用系统相机拍照，或从相册选择，体验如原生 App 般流畅。
  - Seamlessly capture photos using your device's native camera or pick from the gallery.

- **☁️ 实时云同步 (Real-time Cloud Sync)**：
  - 基于 Supabase，数据在所有设备间实时同步，再也不怕丢日记。
  - Your memories are safely stored and instantly synchronized across all your devices.

- **📅 可视化时间轴与日历 (Visual Timeline & Calendar)**：
  - 通过精美的时间轴或直观的日历视图，回顾你的人生旅程。
  - Browse your life's journey through a beautiful timeline view or an organized calendar grid.

- **🔒 隐私优先 (Privacy First)**：
  - 你的数据完全属于你。支持安全认证，未来将支持生物识别锁。
  - Your data is yours. Secure authentication and optional biometric lock support.

- **🌙 深色模式 (Dark Mode)**：
  - 精心设计的深色主题，深夜写日记也能护眼。
  - A stunning dark theme for comfortable night-time journaling.

## 🛠 技术栈 (Tech Stack)

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Mobile Runtime**: Capacitor 5 (Android & iOS)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **State Management**: React Context API

## 🚀 快速开始 (Getting Started)

### 环境要求 (Prerequisites)

- Node.js (v18+)
- Android Studio (用于构建 Android 版本)
- Xcode (用于构建 iOS 版本，仅限 macOS)

### 安装步骤 (Installation)

1. **克隆仓库 (Clone the repository)**
   ```bash
   git clone https://github.com/yourusername/echoes.git
   cd echoes
   ```

2. **安装依赖 (Install dependencies)**
   ```bash
   npm install
   ```

3. **配置环境变量 (Environment Setup)**
   在根目录创建 `.env` 文件并填入你的 Supabase 配置：
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **启动网页开发服务器 (Run Web Development Server)**
   ```bash
   npm run dev
   ```

5. **运行 Android 模拟器/真机 (Run on Android)**
   ```bash
   npx cap sync
   npx cap run android
   ```

## 📱 移动端构建 (Mobile Build)

生成签名版的 APK 文件：

```bash
cd android
./gradlew assembleRelease
```
生成的 APK 文件位于：`android/app/build/outputs/apk/release/app-release.apk`。

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！详见 [Contributing Guide](CONTRIBUTING.md)。

## 📄 许可证 (License)

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---
*Crafted with ❤️ by Echoes Team*
