/**
 * Contratos de `/api/WorkspaceFavorito` (WorkspaceFavoritoController).
 * PascalCase, como os demais endpoints do Workspace.
 */

/** GET /api/WorkspaceFavorito (itens da lista) */
export interface WorkspaceFavoritoDto {
  /** Id do item no menu (RODFRM.CODFRM), o mesmo `Id` de /MenuProjetos. */
  IdMenu: number;
  Titulo: string;
  Categoria: string | null;
  Subcategoria: string | null;

  /** Mesmo valor de `Projeto` em /WorkspaceMenu/Projetos (ex.: "Wr"). */
  Projeto: string;
  Rota: string;
}

/** POST /api/WorkspaceFavorito */
export interface WorkspaceFavoritoRequestDto extends WorkspaceFavoritoDto {}

/** PUT /api/WorkspaceFavorito/Ordem */
export interface WorkspaceFavoritoOrdemRequestDto {
  Ids: number[];
}
