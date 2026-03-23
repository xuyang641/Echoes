# Migration Specification: International to Domestic China Infrastructure

## 1. Overview
The goal is to migrate the entire application stack from international services (Supabase US/EU, Google AI, Mapbox) to domestic China alternatives to improve accessibility, stability, and user experience for users in Mainland China.

## 2. Architecture Changes

### 2.1 Backend & Database
- **Current**: Supabase (PostgreSQL + Auth + Storage + Edge Functions) hosted internationally.
- **Target**: **MemFire Cloud** (Domestic Supabase alternative).
  - **Database**: PostgreSQL (Directly compatible).
  - **Auth**: MemFire Auth (Supports WeChat/Phone login, fully compatible with Supabase Client).
  - **Storage**: MemFire Storage (S3 compatible, uses OSS/MinIO backend).
  - **Realtime**: MemFire Realtime (Compatible).

### 2.2 AI Services
- **Current**: Google Gemini (`@google/generative-ai`) and OpenAI.
- **Target**: **DeepSeek (via SiliconFlow or Volcengine)** or **Aliyun Bailian (Tongyi Qianwen)**.
  - **Reason**: DeepSeek V3/R1 is state-of-the-art and cost-effective. Aliyun is stable.
  - **Implementation**: Refactor `ai-service.ts` to use an OpenAI-compatible client pointing to domestic endpoints.

### 2.3 Maps
- **Current**: Mapbox (with Amap fallback).
- **Target**: **Amap (Gaode Map) Only**.
  - **Action**: Remove `mapbox-gl` dependencies. Ensure `amap-location-picker.tsx` and `map-view.tsx` strictly use `@amap/amap-jsapi-loader`.

### 2.4 Deployment
- **Current**: Likely Vercel/Netlify (default for modern web apps).
- **Target**: **Static Hosting (Domestic)**.
  - **Options**: 
    - Aliyun OSS + CDN.
    - Tencent Cloud COS + CDN.
    - A simple Node.js/Nginx server on an ECS instance.
  - **Action**: Add a `nginx.conf` or build script optimized for static serving.

## 3. Detailed Migration Steps

### 3.1 Cleanup Dependencies
- Remove: `@google/generative-ai`, `mapbox-gl`, `react-map-gl`.
- Add/Update: `openai` (keep for compatible APIs), `@amap/amap-jsapi-loader`.

### 3.2 Code Refactoring
1.  **`src/app/utils/ai-service.ts`**:
    - Remove Google Gemini specific code.
    - Configure OpenAI client to use `https://api.deepseek.com` (or user's preferred domestic API).
    - Update prompt handling if necessary for the new model.
2.  **`src/app/components/map-view.tsx`**:
    - Remove Mapbox logic.
    - Ensure full functionality using Amap (markers, paths, heatmaps).
3.  **`src/app/utils/supabaseClient.ts`**:
    - Ensure it reads from environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`.
    - Verify `memfire-cloud` compatibility (usually drop-in replacement).

### 3.3 Configuration
- Create `.env.example.zh` with domestic service configuration templates.
- Update `vite.config.ts` if proxying is needed for local dev against domestic APIs.

## 4. User Impact
- **Login**: Users may need to migrate accounts or re-register if the Auth ID mapping changes (MemFire has migration tools, but for this task we assume a fresh start or manual data migration is handled separately).
- **Data**: Existing data in Supabase needs to be exported/imported to MemFire (Out of scope for code changes, but critical for ops).
