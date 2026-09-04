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

  menus: WorkspaceMenuItem[];
}