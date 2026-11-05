/**
 * Contratos de `/api/WorkspaceUsuario` (WorkspaceUsuarioController).
 * camelCase, padrão da API (primeira letra minúscula).
 */

/** GET /api/WorkspaceUsuario/Perfil */
export interface WorkspaceUsuarioPerfilDto {
  nome: string;
  email: string;
  /** Definido pelo administrador; só leitura. */
  cargo: string;
  fotoUrl: string | null;
  /** 'pt-BR' | 'en-US' | 'es-ES' */
  idioma: string;
}

/** PUT /api/WorkspaceUsuario/Perfil */
export interface WorkspaceUsuarioPerfilRequestDto {
  nome: string;
  idioma: string;
}

/** POST /api/WorkspaceUsuario/Foto (resposta) */
export interface WorkspaceUsuarioFotoDto {
  fotoUrl: string;
}

/** GET /api/WorkspaceUsuario/Notificacoes (itens da lista) */
export interface WorkspaceNotificacaoDto {
  id: number;
  titulo: string;
  descricao: string;
  ativo: boolean;
}
