import { WorkspaceMenuDto } from './workspace-menu.dto';

export interface WorkspaceMenuResponseDto {
  items: WorkspaceMenuDto[];
  totalItems: number;
  maxNavigationPages: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  startPage: number;
  endPage: number;
  pageNumbers: number[];
}