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

  /** URL do Web Rodopar (ou da aplicação, quando ela é um sistema só). */
  url: string;

  /**
   * URL do Portal WR. A aplicação WR junta dois sistemas: as telas com
   * `projeto` (Nomexe) "Portal Wr" abrem aqui; as demais, em `url`.
   */
  urlPortal?: string | null;

  /** Ícone da aplicação na navegação (ex.: "map", "truck"). */
  icon?: string | null;

  /**
   * true: mostra o menu lateral (MenuProjetos).
   * false: abre a Url direto em uma aba, sem menu (ex.: Rodopar).
   * Ausente: tratado como true.
   */
  possuiMenu?: boolean | null;
}
