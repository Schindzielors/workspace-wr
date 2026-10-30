import { Component, inject, OnInit, signal } from '@angular/core';

import { ApplicationRail } from '../application-rail/application-rail';
import { ApplicationMenu } from '../application-menu/application-menu';
import { Tabs } from '../tabs/tabs';
import { Icon } from '../../shared/icon/icon';
import { Home, HomeTelaSolicitada } from '../../features/home/home';

import { IframeHost } from '../../features/workspace/iframe-host/iframe-host';
import { WorkspaceMenuService } from '../../features/workspace/service/workspace-menu.service';
import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';
import { buildScreenUrl } from '../../features/workspace/utils/workspace-url';

@Component({
  selector: 'app-workspace-shell',
  imports: [
    ApplicationRail,
    ApplicationMenu,
    Tabs,
    IframeHost,
    Icon,
    Home
  ],
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.scss'
})
export class WorkspaceShell implements OnInit {
  private readonly menuService = inject(WorkspaceMenuService);
  private readonly tabsService = inject(WorkspaceTabsService);

  readonly applications = signal<WorkspaceApplication[]>([]);
  readonly menuCollapsed = signal(false);

  /**
   * A Home é a primeira tela do Workspace. Enquanto ela está aberta, o menu
   * lateral e as abas ficam escondidos (sem perder o estado dos iframes).
   */
  readonly homeActive = signal(true);

  showHome(): void {
    this.homeActive.set(true);
  }

  /** Abre, a partir da Home, uma tela de uma aplicação em uma aba. */
  openFromHome(tela: HomeTelaSolicitada): void {
    const application = this.applications().find(
      item => item.system === tela.sistema
    );
    const url = application && buildScreenUrl(application.baseUrl, tela.rota);

    if (!application || !url) {
      console.warn('Tela da Home sem aplicação ou rota válida:', tela);
      return;
    }

    this.selectApplication(application.id);

    this.tabsService.openTab({
      id: tela.id,
      title: tela.titulo,
      system: application.system,
      url
    });
  }

  toggleMenu(): void {
    this.menuCollapsed.update(value => !value);
  }
  activeApplicationId?: string;

  get activeApplication(): WorkspaceApplication | undefined {
    return this.applications().find(
      application => application.id === this.activeApplicationId
    );
  }

  ngOnInit(): void {
    this.menuService.getApplications().subscribe(applications => {
      this.applications.set(applications);
    });
  }

  selectApplication(applicationId: string): void {
    console.log("applicationId", applicationId);
    this.activeApplicationId = applicationId;

    const application = this.applications().find(
      item => item.id === applicationId
    );

    if (!application) {
      return;
    }

    this.homeActive.set(false);

    // Os menus já carregados são mantidos ao voltar da Home.
    if (application.menus.length) {
      return;
    }

    this.menuService
      .getMenus(
        application.projeto,
        application.baseUrl,
        application.system
      )
      .subscribe(menus => {
        this.applications.update(applications =>
          applications.map(item =>
            item.id === application.id
              ? {
                ...item,
                menus
              }
              : item
          )
        );
      });
  }
}