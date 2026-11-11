import { WorkspaceMenuItem } from './workspace-menu-item.model';

export interface WorkspaceApplication {
  id: string;

  /**
   * Nome completo da aplicação.
   *
   * Exemplo:
   * Web Rodopar
   */
  title: string;

  /**
   * Nome reduzido utilizado em áreas compactas,
   * como a barra global de aplicações.
   *
   * Exemplo:
   * Web RP
   */
  shortTitle?: string;

  /**
   * Identificador visual utilizado pelo layout.
   *
   * Neste momento estamos usando um valor textual simples.
   * A implementação do ícone será centralizada no componente.
   */
  icon?: string;

  /**
   * Identificador técnico da aplicação utilizado pelas
   * abas abertas no Workspace.
   *
   * Exemplo:
   * portal-wr
   */
  system: string;

  /**
   * Identificador utilizado pelo backend para relacionar
   * a aplicação aos seus menus.
   *
   * Exemplo:
   * Portal Wr
   */
  projeto: string;

  /**
 * URL base utilizada para montar as URLs das telas
 * pertencentes à aplicação.
 *
 * Exemplo:
 * http://54.232.212.10:8588/
 */
  baseUrl: string;

  /**
   * URL do Portal WR (`urlPortal` da API). A aplicação WR junta Portal WR e
   * Web Rodopar: telas com origem "Portal Wr" usam esta URL; as demais, `baseUrl`.
   */
  portalUrl?: string;

  /**
   * Indica se a aplicação tem menu lateral.
   *
   * - true (ex.: WR): ao selecionar, o Workspace mostra o menu lateral.
   * - false (ex.: Rodopar): ao selecionar, o Workspace abre `baseUrl` direto
   *   em uma aba, sem menu lateral.
   */
  possuiMenu: boolean;

  menus: WorkspaceMenuItem[];
}