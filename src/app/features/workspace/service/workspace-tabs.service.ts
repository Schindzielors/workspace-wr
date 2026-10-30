import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { WorkspaceTab } from '../model/workspace-tab.model';
import { WorkspaceSessionService } from './workspace-session.service';

/** Formato salvo na sessão (ver WorkspaceSessionService). */
interface AbasSalvas {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}

const CHAVE_SESSAO = 'abas';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceTabsService {

  private readonly session = inject(WorkspaceSessionService);

  /**
   * Estado interno que armazena todas as abas atualmente abertas
   * no Workspace.
   *
   * Cada item representa uma tela/aplicação que foi aberta pelo usuário
   * e que deve permanecer disponível até que ele explicitamente feche
   * a respectiva aba.
   *
   * O Signal é mantido como privado para impedir que outros componentes
   * alterem diretamente a coleção. Toda modificação deve passar pelos
   * métodos deste serviço, garantindo que as regras de gerenciamento
   * das abas sejam respeitadas.
   *
   * Exemplos de operações centralizadas neste serviço:
   * - abertura de uma nova aba;
   * - ativação de uma aba existente;
   * - fechamento de uma aba;
   * - definição da próxima aba ativa após um fechamento.
   */
  private readonly _tabs = signal<WorkspaceTab[]>(this.abasSalvas().tabs);

  /**
   * Identificador da aba atualmente ativa/visível para o usuário.
   *
   * O valor será `null` quando nenhuma aba estiver aberta ou ativa.
   *
   * É armazenado separadamente da coleção de abas para evitar manter
   * duas representações completas do mesmo objeto no estado.
   */
  private readonly _activeTabId = signal<string | null>(this.abasSalvas().activeTabId);

  /**
   * Controla a versão de reload de cada aba.
   *
   * O valor é incrementado somente quando o usuário solicita
   * explicitamente a atualização de uma aba.
   *
   * O IframeHost utiliza essa versão para saber quando deve
   * gerar uma nova referência de SafeResourceUrl e, consequentemente,
   * fazer o navegador recarregar o iframe correspondente.
   */
  private readonly _reloadVersions = signal<Record<string, number>>({});

  /**
   * Abas cujo iframe ainda está carregando (exibem o loading).
   *
   * Uma aba entra aqui ao ser aberta, ao ser atualizada e ao ser restaurada
   * da sessão (F5), e sai quando o iframe dispara o evento `load`.
   */
  private readonly _loadingTabIds = signal<ReadonlySet<string>>(
    new Set(this._tabs().map(tab => tab.id))
  );

  /**
   * Exposição somente leitura da coleção de abas.
   *
   * Componentes podem observar e utilizar este Signal, mas não conseguem
   * modificar diretamente seu conteúdo através de `set` ou `update`.
   *
   * As alterações devem ocorrer exclusivamente através dos métodos
   * disponibilizados pelo WorkspaceTabsService.
   */
  readonly tabs = this._tabs.asReadonly();

  /**
   * Exposição somente leitura do identificador da aba atualmente ativa.
   *
   * Utilizado principalmente pelos componentes responsáveis por:
   * - destacar visualmente a aba selecionada;
   * - determinar qual iframe deve ficar visível;
   * - exibir informações da tela atual no Workspace.
   */
  readonly activeTabId = this._activeTabId.asReadonly();

  /**
   * Signal derivado que retorna o objeto completo da aba atualmente ativa.
   *
   * O valor é calculado automaticamente sempre que ocorrer alteração em:
   * - `_activeTabId`;
   * - `_tabs`.
   *
   * Dessa forma, os componentes consumidores não precisam procurar
   * manualmente a aba ativa dentro da coleção.
   *
   * Retorna `null` quando:
   * - nenhuma aba estiver ativa;
   * - não existirem abas abertas;
   * - o ID ativo não for encontrado na coleção.
   */
  readonly activeTab = computed(() => {
    const activeTabId = this._activeTabId();

    return this._tabs().find(tab => tab.id === activeTabId) ?? null;
  });

  constructor() {
    /**
     * Salva as abas abertas e a aba ativa na sessão a cada alteração, para
     * que recarregar a página (F5) reabra as mesmas abas.
     *
     * Observação: o iframe recarrega a URL da aba; a navegação feita dentro
     * da aplicação embarcada (filtros, telas internas) não é restaurada.
     */
    effect(() => {
      const salvas: AbasSalvas = {
        tabs: this._tabs(),
        activeTabId: this._activeTabId()
      };

      this.session.salvar(CHAVE_SESSAO, salvas);
    });
  }

  /** Abas salvas na sessão; vazio quando não há nada salvo ou é inválido. */
  private abasSalvas(): AbasSalvas {
    const salvas = this.session.ler<AbasSalvas>(CHAVE_SESSAO);
    const tabs = Array.isArray(salvas?.tabs)
      ? salvas.tabs.filter(tab => tab?.id && tab.title && tab.system && tab.url)
      : [];
    const activeTabId = tabs.some(tab => tab.id === salvas?.activeTabId)
      ? salvas!.activeTabId
      : null;

    return { tabs, activeTabId };
  }

  /**
   * Fecha todas as abas e limpa a sessão do Workspace.
   * Chamar no logout, para que o próximo login comece sem abas.
   */
  limparSessao(): void {
    this._tabs.set([]);
    this._activeTabId.set(null);
    this._loadingTabIds.set(new Set());
    this._reloadVersions.set({});
    this.session.limpar();
  }

  /**
   * Retorna a versão atual de reload de uma determinada aba.
   *
   * Enquanto essa versão permanecer igual, o IframeHost continua
   * reutilizando a mesma SafeResourceUrl e o iframe não é recarregado.
   */
  /** Verdadeiro enquanto o iframe da aba ainda não terminou de carregar. */
  isLoading(tabId: string): boolean {
    return this._loadingTabIds().has(tabId);
  }

  /** Chamado pelo IframeHost quando o iframe da aba termina de carregar. */
  markLoaded(tabId: string): void {
    this.setLoading(tabId, false);
  }

  private setLoading(tabId: string, loading: boolean): void {
    this._loadingTabIds.update(ids => {
      if (ids.has(tabId) === loading) {
        return ids;
      }

      const next = new Set(ids);
      loading ? next.add(tabId) : next.delete(tabId);
      return next;
    });
  }

  reloadVersion(tabId: string): number {
    return this._reloadVersions()[tabId] ?? 0;
  }

  /**
   * Abre uma nova aba no Workspace ou ativa uma aba que já esteja aberta.
   *
   * O identificador (`id`) da aba é utilizado para determinar se aquela
   * tela já existe na área de trabalho.
   *
   * Caso a aba ainda não exista:
   * 1. ela é adicionada ao final da coleção de abas abertas;
   * 2. passa a ser definida como a aba ativa.
   *
   * Caso a aba já exista:
   * - nenhuma nova aba é criada;
   * - a instância existente é preservada;
   * - ela apenas passa a ser a aba ativa.
   *
   * Essa regra evita que cliques repetidos no mesmo item de menu criem
   * diversas instâncias da mesma tela.
   *
   * Também é importante para os iframes: reutilizar a aba existente ajuda
   * a preservar o estado interno da aplicação embarcada, como rota atual,
   * filtros, formulários e demais informações da sessão.
   *
   * @param tab Definição da aba que deve ser aberta ou ativada.
   */
  openTab(tab: WorkspaceTab): void {
    const existingTab = this._tabs().find(item => item.id === tab.id);

    // Adiciona a aba somente quando ainda não existe uma instância aberta
    // com o mesmo identificador.
    if (!existingTab) {
      this.setLoading(tab.id, true);
      this._tabs.update(tabs => [...tabs, tab]);
    }

    // Independentemente de a aba ser nova ou existente, ela passa a ser
    // a aba atualmente selecionada pelo usuário.
    this._activeTabId.set(tab.id);
  }

  /**
   * Define uma aba existente como a aba atualmente ativa.
   *
   * Esse método é utilizado quando o usuário alterna entre as abas
   * já abertas no Workspace.
   *
   * A ativação não remove, recria ou recarrega as demais abas.
   * Ela apenas altera qual aba deve ser apresentada ao usuário.
   *
   * Essa característica é fundamental para manter os iframes vivos
   * enquanto o usuário navega entre diferentes telas.
   *
   * @param tabId Identificador da aba que deve ser ativada.
   */
  activateTab(tabId: string): void {
    const exists = this._tabs().some(tab => tab.id === tabId);

    if (!exists) {
      return;
    }

    this._activeTabId.set(tabId);
  }

  /**
   * Deixa nenhuma aba ativa, sem fechar as abas abertas.
   *
   * Usado ao selecionar uma aplicação com menu que ainda não tem abas: as
   * abas das outras aplicações continuam abertas (e seus iframes vivos), e
   * a área principal mostra o estado vazio até o usuário escolher uma tela.
   */
  clearActiveTab(): void {
    this._activeTabId.set(null);
  }

  /**
   * Solicita o recarregamento de uma aba aberta.
   *
   * A operação não fecha, recria ou altera a aba ativa.
   * Apenas incrementa sua versão de reload para que o IframeHost
   * recarregue o iframe correspondente.
   *
   * @param tabId Identificador da aba que deve ser recarregada.
   */
  reloadTab(tabId: string): void {
    const exists = this._tabs().some(tab => tab.id === tabId);

    if (!exists) {
      return;
    }

    this.setLoading(tabId, true);

    this._reloadVersions.update(versions => ({
      ...versions,
      [tabId]: (versions[tabId] ?? 0) + 1
    }));
  }

  /**
   * Fecha uma aba atualmente aberta no Workspace.
   *
   * Além de remover a aba da coleção, este método também é responsável
   * por determinar qual aba deverá ficar ativa caso a aba fechada seja
   * justamente aquela que o usuário estava visualizando.
   *
   * A estratégia utilizada é semelhante ao comportamento de navegadores:
   *
   * 1. tenta selecionar a aba que ocupou a mesma posição da aba removida;
   * 2. se não existir, seleciona a aba imediatamente anterior;
   * 3. se nenhuma aba permanecer aberta, define a aba ativa como `null`.
   *
   * Exemplo:
   *
   * Antes:
   *
   * [A] [B] [C]
   *      ↑ ativa
   *
   * Ao fechar B:
   *
   * [A] [C]
   *      ↑ C assume a mesma posição e torna-se ativa
   *
   * Outro exemplo:
   *
   * [A] [B] [C]
   *          ↑ ativa
   *
   * Ao fechar C:
   *
   * [A] [B]
   *      ↑ como não existe aba à direita, B torna-se ativa
   *
   * Caso uma aba que não esteja ativa seja fechada, a aba atualmente
   * selecionada permanece inalterada.
   *
   * @param tabId Identificador da aba que deve ser fechada.
   */
  closeTab(tabId: string): void {
    const currentTabs = this._tabs();

    // Localiza a posição atual da aba antes de removê-la.
    // Essa posição será utilizada posteriormente para escolher
    // qual aba deverá assumir o foco.
    const tabIndex = currentTabs.findIndex(tab => tab.id === tabId);

    // Caso o identificador não corresponda a nenhuma aba aberta,
    // nenhuma alteração de estado é necessária.
    if (tabIndex === -1) {
      return;
    }

    // Cria uma nova coleção sem a aba que está sendo fechada.
    const newTabs = currentTabs.filter(tab => tab.id !== tabId);

    this._tabs.set(newTabs);
    this.setLoading(tabId, false);

    this._reloadVersions.update(versions => {
      const { [tabId]: _, ...remainingVersions } = versions;

      return remainingVersions;
    });

    // Somente precisamos escolher outra aba ativa quando a aba
    // removida era justamente a aba que estava selecionada.
    if (this._activeTabId() === tabId) {

      /**
       * Após a remoção, primeiro tentamos utilizar o mesmo índice.
       *
       * Isso representa, na prática, a aba que estava à direita da
       * aba removida.
       *
       * Caso não exista uma aba nessa posição, utilizamos a aba
       * imediatamente anterior.
       */
      const nextTab =
        newTabs[tabIndex] ??
        newTabs[tabIndex - 1] ??
        null;

      this._activeTabId.set(nextTab?.id ?? null);
    }
  }
}