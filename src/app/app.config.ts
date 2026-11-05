import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash (#/login): funciona em qualquer servidor estático, sem configurar
    // fallback para index.html.
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Antes da primeira tela: recupera o token salvo na aba (F5 não desloga).
    provideAppInitializer(() => inject(AuthService).restaurar())
  ]
};
