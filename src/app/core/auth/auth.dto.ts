/**
 * Contratos de `/api/WorkspaceLogin` (WorkspaceLoginController).
 * camelCase, padrão da API.
 */

/** POST /api/WorkspaceLogin */
export interface LoginRequestDto {
  /** Login ou e-mail. */
  login: string;
  senha: string;
}

/** POST /api/WorkspaceLogin (resposta 200) */
export interface LoginRespostaDto {
  accessToken: string;

  /** Segundos até expirar (TokenSettings:Seconds). A validade usada é o `exp` do JWT. */
  expiraEm: number;

  /** Senha temporária: precisa definir uma nova antes de entrar. */
  senhaTemporaria: boolean;

  /** Ainda não usado (fluxo de primeiro acesso). */
  primeiroAcesso: boolean;
}

/** POST /api/WorkspaceLogin/NovaSenha (com o Bearer da senha temporária) */
export interface NovaSenhaRequestDto {
  /** Senha temporária digitada no login. */
  senhaAtual: string;
  novaSenha: string;
}

/** POST /api/WorkspaceLogin/ResetarSenha */
export interface ResetarSenhaRequestDto {
  loginOuEmail: string;
}

/** Corpo dos erros da API. */
export interface AuthErroDto {
  mensagem?: string;
  message?: string;
}
