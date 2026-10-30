import {
  HomeConectorDto,
  HomeFavoritoDto,
  HomeListResponseDto,
  HomePainelDto,
  HomeUsuarioDto
} from '../dto/home.dto';

/**
 * Dados simulados da Home, no MESMO formato que a API deve devolver
 * (ver `../dto/home.dto.ts`). Assim, ao ligar a API, o `HomeService`
 * troca apenas a origem dos dados; a conversão continua a mesma.
 *
 * Remover este arquivo quando todos os endpoints estiverem disponíveis.
 *
 * ---------------------------------------------------------------------------
 * Cenários para testar os estados da Home
 * ---------------------------------------------------------------------------
 * Abra o Workspace com `?homeMock=<cenario>` na URL, por exemplo:
 *   http://localhost:4200/?homeMock=sem-paineis
 *
 * - completo (padrão)   Home completa
 * - sem-favoritos       Nenhuma tela favoritada
 * - sem-conectores      Nenhum conector disponível
 * - sem-paineis         Nenhum painel criado
 * - vazio               Primeiro acesso: tudo vazio
 */
export type HomeMockCenario =
  | 'completo'
  | 'sem-favoritos'
  | 'sem-conectores'
  | 'sem-paineis'
  | 'vazio';

/** Atraso artificial para simular a latência da API. */
export const HOME_MOCK_DELAY_MS = 300;

export function homeMockCenario(): HomeMockCenario {
  const cenario = new URLSearchParams(window.location.search).get('homeMock');

  const cenarios: HomeMockCenario[] = [
    'completo',
    'sem-favoritos',
    'sem-conectores',
    'sem-paineis',
    'vazio'
  ];

  return cenarios.includes(cenario as HomeMockCenario)
    ? cenario as HomeMockCenario
    : 'completo';
}

function lista<T>(items: T[]): HomeListResponseDto<T> {
  return { items, totalItems: items.length };
}

export const MOCK_USUARIO: HomeUsuarioDto = {
  Nome: 'Bruno'
};

export const MOCK_FAVORITOS = lista<HomeFavoritoDto>([
  { Id: 1, Titulo: 'Cotações em aberto', Categoria: 'Recursos', Subcategoria: 'E-Cotação', Projeto: 'Portal Wr', Rota: '/cotacoes-em-aberto' },
  { Id: 2, Titulo: 'Solicitação de Ordem de Coleta', Categoria: 'Recursos', Subcategoria: 'Ordem de Coleta', Projeto: 'Portal Wr', Rota: '/solicitacao-ordem-coleta' },
  { Id: 3, Titulo: 'Acompanhamento de entregas', Categoria: 'Recursos', Subcategoria: 'Acompanhamento', Projeto: 'Portal Wr', Rota: '/acompanhamento-entregas' },
  { Id: 4, Titulo: 'Cadastro de veículos', Categoria: 'Cadastros', Subcategoria: 'Frota', Projeto: 'Portal Wr', Rota: '/cadastro-veiculos' },
  { Id: 5, Titulo: 'Cadastro de motoristas', Categoria: 'Cadastros', Subcategoria: 'Pessoas', Projeto: 'Portal Wr', Rota: '/cadastro-motoristas' },
  { Id: 6, Titulo: 'Checkpoint de viagens', Categoria: 'Recursos', Subcategoria: 'Checkpoint', Projeto: 'Portal Wr', Rota: '/checkpoint' },
  { Id: 7, Titulo: 'Abastecimentos do mês', Categoria: 'Recursos', Subcategoria: 'Abastecimento', Projeto: 'Portal Wr', Rota: '/abastecimentos' },
  { Id: 8, Titulo: 'Painel de documentos fiscais', Categoria: 'Recursos', Subcategoria: 'Painel de Documentos', Projeto: 'Portal Wr', Rota: '/painel-documentos' },
  { Id: 9, Titulo: 'Atendimentos SAC', Categoria: 'Recursos', Subcategoria: 'SAC', Projeto: 'Portal Wr', Rota: '/sac' },
  { Id: 10, Titulo: 'Portaria: entrada e saída', Categoria: 'Recursos', Subcategoria: 'Portaria', Projeto: 'Portal Wr', Rota: '/portaria' },
  { Id: 11, Titulo: 'Emissão de relatórios', Categoria: 'Utilitários', Subcategoria: 'Relatórios', Projeto: 'Portal Wr', Rota: '/relatorios' },
  { Id: 12, Titulo: 'Parâmetros do sistema', Categoria: 'Manutenção', Subcategoria: 'Configurações', Projeto: 'Portal Wr', Rota: '/parametros' },
  { Id: 13, Titulo: 'Usuários e permissões', Categoria: 'Manutenção', Subcategoria: 'Segurança', Projeto: 'Portal Wr', Rota: '/usuarios' },
  { Id: 14, Titulo: 'Portal DOC-e', Categoria: 'Recursos', Subcategoria: 'Portal DOC-e', Projeto: 'Portal Wr', Rota: '/portal-doc-e' },
  { Id: 15, Titulo: 'Alocação de veículos', Categoria: 'Recursos', Subcategoria: 'Alocação', Projeto: 'Portal Wr', Rota: '/alocacao-veiculos' }
]);

export const MOCK_CONECTORES = lista<HomeConectorDto>([
  { Id: 1, Nome: 'Pagamento App', Descricao: 'Processa pagamentos feitos via PIX.', Categoria: 'Pagamento', Status: 'ATIVO', LogoUrl: null },
  { Id: 2, Nome: 'Rastreamento GPS', Descricao: 'Posição dos veículos em tempo real.', Categoria: 'Telemetria', Status: 'EM_ANALISE', LogoUrl: null },
  { Id: 3, Nome: 'Nota Fiscal Eletrônica', Descricao: 'Emissão e consulta de NF-e e CT-e.', Categoria: 'Fiscal', Status: 'INATIVO', LogoUrl: null },
  { Id: 4, Nome: 'Assinatura Digital', Descricao: 'Assinatura de documentos de transporte.', Categoria: 'Documentos', Status: 'AGUARDANDO_CONFIGURACAO', LogoUrl: null },
  { Id: 5, Nome: 'Vale-Pedágio', Descricao: 'Compra automática de vale-pedágio.', Categoria: 'Pagamento', Status: 'ATIVO', LogoUrl: null },
  { Id: 6, Nome: 'Cotação de Frete', Descricao: 'Integração com marketplaces de frete.', Categoria: 'Comercial', Status: 'ATIVO', LogoUrl: null },
  { Id: 7, Nome: 'Seguro de Carga', Descricao: 'Averbação automática de cargas.', Categoria: 'Seguro', Status: 'EM_ANALISE', LogoUrl: null },
  { Id: 8, Nome: 'Abastecimento', Descricao: 'Controle de abastecimento em postos.', Categoria: 'Frota', Status: 'INATIVO', LogoUrl: null }
]);

export const MOCK_PAINEIS = lista<HomePainelDto>([
  { Id: 1, Titulo: 'Consulta de veículos', Projeto: null, Rota: null },
  { Id: 2, Titulo: 'Entregas realizadas', Projeto: null, Rota: null },
  { Id: 3, Titulo: 'Entregas pendentes', Projeto: null, Rota: null },
  { Id: 4, Titulo: 'Entregas canceladas', Projeto: null, Rota: null },
  { Id: 5, Titulo: 'Rotas de MG', Projeto: null, Rota: null },
  { Id: 6, Titulo: 'Rotas do RJ', Projeto: null, Rota: null },
  { Id: 7, Titulo: 'Rotas de SP', Projeto: null, Rota: null },
  { Id: 8, Titulo: 'Abastecimento', Projeto: null, Rota: null },
  { Id: 9, Titulo: 'Posto de combustível', Projeto: null, Rota: null },
  { Id: 10, Titulo: 'Motoristas', Projeto: null, Rota: null },
  { Id: 11, Titulo: 'Carga e descarga', Projeto: null, Rota: null },
  { Id: 12, Titulo: 'Time', Projeto: null, Rota: null }
]);
