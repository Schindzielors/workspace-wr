/**
 * Contratos esperados da API da Home.
 *
 * Seguem o mesmo padrão dos endpoints já existentes do Workspace
 * (`/api/WorkspaceMenu/...`): propriedades em PascalCase e listas dentro
 * de `items`. Os nomes são uma PROPOSTA; ajuste aqui quando o backend
 * definir o contrato final. Os mocks em `../mock/home.mock.ts` usam
 * exatamente estes formatos.
 */

/** Envelope de lista usado pela API do Workspace. */
export interface HomeListResponseDto<T> {
  items: T[];
  totalItems: number;
}

/** GET /api/WorkspaceHome/Usuario */
export interface HomeUsuarioDto {
  Nome: string;
}

/** GET /api/WorkspaceHome/Favoritos */
export interface HomeFavoritoDto {
  Id: number;
  Titulo: string;
  Categoria: string;
  Subcategoria: string;

  /** Nome do projeto, igual ao campo `projeto` de `/Projetos` (ex.: "Portal Wr"). */
  Projeto: string;

  /** Rota da tela, no mesmo formato do campo `Rota` de `/MenuProjetos`. */
  Rota: string;
}

/** GET /api/WorkspaceHome/Conectores */
export interface HomeConectorDto {
  Id: number;
  Nome: string;
  Descricao: string;
  Categoria: string;

  /** 'ATIVO' | 'EM_ANALISE' | 'INATIVO' | 'AGUARDANDO_CONFIGURACAO' */
  Status: string;
  LogoUrl: string | null;
}

/** GET /api/WorkspaceHome/Paineis */
export interface HomePainelDto {
  Id: number;
  Titulo: string;
  Projeto: string | null;
  Rota: string | null;
}
