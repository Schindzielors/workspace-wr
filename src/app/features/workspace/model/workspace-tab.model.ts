/**
 * Representa uma aba aberta na área de trabalho do Workspace.
 *
 * Cada aba corresponde a uma tela pertencente a uma das aplicações
 * integradas ao Workspace, como Portal WR, Web Rodopar ou Rodopar.
 *
 * O Workspace utiliza essas informações para:
 * - identificar unicamente a aba;
 * - exibir seu título na barra de abas;
 * - identificar a aplicação de origem;
 * - carregar a respectiva tela dentro de um iframe.
 *
 * REGRA ATUAL:
 * Nesta versão do Workspace, cada tela/menu pode possuir no máximo
 * uma aba aberta por vez.
 *
 * Ao selecionar novamente um menu que já possui uma aba aberta,
 * o Workspace deve ativar a aba existente em vez de criar uma
 * nova instância.
 *
 * No futuro, caso seja necessário permitir múltiplas instâncias de uma
 * mesma tela, o conceito de identificador da aba poderá ser separado
 * do identificador do menu/recurso que originou sua abertura.
 */
export interface WorkspaceTab {

  /**
   * Identificador único da aba dentro do Workspace.
   *
   * Atualmente também representa, na prática, a identidade da tela/menu
   * que originou a aba.
   *
   * É utilizado pelo WorkspaceTabsService para:
   * - verificar se a tela já está aberta;
   * - impedir a abertura duplicada do mesmo menu;
   * - ativar uma aba existente;
   * - fechar uma aba;
   * - identificar a aba atualmente ativa.
   *
   * Também é utilizado pelo IframeHost como chave para manter em cache
   * a SafeResourceUrl correspondente ao iframe daquela aba.
   *
   * Exemplo:
   * "portal-wr-cotacoes-aberto"
   */
  id: string;

  /**
   * Título apresentado ao usuário na barra de abas do Workspace.
   *
   * Deve representar de forma clara a tela ou funcionalidade aberta.
   *
   * Exemplo:
   * "Cotações em aberto"
   */
  title: string;

  /**
   * Identifica a aplicação/sistema ao qual a aba pertence.
   *
   * O valor é gerado a partir da aplicação carregada pela API
   * e permite identificar a origem da tela independentemente
   * da URL carregada no iframe.
   *
   * Exemplos:
   * - portal-wr
   * - web-rodopar
   * - rodopar
   */
  system: string;

  /**
   * URL que será carregada no iframe associado à aba.
   *
   * Para Portal WR e Web Rodopar, normalmente corresponderá diretamente
   * à rota da funcionalidade selecionada pelo usuário.
   *
   * Para o Rodopar legado, poderá representar a URL de acesso ao ambiente
   * RDP disponibilizado via web.
   *
   * O IframeHost é responsável por transformar esta URL em uma
   * SafeResourceUrl antes de utilizá-la no atributo `src` do iframe.
   *
   * IMPORTANTE:
   * A URL deve representar um recurso previamente conhecido e autorizado
   * pelo Workspace. Quando essas informações passarem a vir da API,
   * deverão existir regras de validação para impedir o carregamento
   * indiscriminado de origens não confiáveis.
   */
  url: string;
}