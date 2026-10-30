/**
 * Contratos de `/api/WorkspaceUsuario` (WorkspaceUsuarioController).
 * PascalCase, como os demais endpoints do Workspace.
 */

/** GET /api/WorkspaceUsuario/Perfil */
export interface WorkspaceUsuarioPerfilDto {
  Nome: string;
  Email: string;
  /** Definido pelo administrador; só leitura. */
  Cargo: string;
  FotoUrl: string | null;
  /** 'pt-BR' | 'en-US' | 'es-ES' */
  Idioma: string;
}

/** PUT /api/WorkspaceUsuario/Perfil */
export interface WorkspaceUsuarioPerfilRequestDto {
  Nome: string;
  Idioma: string;
}

/** POST /api/WorkspaceUsuario/Foto (resposta) */
export interface WorkspaceUsuarioFotoDto {
  FotoUrl: string;
}

/** GET /api/WorkspaceUsuario/Notificacoes (itens da lista) */
export interface WorkspaceNotificacaoDto {
  Id: number;
  Titulo: string;
  Descricao: string;
  Ativo: boolean;
}
