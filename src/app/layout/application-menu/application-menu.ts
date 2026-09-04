import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, Input } from '@angular/core';

import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { WorkspaceMenuItem } from '../../features/workspace/model/workspace-menu-item.model';
import { WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';

@Component({
  selector: 'app-application-menu',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './application-menu.html',
  styleUrl: './application-menu.scss'
})
export class ApplicationMenu {
  private readonly expandedItems = new Set<string>();

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

  isExpanded(item: WorkspaceMenuItem): boolean {
    return this.expandedItems.has(item.id);
  }

  toggleItem(item: WorkspaceMenuItem): void {
    if (!item.children?.length) {
      this.openMenuItem(item);
      return;
    }

    if (this.expandedItems.has(item.id)) {
      this.expandedItems.delete(item.id);
      return;
    }

    this.expandedItems.add(item.id);
  }
}