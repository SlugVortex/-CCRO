/// <reference types="vite/client" />

export {}

interface ImportMetaEnv {
  readonly VITE_AZURE_MAPS_KEY?: string
  readonly VITE_AZURE_MAPS_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    atlas?: any
  }
}
