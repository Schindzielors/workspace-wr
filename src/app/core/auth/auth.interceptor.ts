import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { appConfig } from '../config/app-config';
import { AuthService } from './auth.service';

/**
 * Põe `Authorization: Bearer <token>` nas chamadas à API do Workspace.
 *
 * Se a API responder 401 (token expirado), renova pelo Refresh e repete a
 * chamada uma vez. Se a renovação também falhar, a sessão acabou: volta
 * para o login.
 *
 * Chamadas para outros domínios (ex.: sistemas nos iframes) e para
 * `/api/Auth` não recebem o token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!req.url.startsWith(appConfig.apiUrl) || auth.ehUrlAuth(req.url)) {
    return next(req);
  }

  const comToken = (token: string | null): HttpRequest<unknown> =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(comToken(auth.accessToken())).pipe(
    catchError(erro => {
      if (!(erro instanceof HttpErrorResponse) || erro.status !== 401) {
        return throwError(() => erro);
      }

      return auth.renovar().pipe(
        catchError(erroRenovacao => {
          auth.encerrarLocalmente();
          return throwError(() => erroRenovacao);
        }),
        switchMap(token => next(comToken(token)))
      );
    })
  );
};
