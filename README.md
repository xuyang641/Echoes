# Echoes 📸

> **Capture Your Life Moments, Intelligently.**  
> A private, beautiful, and intelligent space to document your life's journey, now available on Web, Android, and iOS.

![Banner](https://github.com/xuyanghou640-maker/Photo-Diary/raw/main/public/banner.svg)

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Mobile-blue?logo=capacitor)](https://capacitorjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

## ✨ About

**Echoes** is more than just a journal. It's a companion that helps you pause, capture, and cherish the fleeting moments of your life. Whether it's a perfect cup of coffee, a beautiful sunset, or a laugh shared with a friend, Echoes keeps these memories safe and vivid.

With powerful **AI Insights**, **Smart Tagging**, and a beautiful **Timeline**, your memories are not just stored—they are celebrated.

## 🚀 Key Features

- **📝 Rich Entries**: Record photos, moods, locations, and detailed stories.
- **📊 AI Insights**: Visualize your year in pixels, track mood trends, and discover "On This Day" memories.
- **👁️ Smart Vision**: Automatically recognize photo contents using on-device AI (TensorFlow.js).
- **🗺️ Interactive Map**: See your memories plotted on a global map with heatmaps and route playback.
- **💑 Couple Space**: Sync timelines with your partner in a shared, private space.
- **🏆 Life Milestones**: Gamify your life with achievements for fitness, reading, and photography.
- **🖨️ Print Shop**: Turn your digital memories into physical photo books and Polaroids.
- **📱 Cross-Platform**: Seamless experience on Web, Android, and iOS.
- **🔒 Private & Secure**: Your data is yours. Local-first architecture with optional cloud sync.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Mobile**: Ionic Capacitor (Android & iOS)
- **UI Components**: Shadcn/ui, Lucide Icons, Framer Motion
- **AI/ML**: TensorFlow.js (MobileNet), Google Vision AI
- **Charts**: Recharts
- **Maps**: Leaflet / React-Leaflet
- **Backend**: Supabase (Edge Functions, Storage, Database)
- **Internationalization**: i18next (English, Chinese, Japanese, Korean)

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v18+)
- Android Studio (for Android build)
- Xcode (for iOS build, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xuyanghou640-maker/Photo-Diary.git
   cd Photo-Diary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Mobile Development

To run on Android:
```bash
npm run android
```

To run on iOS (macOS only):
```bash
npm run ios
```

To sync web changes to native projects:
```bash
npm run sync
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Make your changes and commit them: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Submit a pull request.

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Contact

For support or inquiries, please contact us at [2311752562@qq.com](mailto:2311752562@qq.com).

---
*Made with ❤️ for life lovers.*
