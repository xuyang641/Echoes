# Echoes - Capture Your Daily Moments 📸

> A beautiful, privacy-first photo diary application that helps you preserve your precious memories with ease. Built with modern web technologies and wrapped as a native mobile experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen.svg)
![Status](https://img.shields.io/badge/status-Active%20Development-orange.svg)

## ✨ Features

- **📸 Native Camera Integration**: Seamlessly capture photos using your device's native camera or pick from the gallery.
- **☁️ Real-time Cloud Sync**: Your memories are safely stored and instantly synchronized across all your devices via Supabase.
- **📅 Visual Timeline & Calendar**: Browse your life's journey through a beautiful timeline view or an organized calendar grid.
- **🎨 AI-Powered Insights**: (Coming Soon) Smart analysis of your mood and activities to provide meaningful personal insights.
- **🔒 Privacy First**: Your data is yours. Secure authentication and optional biometric lock support.
- **🌙 Dark Mode**: A stunning dark theme for comfortable night-time journaling.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Mobile Runtime**: Capacitor 5 (Android & iOS)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **State Management**: React Context API

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Android Studio (for Android build)
- Xcode (for iOS build, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/echoes.git
   cd echoes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Web Development Server**
   ```bash
   npm run dev
   ```

5. **Run on Android Device/Emulator**
   ```bash
   npx cap sync
   npx cap run android
   ```

## 📱 Mobile Build

To generate a signed APK for release:

```bash
cd android
./gradlew assembleRelease
```
The APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Crafted with ❤️ by Echoes Team*
