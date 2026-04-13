/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_AI_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_AI_API_KEY: string
  readonly VITE_AI_BASE_URL: string
  readonly VITE_AI_MODEL: string
  readonly VITE_QWEN_API_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __TAURI__?: boolean;
  __TAURI_INTERNALS__?: boolean;
  reminderTimeout?: any;
}
