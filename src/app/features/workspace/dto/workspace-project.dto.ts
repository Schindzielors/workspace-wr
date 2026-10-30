export interface WorkspaceProjectDto {
  id: number;
  nome: string;
  descricao: string;
  projeto: string;
  url: string;

  /** Ícone da aplicação na navegação (ex.: "map", "truck"). */
  icon?: string;
}