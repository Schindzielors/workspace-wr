import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, firstValueFrom, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';

import { appConfig } from '../config/app-config';
import {
  AuthErroDto,
  AuthEsqueciSenhaRequestDto,
  AuthLoginRequestDto,
  AuthNovaSenhaRequestDto,
  AuthSessaoDto
} from './auth.dto';

export type AuthEstado = 'anonimo' | 'autenticado';

/** Resultado do login para a tela decidir a próxima etapa. */
export type AuthLoginResultado =
  | { tipo: 'autenticado' }
  | { tipo: 'senha-temporaria'; tokenTrocaSenha: string };

/** Chave usada para avisar outras abas do navegador sobre o logout. */
const CANAL_LOGOUT = 'workspace.logout';

/**
 * Sessão do usuário.
 *
 * - Access token (Bearer): só em memória. Não vai para localStorage nem
 *   sessionStorage, então um script injetado na página não o encontra
 *   guardado.
 * - Refresh token: cookie HttpOnly gravado pela API (o JavaScript nunca vê).
 *   Ao abrir ou atualizar a página (F5), `restaurar()` chama o Refresh e
 *   recupera um access token novo sem pedir a senha.
 * - O access token é renovado sozinho um pouco antes de expirar, e o
 *   interceptor renova e repete a chamada se a API responder 401.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${appConfig.apiUrl}/api/Auth`;

  private readonly _accessToken = signal<string | null>(null);
  private timerRenovacao: ReturnType<typeof setTimeout> | null = null;
  private renovacaoEmAndamento: Observable<string> | null = null;

  readonly estado = computed<AuthEstado>(() => this._accessToken() ? 'autenticado' : 'anonimo');

  constructor() {
    // Logout em outra aba: esta aba volta para o login também.
    window.addEventListener('storage', evento => {
      if (evento.key === CANAL_LOGOUT && evento.newValue && this._accessToken()) {
        this.encerrarLocalmente();
      }
    });
  }

  /** Token atual (usado pelo interceptor). */
  accessToken(): string | null {
    return this._accessToken();
  }

  /** URLs da API de autenticação (o interceptor não põe Bearer nelas). */
  ehUrlAuth(url: string): boolean {
    return url.startsWith(this.apiUrl);
  }

  /**
   * Chamado antes do app iniciar: tenta recuperar a sessão pelo cookie.
   * Nunca falha; sem sessão, o usuário fica anônimo e vai para o login.
   */
  restaurar(): Promise<void> {
    return firstValueFrom(
      this.renovar().pipe(
        map(() => undefined),
        catchError(() => of(undefined))
      )
    );
  }

  /** POST Login. Erros chegam como `Error` com a mensagem para a tela. */
  entrar(login: string, senha: string): Observable<AuthLoginResultado> {
    const body: AuthLoginRequestDto = { login: login.trim(), senha };

    return this.http.post<AuthSessaoDto>(`${this.apiUrl}/Login`, body, { withCredentials: true }).pipe(
      map(sessao => {
        if (sessao.senhaTemporaria && sessao.tokenTrocaSenha) {
          return { tipo: 'senha-temporaria' as const, tokenTrocaSenha: sessao.tokenTrocaSenha };
        }

        this.iniciarSessao(sessao);
        return { tipo: 'autenticado' as const };
      }),
      catchError(erro => throwError(() => new Error(this.mensagemDe(erro, 'Login ou senha inválidos.'))))
    );
  }

  /** POST NovaSenha: troca a senha temporária e já entra. */
  definirNovaSenha(tokenTrocaSenha: string, novaSenha: string): Observable<void> {
    const body: AuthNovaSenhaRequestDto = { tokenTrocaSenha, novaSenha };

    return this.http.post<AuthSessaoDto>(`${this.apiUrl}/NovaSenha`, body, { withCredentials: true }).pipe(
      map(sessao => this.iniciarSessao(sessao)),
      catchError(erro =>
        throwError(() => new Error(this.mensagemDe(erro, 'Não foi possível salvar a nova senha. Tente novamente.')))
      )
    );
  }

  /** POST EsqueciSenha: a API envia uma senha temporária por e-mail. */
  solicitarRedefinicao(loginOuEmail: string): Observable<void> {
    const body: AuthEsqueciSenhaRequestDto = { loginOuEmail: loginOuEmail.trim() };

    return this.http.post<void>(`${this.apiUrl}/EsqueciSenha`, body).pipe(
      catchError(erro =>
        throwError(() => new Error(this.mensagemDe(erro, 'Não foi possível enviar a solicitação. Tente novamente.')))
      )
    );
  }

  /**
   * POST Refresh (cookie HttpOnly). Chamadas simultâneas compartilham a
   * mesma requisição, então várias respostas 401 ao mesmo tempo geram só
   * uma renovação.
   */
  renovar(): Observable<string> {
    if (!this.renovacaoEmAndamento) {
      this.renovacaoEmAndamento = this.http
        .post<AuthSessaoDto>(`${this.apiUrl}/Refresh`, null, { withCredentials: true })
        .pipe(
          map(sessao => {
            this.iniciarSessao(sessao);
            return sessao.accessToken!;
          }),
          catchError(erro => {
            this.limparToken();
            return throwError(() => erro);
          }),
          finalize(() => (this.renovacaoEmAndamento = null)),
          shareReplay(1)
        );
    }

    return this.renovacaoEmAndamento;
  }

  /**
   * Sair: a API apaga o cookie e invalida o refresh token. Depois a página
   * recarrega no login, o que limpa toda a memória do app (abas, menus,
   * favoritos, perfil) sem precisar zerar serviço por serviço.
   */
  sair(): void {
    this.http
      .post<void>(`${this.apiUrl}/Logout`, null, { withCredentials: true })
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        try {
          localStorage.setItem(CANAL_LOGOUT, Date.now().toString());
          localStorage.removeItem(CANAL_LOGOUT);
        } catch {
          // Sem storage: as outras abas saem quando o token expirar.
        }

        this.encerrarLocalmente();
      });
  }

  /** Sessão perdida (refresh recusado, logout em outra aba): volta ao login. */
  encerrarLocalmente(): void {
    this.limparToken();

    try {
      sessionStorage.clear();
    } catch {
      // Nada a limpar.
    }

    window.location.assign(`${window.location.pathname}#/login`);
    window.location.reload();
  }

  // ---------------------------------------------------------------------

  private iniciarSessao(sessao: AuthSessaoDto): void {
    if (!sessao.accessToken) {
      throw new Error('Resposta da API sem accessToken.');
    }

    this._accessToken.set(sessao.accessToken);
    this.agendarRenovacao(sessao.expiraEm ?? 0);
  }

  /** Renova com 80% da validade (ex.: token de 15 min renova aos 12). */
  private agendarRenovacao(expiraEmSegundos: number): void {
    if (this.timerRenovacao) {
      clearTimeout(this.timerRenovacao);
    }

    if (expiraEmSegundos > 0) {
      this.timerRenovacao = setTimeout(
        () => this.renovar().subscribe({ error: () => this.encerrarLocalmente() }),
        expiraEmSegundos * 800
      );
    }
  }

  private limparToken(): void {
    this._accessToken.set(null);

    if (this.timerRenovacao) {
      clearTimeout(this.timerRenovacao);
      this.timerRenovacao = null;
    }
  }

  private mensagemDe(erro: unknown, padrao: string): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
      }

      const corpo = erro.error as AuthErroDto | null;

      if (corpo && typeof corpo === 'object' && corpo.mensagem) {
        return corpo.mensagem;
      }
    }

    return padrao;
  }
}
