import { Injectable, computed, signal } from '@angular/core';
import { WorkspaceTab } from '../model/workspace-tab.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceTabsService {

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
  private readonly _tabs = signal<WorkspaceTab[]>([]);

  /**
   * Identificador da aba atualmente ativa/visível para o usuário.
   *
   * O valor será `null` quando nenhuma aba estiver aberta ou ativa.
   *
   * É armazenado separadamente da coleção de abas para evitar manter
   * duas representações completas do mesmo objeto no estado.
   */
  private readonly _activeTabId = signal<string | null>(null);

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