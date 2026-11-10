export type WorkspaceVisaoTipo = 'grupo' | 'empresa' | 'filial';

/** Grupo, empresa ou filial que o usuário pode acessar. */
export interface WorkspaceVisaoNo {
  id: string;

  /** Código real no ERP (código do grupo, da empresa ou da filial). */
  codigo: number;
  nome: string;
  tipo: WorkspaceVisaoTipo;
  idPai: string | null;
}

/** Visão selecionada ("Trocar visão" no header). */
export interface WorkspaceVisao {
  idGrupo: string;
  idEmpresa: string | null;
  idFilial: string | null;
}
