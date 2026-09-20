/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MANIFEST_URL?: string;
  readonly VITE_TWA_RETURN_URL?: string;
  readonly VITE_FACTORY_ADDRESS?: string;
  readonly VITE_TONAPI_BASE?: string;
  readonly VITE_TONAPI_KEY?: string;
  readonly VITE_NETWORK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type AuthUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

interface Window {
  Telegram?: {
    WebApp?: {
      initData: string;
      initDataUnsafe: { user?: AuthUser };
      ready: () => void;
      expand: () => void;
      setHeaderColor?: (color: string) => void;
      setBackgroundColor?: (color: string) => void;
      openLink?: (url: string) => void;
    };
  };
}
