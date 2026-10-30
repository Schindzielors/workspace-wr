/**
 * Tela favorita do usuário.
 *
 * É sempre um item do menu lateral (`idMenu` = `WorkspaceMenuItem.id`), por
 * isso a Home e o menu abrem a mesma aba para o mesmo favorito.
 */
export interface WorkspaceFavorito {
  idMenu: string;
  titulo: string;

  /** Pastas acima da tela no menu ("Categoria / Subcategoria"). */
  categoria: string;
  subcategoria: string;

  /** Identificador técnico da aplicação (ex.: "wr"). */
  sistema: string;

  /** Valor de `projeto` da aplicação (ex.: "Wr"), enviado à API. */
  projeto: string;

  rota: string;
}
