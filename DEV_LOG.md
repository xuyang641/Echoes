# Development Log

## 2026-04-13 - Comprehensive Automated Testing Suite

### 🚀 Features & Engineering
- **Automated Testing Setup**: Configured and implemented a robust automated testing environment using `vitest` and `@testing-library/react`.
- **Core Logic Tests (Unit Tests)**:
  - `coord-transform.test.ts`: Added rigorous mathematical assertions for WGS-84 to GCJ-02 (Mars Geodetic System) coordinate transformations, ensuring map footprints remain accurate across regions.
  - `mood-constants.test.ts`: Verified the integrity of the mood system (Happy, Sad, etc.) and fallback color extraction logic.
  - `image-utils.test.ts`: Implemented mock-based testing for heavy image compression logic (`browser-image-compression`), verifying WebWorker configuration and WebP format enforcement for both main images and thumbnails.
- **Offline Storage Tests (Integration Tests)**:
  - `offline-storage.test.ts`: Deeply tested the core IndexedDB offline persistence layer. Verified single/batch entry saving, user-specific data fetching, and the critical "Pending Actions" queue that ensures zero data loss during network transitions.
- **UI Component Tests**:
  - `badge.test.tsx` & `button.test.tsx`: Simulated user interactions and verified correct Tailwind CSS variant applications across different component states (e.g., destructive, secondary, disabled).

### 🐛 Bug Fixes & Refactoring
- **Coordinate Precision**: Fixed precision assertion errors in the GCJ-02 to WGS-84 reverse transformation tests due to algorithmic approximation.
- **Linter Warnings**: Cleaned up unused `React` imports in test files (e.g., `badge.test.tsx`) to comply with modern React 17+ JSX transform standards.

## 2026-04-12 - Windows Desktop Background & Notification Integration

### 🚀 Features
- **Tauri Native Notifications**: Replaced Web Notification APIs with `@tauri-apps/plugin-notification` to ensure stable desktop notifications in Windows Action Center.
- **Background Push Notifications**: 
  - Integrated Supabase Realtime subscriptions with Tauri's notification system.
  - New Friend Requests and Group Invitations now trigger native desktop popups when the app is hidden in the system tray.
- **System Tray Enhancements**: 
  - The app now correctly minimizes to the system tray on close instead of exiting.
  - Added a "Echoes" tooltip to the system tray icon on Windows.
- **Daily Reminder Customization**:
  - Users can now customize the text of their daily reminder notifications (Default text changed to Chinese).
  - Added a dedicated toggle for Autostart (Launch on boot) in the settings panel to ensure background notifications work seamlessly.

### 🐛 Bug Fixes
- **Notification Permissions**: Fixed an issue where Tauri environments incorrectly parsed 'default' or 'prompt' permission states, preventing users from turning on daily reminders.

## 2026-01-20 - Color DNA Feature Overhaul

### 🚀 Features
- **Nebula Gravity Field UI**: Completely redesigned the Color DNA visualization from a list view to an interactive solar system model.
  - **Three-Body Orbit System**: Implemented a 3-layer orbital system (Inner, Middle, Outer) to categorize color memories based on frequency/recency.
  - **Procedural Starfield**: Added a dynamic, generated star background with twinkling stars and occasional shooting stars for deep space immersion.
  - **3D Glass Planets**: Upgraded planet rendering from flat circles to 3D glass-like spheres using radial gradients and internal shadowing.

### 🛠 Technical Implementation
- **Trigonometric Positioning**: Replaced CSS `transform` chains with absolute positioning calculated via `Math.cos` and `Math.sin` to ensure perfect circular orbits and eliminate shape distortion (the "pill shape" bug).
- **Orbit Collision Avoidance**: Implemented a distributed angle algorithm to ensure planets on the same orbit never overlap.
- **Robust Data Handling**:
  - Replaced unreliable network images with reliable local SVG generation to prevent rendering crashes.
  - Fixed React state rendering flicker by optimizing the `useEffect` and `useMemo` dependency chains in `InsightsView`.

### 🐛 Bug Fixes
- **Planet Distortion**: Fixed an issue where combining rotation and translation transforms caused planets to stretch into ovals.
- **Data Persistence**: Solved the issue where injected test data would disappear upon re-render or network refresh.
- **Image Loading**: Handled CORS and loading errors for external images by providing graceful fallbacks.

### 🎨 UX Improvements
- **Interactive Hover**: Hovering over planets pauses their orbit and magnifies them for easy selection.
- **Dynamic Lighting**: The core nucleus and background ambient light react to the currently selected color.
- **Immersive Animation**: Added "floating" animations to planets to simulate zero-gravity movement.