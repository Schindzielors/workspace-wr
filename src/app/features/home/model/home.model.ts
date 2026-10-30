/**
 * Modelos usados pela Home do Workspace.
 *
 * São o formato que os componentes consomem. O formato que a API devolve
 * fica em `../dto/home.dto.ts`, e a conversão entre os dois acontece no
 * `HomeService`.
 */

/** Usuário logado, usado na saudação ("Olá, Bruno!"). */
export interface HomeUsuario {
  nome: string;
}

/**
 * Tela marcada como favorita pelo usuário.
 *
 * Ao clicar, o Workspace sai da Home, seleciona a aplicação de origem
 * (`sistema`) e abre a tela em uma aba.
 */
export interface HomeFavorito {
  id: string;
  titulo: string;

  /** Caminho exibido acima do título: "Categoria / Subcategoria". */
  categoria: string;
  subcategoria: string;

  /** Identificador técnico da aplicação (ex.: "portal-wr"). */
  sistema: string;

  /** Rota da tela; a URL é montada com a `baseUrl` da aplicação. */
  rota: string;
}

export type HomeConectorStatus =
  | 'ativo'
  | 'em-analise'
  | 'inativo'
  | 'aguardando-configuracao';

/** Recurso/integração disponível para o sistema (card da coluna Conectores). */
export interface HomeConector {
  id: string;
  nome: string;
  descricao: string;

  /** Texto exibido no rodapé do card (ex.: "Pagamento"). */
  categoria: string;
  status: HomeConectorStatus;

  /** Logo do conector. Sem logo, o card mostra o espaço vazio do Figma. */
  logoUrl?: string;
}

/** Painel favorito do usuário. */
export interface HomePainel {
  id: string;
  titulo: string;

  /** Quando informados, o painel abre em uma aba da aplicação `sistema`. */
  sistema?: string;
  rota?: string;
}
