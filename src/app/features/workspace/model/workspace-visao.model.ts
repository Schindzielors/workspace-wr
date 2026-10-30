export type WorkspaceVisaoTipo = 'grupo' | 'empresa' | 'filial';

/** Grupo, empresa ou filial que o usuário pode acessar. */
export interface WorkspaceVisaoNo {
  id: string;
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
