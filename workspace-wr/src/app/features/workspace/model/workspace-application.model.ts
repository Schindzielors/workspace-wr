import { WorkspaceMenuItem } from "./workspace-menu-item.model";


export interface WorkspaceApplication {
  id: string;
  title: string;
  menus: WorkspaceMenuItem[];
}