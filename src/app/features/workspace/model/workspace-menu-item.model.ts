import { WorkspaceTab } from './workspace-tab.model';

export interface WorkspaceMenuItem {
  id: string;
  title: string;

  children?: WorkspaceMenuItem[];

  system?: WorkspaceTab['system'];
  url?: string;

  /** Rota original da API (ex.: "/cotacoes-em-aberto"), usada nos favoritos. */
  rota?: string;
}