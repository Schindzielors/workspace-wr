import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Workspace: só com sessão. Sem sessão, vai para o login. */
export const autenticadoGuard: CanMatchFn = () =>
  inject(AuthService).estado() === 'autenticado' || inject(Router).createUrlTree(['/login']);

/**
 * Login: só sem sessão. Com sessão (ex.: F5 depois de entrar), vai direto
 * para o Workspace.
 */
export const anonimoGuard: CanMatchFn = () =>
  inject(AuthService).estado() === 'anonimo' || inject(Router).createUrlTree(['/']);
