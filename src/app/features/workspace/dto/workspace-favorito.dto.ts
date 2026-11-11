/**
 * Contratos de `/api/WorkspaceFavorito` (WorkspaceFavoritoController).
 * camelCase, padrão da API (primeira letra minúscula).
 */

/** GET /api/WorkspaceFavorito (itens da lista) */
export interface WorkspaceFavoritoDto {
  /** Id do item no menu (RODFRM.CODFRM), o mesmo `id` de /MenuProjetos. */
  idMenu: number;
  titulo: string;
  categoria: string | null;
  subcategoria: string | null;

  /** Mesmo valor de `projeto` em /WorkspaceMenu/Projetos (ex.: "Wr"). */
  projeto: string;

  /** Sistema da tela (RODFRM.NOMEXE, ex.: "Portal Wr"), para abrir na URL certa. */
  origem: string | null;
  rota: string;
}

/** POST /api/WorkspaceFavorito */
export interface WorkspaceFavoritoRequestDto extends WorkspaceFavoritoDto {}

/** PUT /api/WorkspaceFavorito/Ordem */
export interface WorkspaceFavoritoOrdemRequestDto {
  ids: number[];
}
