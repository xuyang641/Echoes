# Migration Tasks

- [ ] **Dependency Cleanup** <!-- id: 0 -->
    - Remove `@google/generative-ai` and `mapbox-gl` related packages.
    - Ensure `openai` and `@amap/amap-jsapi-loader` are installed.
- [ ] **AI Service Migration** <!-- id: 1 -->
    - Refactor `src/app/utils/ai-service.ts` to remove Google Gemini code.
    - Implement a generic OpenAI-compatible client configured for DeepSeek/Aliyun.
    - Update environment variable usage for the new API base URL and key.
- [ ] **Map Component Refactor** <!-- id: 2 -->
    - Refactor `src/app/components/map-view.tsx` to remove Mapbox and use Amap exclusively.
    - Verify `src/app/components/amap-location-picker.tsx` integration.
- [ ] **Backend Configuration** <!-- id: 3 -->
    - Verify `src/app/utils/supabaseClient.ts` works with generic Supabase/MemFire config.
    - Create a `.env.example` tailored for domestic services (MemFire, DeepSeek, Amap).
- [ ] **Deployment Prep** <!-- id: 4 -->
    - Create a `nginx.conf` for static serving on domestic servers.
    - Update `package.json` build scripts if necessary.
