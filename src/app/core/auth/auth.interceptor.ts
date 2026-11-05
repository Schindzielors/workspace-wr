import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { appConfig } from '../config/app-config';
import { AuthService } from './auth.service';

/**
 * Põe `Authorization: Bearer <token>` nas chamadas à API do Workspace.
 *
 * Se a API responder 401 (token vencido ou inválido), a sessão acabou:
 * volta para o login.
 *
 * Chamadas para outros domínios (ex.: sistemas nos iframes), para
 * `/api/WorkspaceLogin` não passam por aqui.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!req.url.startsWith(appConfig.apiUrl) || auth.ehUrlAuth(req.url)) {
    return next(req);
  }

  const token = auth.accessToken();
  const comToken = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(comToken).pipe(
    catchError(erro => {
      if (erro instanceof HttpErrorResponse && erro.status === 401 && token) {
        auth.encerrarLocalmente();
      }

      return throwError(() => erro);
    })
  );
};
