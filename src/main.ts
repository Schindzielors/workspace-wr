import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

type ThemeMode = 'light' | 'dark' | 'system';

const configuredTheme = window.__APP_CONFIG__?.theme;
const theme: ThemeMode = configuredTheme === 'dark' || configuredTheme === 'system'
  ? configuredTheme
  : 'light';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(): void {
  const resolved = theme === 'system' ? (systemDark.matches ? 'dark' : 'light') : theme;
  document.documentElement.dataset['theme'] = resolved;
}

applyTheme();
if (theme === 'system') {
  systemDark.addEventListener('change', applyTheme);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
