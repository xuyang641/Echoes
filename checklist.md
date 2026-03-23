# Migration Verification Checklist

## AI Service
- [ ] `ai-service.ts` no longer imports `@google/generative-ai`.
- [ ] AI chat/generation functions correctly call the domestic API endpoint (e.g., DeepSeek).
- [ ] API keys are loaded from environment variables.

## Maps
- [ ] Map view loads Amap (Gaode) tiles correctly.
- [ ] Location picking works with Amap.
- [ ] No 404/Connection errors to `mapbox.com`.

## Backend
- [ ] App connects to MemFire Cloud (via Supabase client) without errors.
- [ ] Authentication (Login/Register) works with the new backend.
- [ ] Database reads/writes (Diary Entries) are successful.

## Build
- [ ] `npm run build` completes without errors.
- [ ] Dist folder contains valid static assets.
