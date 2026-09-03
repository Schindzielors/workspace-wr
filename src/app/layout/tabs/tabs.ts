import { Component, inject } from '@angular/core';
import { WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';

@Component({
  selector: 'app-tabs',
  imports: [],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss'
})
export class Tabs {

  /**
   * Serviço responsável pelo gerenciamento centralizado das abas
   * abertas no Workspace.
   *
   * Este componente utiliza o serviço tanto para consultar o estado
   * atual das abas no template quanto para executar ações solicitadas
   * pelo usuário, como:
   * - ativar uma aba;
   * - fechar uma aba.
   *
   * O componente não mantém uma cópia própria da lista de abas.
   * Dessa forma, existe uma única fonte de verdade para o estado
   * das abas: o WorkspaceTabsService.
   */
  readonly tabsService = inject(WorkspaceTabsService);

  /**
   * Ativa uma aba existente no Workspace.
   *
   * Este método é chamado quando o usuário clica em uma das abas
   * exibidas na barra de navegação.
   *
   * A responsabilidade real de alterar o estado da aba ativa permanece
   * no WorkspaceTabsService. O componente atua apenas como intermediário
   * entre a interação da interface e o serviço de gerenciamento.
   *
   * A ativação de uma aba não recria nem recarrega seu iframe.
   * Ela apenas altera qual aba deve ser considerada ativa e, portanto,
   * qual conteúdo deve ser apresentado ao usuário.
   *
   * @param tabId Identificador único da aba que deve ser ativada.
   */
  activate(tabId: string): void {
    this.tabsService.activateTab(tabId);
  }

  /**
   * Fecha uma aba aberta no Workspace.
   *
   * Este método é chamado pelo botão/ícone de fechamento (`×`)
   * existente dentro de cada aba.
   *
   * Como o botão de fechar está localizado dentro do elemento clicável
   * da própria aba, o evento de clique poderia continuar propagando até
   * o elemento pai e também executar a ação de ativação da aba.
   *
   * Por esse motivo, `event.stopPropagation()` é chamado antes do
   * fechamento. Isso impede que o clique utilizado para fechar a aba
   * seja interpretado também como um clique para ativá-la.
   *
   * Após interromper a propagação do evento, o fechamento é delegado ao
   * WorkspaceTabsService, que fica responsável por:
   * - remover a aba da coleção;
   * - manter ou redefinir a aba ativa;
   * - selecionar a próxima aba quando necessário.
   *
   * O componente Tabs não implementa essas regras diretamente, mantendo
   * a lógica de gerenciamento centralizada no serviço.
   *
   * @param event Evento de clique disparado pelo botão de fechamento.
   *              É utilizado para interromper a propagação do clique.
   *
   * @param tabId Identificador único da aba que deve ser fechada.
   */
  close(event: MouseEvent, tabId: string): void {

    // Impede que o clique no botão de fechar seja propagado para o
    // elemento da aba e acabe acionando também o método `activate`.
    event.stopPropagation();

    this.tabsService.closeTab(tabId);
  }
}