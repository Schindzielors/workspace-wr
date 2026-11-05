/**
 * Aplicação devolvida por `/api/WorkspaceMenu/Projetos`.
 *
 * Em camelCase, padrão da API (primeira letra minúscula).
 */
export interface WorkspaceProjectDto {
  id: number;
  nome: string;
  descricao: string;
  projeto: string;
  url: string;

  /** Ícone da aplicação na navegação (ex.: "map", "truck"). */
  icon?: string | null;

  /**
   * true: mostra o menu lateral (MenuProjetos).
   * false: abre a Url direto em uma aba, sem menu (ex.: Rodopar).
   * Ausente: tratado como true.
   */
  possuiMenu?: boolean | null;
}
