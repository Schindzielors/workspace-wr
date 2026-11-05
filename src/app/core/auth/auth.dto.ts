/**
 * Contratos de `/api/Auth` (AuthController). camelCase, padrão da API.
 *
 * O refresh token nunca passa pelo JavaScript: a API grava em cookie
 * HttpOnly no Login/NovaSenha e lê no Refresh/Logout.
 */

/** POST /api/Auth/Login */
export interface AuthLoginRequestDto {
  login: string;
  senha: string;
}

/**
 * Resposta de Login, NovaSenha e Refresh.
 *
 * Senha temporária: `senhaTemporaria = true`, sem `accessToken` e sem
 * cookie. O `tokenTrocaSenha` só serve para o POST NovaSenha.
 */
export interface AuthSessaoDto {
  accessToken: string | null;

  /** Validade do access token, em segundos. */
  expiraEm: number | null;
  senhaTemporaria: boolean;
  tokenTrocaSenha?: string | null;
}

/** POST /api/Auth/NovaSenha */
export interface AuthNovaSenhaRequestDto {
  tokenTrocaSenha: string;
  novaSenha: string;
}

/** POST /api/Auth/EsqueciSenha */
export interface AuthEsqueciSenhaRequestDto {
  loginOuEmail: string;
}

/** Corpo dos erros 400/401 da API. */
export interface AuthErroDto {
  mensagem?: string;
}
