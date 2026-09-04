export interface AppConfig {
  apiUrl: string;
}

declare global {
  interface Window {
    __APP_CONFIG__: AppConfig;
  }
}

export const appConfig: AppConfig = window.__APP_CONFIG__;