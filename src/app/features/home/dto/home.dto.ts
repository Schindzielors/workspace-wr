/**
 * Contratos de `/api/WorkspaceHome` (WorkspaceHomeController).
 *
 * As propriedades vêm em camelCase, padrão da API (primeira letra
 * minúscula). Nas consultas com Dapper, os aliases do SQL precisam seguir
 * esse formato (ex.: `NOMCON AS nome`), porque a linha mantém o nome exato
 * do alias.
 */

/** Envelope de lista usado pela API do Workspace. */
export interface HomeListResponseDto<T> {
  items: T[];
  totalItems: number;
}

/** GET /api/WorkspaceHome/Conectores */
export interface HomeConectorDto {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;

  /** 'ATIVO' | 'EM_ANALISE' | 'INATIVO' | 'AGUARDANDO_CONFIGURACAO' */
  status: string;
  logoUrl: string | null;
}

/** GET /api/WorkspaceHome/Paineis */
export interface HomePainelDto {
  id: number;
  titulo: string;
  projeto: string | null;
  rota: string | null;
}
