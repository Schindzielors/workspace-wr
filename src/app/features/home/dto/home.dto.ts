/**
 * Contratos de `/api/WorkspaceHome` (WorkspaceHomeController).
 *
 * As propriedades vêm em PascalCase, como no `/WorkspaceMenu/MenuProjetos`:
 * a API devolve linhas do Dapper (ou Dictionary, no mock), que mantêm o nome
 * exato do alias do SQL. Se algum endpoint passar a devolver objeto anônimo
 * ou classe, o .NET serializa em camelCase e estes nomes precisam mudar.
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
