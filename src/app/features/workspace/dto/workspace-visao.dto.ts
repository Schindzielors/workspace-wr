/**
 * Contratos de `/api/WorkspaceVisao` (WorkspaceVisaoController).
 * camelCase, padrão da API (primeira letra minúscula).
 */

export type WorkspaceVisaoTipoDto = 'GRUPO' | 'EMPRESA' | 'FILIAL';

/** GET /api/WorkspaceVisao/Estrutura (itens da lista) */
export interface WorkspaceVisaoNoDto {
  /** Único na lista toda (ex.: "G1", "E1", "F1"). */
  id: string;
  nome: string;
  tipo: WorkspaceVisaoTipoDto;

  /** Grupo da empresa, ou empresa da filial; null para grupos. */
  idPai: string | null;
}

/** GET e PUT /api/WorkspaceVisao/Atual */
export interface WorkspaceVisaoAtualDto {
  idGrupo: string;
  idEmpresa: string | null;
  idFilial: string | null;
}
