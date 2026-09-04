import { Component, inject, Input } from '@angular/core';

import { WorkspaceMenuItem } from '../../features/workspace/model/workspace-menu-item.model';
import { WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';
import { WorkspaceMenuService } from '../../features/workspace/service/workspace-menu.service';
import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';

@Component({
  selector: 'app-application-menu',
  imports: [],
  templateUrl: './application-menu.html',
  styleUrl: './application-menu.scss'
})
export class ApplicationMenu {

  /**
   * Serviço responsável pelo gerenciamento das abas do Workspace.
   *
   * O menu da aplicação utiliza este serviço para solicitar a abertura
   * das telas selecionadas pelo usuário. As regras relacionadas à criação,
   * reutilização e ativação das abas permanecem centralizadas no
   * WorkspaceTabsService.
   */
  private readonly tabsService = inject(WorkspaceTabsService);

  @Input() application?: WorkspaceApplication;

  // /**
  //  * Serviço responsável por fornecer as aplicações e menus
  //  * disponíveis no Workspace.
  //  */
  // private readonly menuService = inject(WorkspaceMenuService);

  // /**
  //  * Aplicações disponíveis para exibição no menu.
  //  */
  // readonly applications = this.menuService.getApplications();

  /**
   * Solicita a abertura da tela associada ao item selecionado.
   *
   * Itens utilizados apenas como agrupadores não possuem system
   * e url e, portanto, não geram uma nova aba.
   */
  openMenuItem(item: WorkspaceMenuItem): void {
    if (!item.system || !item.url) {
      return;
    }

    this.tabsService.openTab({
      id: item.id,
      title: item.title,
      system: item.system,
      url: item.url
    });
  }

}