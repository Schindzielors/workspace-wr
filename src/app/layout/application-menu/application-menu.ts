import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, Input, output, signal } from '@angular/core';

import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { WorkspaceMenuItem } from '../../features/workspace/model/workspace-menu-item.model';
import { WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';
import { Icon, IconName } from '../../shared/icon/icon';
import { applicationIcon } from '../../shared/icon/application-icon';

@Component({
  selector: 'app-application-menu',
  imports: [NgTemplateOutlet, Icon],
  templateUrl: './application-menu.html',
  styleUrl: './application-menu.scss'
})
export class ApplicationMenu {
  private readonly expandedItems = new Set<string>();
  private readonly tabsService = inject(WorkspaceTabsService);

  readonly searchTerm = signal('');
  readonly systemSectionOpen = signal(true);
  readonly collapseRequested = output<void>();

  @Input() application?: WorkspaceApplication;

  get applicationIconName(): IconName {
    return this.application ? applicationIcon(this.application) : 'squares-four';
  }

  toggleSystemSection(): void {
    this.systemSectionOpen.update(open => !open);
  }

  /** Pasta aberta pelo usuário, ou aberta automaticamente durante a busca. */
  isOpen(item: WorkspaceMenuItem): boolean {
    return this.isExpanded(item) || !!this.searchTerm();
  }

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value.trim().toLocaleLowerCase());
  }

  matchesSearch(item: WorkspaceMenuItem): boolean {
    const query = this.searchTerm();
    if (!query) {
      return true;
    }

    return item.title.toLocaleLowerCase().includes(query)
      || !!item.children?.some(child => this.matchesSearch(child));
  }

  isActive(item: WorkspaceMenuItem): boolean {
    const activeTab = this.tabsService.activeTab();
    if (!activeTab || !this.application) {
      return false;
    }

    return activeTab.id === item.id
      && activeTab.system === this.application.system;
  }

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
