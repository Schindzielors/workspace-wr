import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { appConfig } from '../config/app-config';
import { AuthErroDto, AuthNovaSenhaRequestDto, ResetarSenhaRequestDto, ResetarSenhaRespostaDto, TokenRespostaDto } from './auth.dto';

export type AuthEstado = 'anonimo' | 'autenticado';

/** Resultado do login para a tela decidir a próxima etapa. */
export type AuthLoginResultado =
  | { tipo: 'autenticado' }
  | { tipo: 'senha-temporaria'; tokenTemporario: string };

/** Token da sessão (fora do prefixo `workspace.v1.` das abas). */
const CHAVE_TOKEN = 'workspace.auth.token';

/** Chave usada para avisar outras abas do navegador sobre o logout. */
const CANAL_LOGOUT = 'workspace.logout';

/**
 * Sessão do usuário, no mesmo modelo dos outros sistemas da Datapar:
 *
 * - Login pelo `POST /api/Token` (TokenController), que devolve o JWT.
 * - O token fica no `sessionStorage`: o F5 não desloga, cada aba do
 *   navegador tem a sua sessão e fechar a aba encerra a sessão.
 * - Vai em `Authorization: Bearer` (interceptor). Sem cookie, então o CORS
 *   "CorsWithoutCredentials" da API já atende.
 * - Quando o token vence (`exp` do JWT) ou a API responde 401, a sessão
 *   acaba e o usuário volta para o login.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly urlToken = `${appConfig.apiUrl}/api/Token`;
  private readonly urlAuth = `${appConfig.apiUrl}/api/Auth`;
  private readonly urlResetarSenha = `${appConfig.apiUrl}/Utilitarios/ResetarSenha`;

  private readonly _accessToken = signal<string | null>(null);
  private timerExpiracao: ReturnType<typeof setTimeout> | null = null;

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

  /** URLs de login/senha (o interceptor não mexe nelas). */
  ehUrlAuth(url: string): boolean {
    return url.startsWith(this.urlToken) || url.startsWith(this.urlAuth) || url.startsWith(this.urlResetarSenha);
  }

  /** Antes do app iniciar: recupera o token salvo, se ainda for válido. */
  restaurar(): Promise<void> {
    const token = lerToken();

    if (token && segundosRestantes(token) > 0) {
      this.iniciarSessao(token);
    } else {
      removerToken();
    }

    return Promise.resolve();
  }

  /** POST /api/Token (form UserName/Password). Erros chegam como `Error` com a mensagem para a tela. */
  entrar(login: string, senha: string): Observable<AuthLoginResultado> {
    const body = new HttpParams().set('UserName', login.trim()).set('Password', senha);

    return this.http.post<TokenRespostaDto>(this.urlToken, body).pipe(
      map(resposta => {
        if (!resposta?.access_token) {
          throw new Error('Resposta da API sem access_token.');
        }

        if (resposta.passwordReset) {
          // Ainda não entra: o token só é usado para definir a nova senha.
          return { tipo: 'senha-temporaria' as const, tokenTemporario: resposta.access_token };
        }

        this.iniciarSessao(resposta.access_token);
        return { tipo: 'autenticado' as const };
      }),
      catchError(erro => throwError(() => new Error(this.mensagemDe(erro, 'Login ou senha inválidos.'))))
    );
  }

  /** POST /api/Auth/NovaSenha com o token da senha temporária; depois entra. */
  definirNovaSenha(tokenTemporario: string, senhaTemporaria: string, novaSenha: string): Observable<void> {
    const body: AuthNovaSenhaRequestDto = { senhaAtual: senhaTemporaria, novaSenha };
    const headers = new HttpHeaders({ Authorization: `Bearer ${tokenTemporario}` });

    return this.http.post<void>(`${this.urlAuth}/NovaSenha`, body, { headers }).pipe(
      map(() => this.iniciarSessao(tokenTemporario)),
      catchError(erro =>
        throwError(() => new Error(this.mensagemDe(erro, 'Não foi possível salvar a nova senha. Tente novamente.')))
      )
    );
  }

  /**
   * "Esqueci minha senha": POST /Utilitarios/ResetarSenha (ResetarSenhaController),
   * que gera a senha temporária e envia por e-mail.
   */
  solicitarRedefinicao(login: string): Observable<void> {
    const body: ResetarSenhaRequestDto = { userName: login.trim() };

    return this.http.post<ResetarSenhaRespostaDto>(this.urlResetarSenha, body).pipe(
      map(() => undefined),
      catchError(erro =>
        throwError(() => new Error(this.mensagemDe(erro, 'Não foi possível enviar a solicitação. Tente novamente.')))
      )
    );
  }

  /**
   * Sair: apaga o token, avisa as outras abas e recarrega no login, o que
   * limpa toda a memória do app (abas, menus, favoritos, perfil).
   */
  sair(): void {
    try {
      localStorage.setItem(CANAL_LOGOUT, Date.now().toString());
      localStorage.removeItem(CANAL_LOGOUT);
    } catch {
      // Sem storage: as outras abas saem quando o token vencer.
    }

    this.encerrarLocalmente();
  }

  /** Sessão encerrada (logout, token vencido, 401): volta ao login. */
  encerrarLocalmente(): void {
    this.limpar();

    try {
      sessionStorage.clear();
    } catch {
      // Nada a limpar.
    }

    window.location.hash = '#/login';
    window.location.reload();
  }

  // ---------------------------------------------------------------------

  private iniciarSessao(token: string): void {
    this._accessToken.set(token);
    salvarToken(token);

    if (this.timerExpiracao) {
      clearTimeout(this.timerExpiracao);
    }

    // setTimeout aceita no máximo ~24,8 dias; acima disso, o 401 encerra.
    const ms = segundosRestantes(token) * 1000;

    if (ms > 0 && ms < 2_147_000_000) {
      this.timerExpiracao = setTimeout(() => this.encerrarLocalmente(), ms);
    }
  }

  private limpar(): void {
    this._accessToken.set(null);
    removerToken();

    if (this.timerExpiracao) {
      clearTimeout(this.timerExpiracao);
      this.timerExpiracao = null;
    }
  }

  private mensagemDe(erro: unknown, padrao: string): string {
    if (!(erro instanceof HttpErrorResponse)) {
      return padrao;
    }

    if (erro.status === 0) {
      return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
    }

    const corpo = erro.error as AuthErroDto | string | null;

    // TokenController responde texto simples (ex.: "Usuário inválido!").
    if (typeof corpo === 'string' && corpo.length < 200 && !corpo.trimStart().startsWith('<')) {
      return erro.status === 401 ? padrao : corpo;
    }

    if (corpo && typeof corpo === 'object' && (corpo.mensagem || corpo.message)) {
      return (corpo.mensagem || corpo.message)!;
    }

    return padrao;
  }
}

// -----------------------------------------------------------------------
// Armazenamento e leitura do JWT
// -----------------------------------------------------------------------

function lerToken(): string | null {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

function salvarToken(token: string): void {
  try {
    sessionStorage.setItem(CHAVE_TOKEN, token);
  } catch {
    // Sem storage: a sessão vale até o F5.
  }
}

function removerToken(): void {
  try {
    sessionStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // Nada a remover.
  }
}

/** Segundos até o `exp` do JWT (0 se vencido ou ilegível). */
function segundosRestantes(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))) as { exp?: number };
    return exp ? Math.max(0, Math.floor(exp - Date.now() / 1000)) : 0;
  } catch {
    return 0;
  }
}
