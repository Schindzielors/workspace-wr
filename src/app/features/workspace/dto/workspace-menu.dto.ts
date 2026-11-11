export interface WorkspaceMenuDto {
  id: number;
  idPai: number | null;
  titulo: string;
  rota: string | null;
  icone: string | null;

  /** Sistema da tela (RODFRM.NOMEXE): "Portal Wr", "Web Rodopar"... */
  projeto?: string | null;
}