/**
 * Aplicação devolvida por `/api/WorkspaceMenu/Projetos`.
 *
 * Em PascalCase, como os demais endpoints do Workspace (a API usa
 * Dictionary/Dapper, que mantêm o nome exato dos campos).
 */
export interface WorkspaceProjectDto {
  Id: number;
  Nome: string;
  Descricao: string;
  Projeto: string;
  Url: string;

  /** Ícone da aplicação na navegação (ex.: "map", "truck"). */
  Icon?: string | null;

  /**
   * true: mostra o menu lateral (MenuProjetos).
   * false: abre a Url direto em uma aba, sem menu (ex.: Rodopar).
   * Ausente: tratado como true.
   */
  PossuiMenu?: boolean | null;
}
