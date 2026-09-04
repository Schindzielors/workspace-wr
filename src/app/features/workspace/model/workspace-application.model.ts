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

  menus: WorkspaceMenuItem[];
}