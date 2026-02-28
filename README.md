# <div align="center"><img src="public/PWA/icon.svg" width="128" height="128" alt="Echoes Logo" style="border-radius: 24px;"></div>

# <div align="center">Echoes</div>

<div align="center">
  <strong>记录你的日常点滴 · Capture Your Daily Moments</strong>
</div>

<br />

<div align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen.svg?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/status-Active%20Development-orange.svg?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/language-TypeScript-3178c6.svg?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/framework-React%2018-61dafb.svg?style=flat-square" alt="React">
  <img src="https://img.shields.io/badge/runtime-Capacitor%205-119eff.svg?style=flat-square" alt="Capacitor">
  <img src="https://img.shields.io/badge/backend-Supabase-3ecf8e.svg?style=flat-square" alt="Supabase">
</div>

<br />

> **Echoes** 是一款注重隐私、界面精美的照片日记应用。它帮助你轻松捕捉生活中的美好瞬间，并通过原生移动体验让回忆触手可及。无论是通过地图足迹、时间轴还是日历，都能让你以独特的方式重温过去。
>
> <details>
> <summary><i>English Description (Click to expand)</i></summary>
>
> **Echoes** is a beautiful, privacy-first photo diary application that helps you preserve your precious memories with ease. Built with modern web technologies and wrapped as a native mobile experience. Whether through map footprints, timelines, or calendars, it offers unique ways to relive your past.
> </details>

<br />

## 📸 应用预览 (Preview)

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="public/screenshots/screenshot3.png" width="260" alt="Map View / 足迹地图" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <br />
        <sub><b>足迹地图 (Map View)</b><br/>记录你的每一步足迹</sub>
      </td>
      <td align="center">
        <img src="public/screenshots/screenshot2.png" width="260" alt="Calendar View / 日历视图" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <br />
        <sub><b>日历视图 (Calendar View)</b><br/>每一天都值得铭记</sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="public/screenshots/screenshot1.png" width="260" alt="Home Screen / 时光轴" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <br />
        <sub><b>时光轴 (Timeline)</b><br/>流淌的回忆长河</sub>
      </td>
      <td align="center">
        <img src="public/screenshots/screenshot4.png" width="260" alt="Insights / 洞察分析" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <br />
        <sub><b>洞察分析 (Insights)</b><br/>AI 驱动的情感分析</sub>
      </td>
    </tr>
  </table>
</div>

<br />

## ✨ 功能特性 (Features)

### 📸 原生体验
直接调用系统相机拍照，或从相册选择，体验如原生 App 般流畅。
<details>
<summary><i>Native Experience (English)</i></summary>
Seamlessly capture photos using your device's native camera or pick from the gallery.
</details>

### ☁️ 云端同步
基于 Supabase，数据在所有设备间实时同步，再也不怕丢日记。
<details>
<summary><i>Cloud Sync (English)</i></summary>
Your memories are safely stored and instantly synchronized across all your devices via Supabase.
</details>

### 🗺️ 足迹地图
自动读取照片位置信息，在地图上点亮你的足迹。
<details>
<summary><i>Map Journey (English)</i></summary>
Automatically reads photo location data to light up your footprints on the map.
</details>

### 📅 多维回顾
通过精美的时间轴或直观的日历视图，回顾你的人生旅程。
<details>
<summary><i>Multi-view Review (English)</i></summary>
Browse your life's journey through a beautiful timeline view or an organized calendar grid.
</details>

### 🔒 隐私优先
你的数据完全属于你。支持安全认证，未来将支持生物识别锁。
<details>
<summary><i>Privacy First (English)</i></summary>
Your data is yours. Secure authentication and optional biometric lock support.
</details>

### 🌙 深色模式
精心设计的深色主题，深夜写日记也能护眼。
<details>
<summary><i>Dark Mode (English)</i></summary>
A stunning dark theme for comfortable night-time journaling.
</details>

<br />

## 🛠 技术栈 (Tech Stack)

- **前端 (Frontend)**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **移动端运行时 (Mobile Runtime)**: Capacitor 5 (Android & iOS)
- **后端与数据库 (Backend & Database)**: Supabase (PostgreSQL, Auth, Storage)
- **构建工具 (Build Tool)**: Vite
- **状态管理 (State Management)**: React Context API

<br />

## 🚀 快速开始 (Getting Started)

### 环境要求 (Prerequisites)

- Node.js (v18+)
- Android Studio (用于构建 Android 版本 / for Android build)
- Xcode (用于构建 iOS 版本，仅限 macOS / for iOS build, macOS only)

### 安装步骤 (Installation)

1. **克隆仓库 (Clone the repository)**
   ```bash
   git clone https://github.com/xuyang641/Echoes.git
   cd Echoes
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

<br />

## 📮 联系我们 (Contact Us)

如果你有任何问题、建议或反馈，欢迎随时联系我们！

- **Email**: [2311752562@qq.com](mailto:2311752562@qq.com)
- **GitHub Issues**: [Submit an issue](https://github.com/xuyang641/Echoes/issues)

<br />

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！详见 [Contributing Guide](CONTRIBUTING.md)。

## 📄 许可证 (License)

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---
<div align="center">
  Crafted with ❤️ by Echoes Team
</div>
