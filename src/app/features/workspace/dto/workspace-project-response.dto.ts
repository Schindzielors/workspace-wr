import { WorkspaceProjectDto } from './workspace-project.dto';

export interface WorkspaceProjectResponseDto {
  items: WorkspaceProjectDto[];
  totalItems: number;
  maxNavigationPages: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  startPage: number;
  endPage: number;
  pageNumbers: number[];
}