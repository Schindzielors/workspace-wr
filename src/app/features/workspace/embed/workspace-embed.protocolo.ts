/**
 * Protocolo de mensagens (postMessage) entre o Workspace e os sistemas abertos
 * nas abas (iframes com name="dtp-workspace"). O outro lado fica na
 * dtp-angular-library (WorkspaceSessaoService); os dois precisam seguir este
 * formato.
 *
 *   sistema  -> Workspace : { tipo: 'dtp-workspace:pedir-sessao', versao: 1 }
 *   Workspace -> sistema  : { tipo: 'dtp-workspace:sessao', versao: 1, token, expiraEm, filiais, visao }
 *   Workspace -> sistema  : { tipo: 'dtp-workspace:visao',  versao: 1, filiais, visao }   (troca de visão)
 *   sistema  -> Workspace : { tipo: 'dtp-workspace:sessao-expirada', versao: 1 }        (401 que a renovação não resolveu)
 *
 * Segurança: o Workspace só responde para iframes dele e só para a origem da
 * URL que abriu (postMessage com targetOrigin exato).
 */

export const PROTOCOLO_VERSAO = 1;

export const MENSAGEM_PEDIR_SESSAO = 'dtp-workspace:pedir-sessao';
export const MENSAGEM_SESSAO = 'dtp-workspace:sessao';
export const MENSAGEM_VISAO = 'dtp-workspace:visao';
export const MENSAGEM_SESSAO_EXPIRADA = 'dtp-workspace:sessao-expirada';

/** Item da visão com o código real do ERP. */
export interface VisaoItemMensagem {
  codigo: number;
  nome: string;
}

/** Visão escolhida no Workspace (empresa/filial são null quando o nível é maior). */
export interface VisaoMensagem {
  grupo: VisaoItemMensagem | null;
  empresa: VisaoItemMensagem | null;
  filial: VisaoItemMensagem | null;
}

export interface PedirSessaoMensagem {
  tipo: typeof MENSAGEM_PEDIR_SESSAO;
  versao: number;
}

export interface SessaoMensagem {
  tipo: typeof MENSAGEM_SESSAO;
  versao: number;

  /** JWT (mesmo token do TokenController / WorkspaceLoginController). */
  token: string;

  /** `exp` do token, em segundos desde 1970. */
  expiraEm: number | null;

  /** Códigos das filiais da visão (grupo = todas do grupo; empresa = da empresa; filial = só ela). */
  filiais: number[];
  visao: VisaoMensagem | null;
}

export interface VisaoAlteradaMensagem {
  tipo: typeof MENSAGEM_VISAO;
  versao: number;
  filiais: number[];
  visao: VisaoMensagem | null;
}
