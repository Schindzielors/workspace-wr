/**
 * Contratos da autenticação.
 *
 * Login: o mesmo `POST /api/Token` (TokenController) que os outros sistemas
 * já usam. Recebe form (`UserName`, `Password`) e devolve o JWT no corpo.
 * Os nomes abaixo são os do objeto anônimo do TokenController.
 */

/** POST /api/Token (resposta 200) */
export interface TokenRespostaDto {
  authenticated: boolean;

  /** Senha temporária ("Snhtmp = S"): precisa definir uma nova antes de entrar. */
  passwordReset: boolean;
  isFirstAccess: boolean;

  /** "yyyy-MM-dd HH:mm:ss" no horário do servidor. A validade usada é o `exp` do JWT. */
  created: string;
  expiration: string;
  access_token: string;
  message?: string;
}

/**
 * POST /api/Auth/NovaSenha (com o Bearer da senha temporária).
 * Usa o AutenticacaoServiceApp.AlterarSenha, que confere a senha atual.
 */
export interface AuthNovaSenhaRequestDto {
  /** Senha temporária digitada no login. */
  senhaAtual: string;
  novaSenha: string;
}

/**
 * POST /Utilitarios/ResetarSenha (ResetarSenhaController, já existente).
 * Gera a senha temporária e envia pelo template "email_redefinicao_senha.txt".
 */
export interface ResetarSenhaRequestDto {
  userName: string;
}

/** POST /Utilitarios/ResetarSenha (resposta 200) */
export interface ResetarSenhaRespostaDto {
  success: boolean;
  message: string;
}

/** Corpo dos erros da API (AuthController usa `mensagem`; os demais, `message`). */
export interface AuthErroDto {
  mensagem?: string;
  message?: string;
}
