import { WorkspaceTab } from './workspace-tab.model';

export interface WorkspaceMenuItem {
  id: string;
  title: string;

  children?: WorkspaceMenuItem[];

  system?: WorkspaceTab['system'];
  url?: string;
}