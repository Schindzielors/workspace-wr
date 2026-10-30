/**
 * Contratos de `/api/WorkspaceVisao` (WorkspaceVisaoController).
 * PascalCase, como os demais endpoints do Workspace.
 */

export type WorkspaceVisaoTipoDto = 'GRUPO' | 'EMPRESA' | 'FILIAL';

/** GET /api/WorkspaceVisao/Estrutura (itens da lista) */
export interface WorkspaceVisaoNoDto {
  /** Único na lista toda (ex.: "G1", "E1", "F1"). */
  Id: string;
  Nome: string;
  Tipo: WorkspaceVisaoTipoDto;

  /** Grupo da empresa, ou empresa da filial; null para grupos. */
  IdPai: string | null;
}

/** GET e PUT /api/WorkspaceVisao/Atual */
export interface WorkspaceVisaoAtualDto {
  IdGrupo: string;
  IdEmpresa: string | null;
  IdFilial: string | null;
}
