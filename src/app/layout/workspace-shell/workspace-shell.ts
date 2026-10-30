import { Component, computed, effect, ElementRef, inject, OnInit, signal, untracked, viewChild } from '@angular/core';

import { ApplicationRail } from '../application-rail/application-rail';
import { ApplicationMenu } from '../application-menu/application-menu';
import { Tabs } from '../tabs/tabs';
import { Icon } from '../../shared/icon/icon';
import { Home, HomeTelaSolicitada } from '../../features/home/home';
import { CommandPalette } from '../command-palette/command-palette';
import { VisaoPicker } from '../visao-picker/visao-picker';
import { UserMenu, UserMenuAcao } from '../user-menu/user-menu';
import { UserSettings } from '../user-settings/user-settings';
import { UserNotifications } from '../user-notifications/user-notifications';
import { WorkspaceUsuarioService } from '../../features/workspace/service/workspace-usuario.service';
import { Avatar } from '../../shared/avatar/avatar';
import { WorkspaceVisaoService } from '../../features/workspace/service/workspace-visao.service';
import { PaletteAcao } from '../command-palette/command-palette.model';

import { IframeHost } from '../../features/workspace/iframe-host/iframe-host';
import { WorkspaceMenuService } from '../../features/workspace/service/workspace-menu.service';
import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';
import { WorkspaceSessionService } from '../../features/workspace/service/workspace-session.service';
import { buildScreenUrl } from '../../features/workspace/utils/workspace-url';

@Component({
  selector: 'app-workspace-shell',
  imports: [
    ApplicationRail,
    ApplicationMenu,
    Tabs,
    IframeHost,
    Icon,
    Home,
    CommandPalette,
    VisaoPicker,
    UserMenu,
    UserSettings,
    UserNotifications,
    Avatar
  ],
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.scss',
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)'
  }
})
export class WorkspaceShell implements OnInit {
  private readonly menuService = inject(WorkspaceMenuService);
  private readonly tabsService = inject(WorkspaceTabsService);
  private readonly session = inject(WorkspaceSessionService);

  readonly applications = signal<WorkspaceApplication[]>([]);
  readonly menuCollapsed = signal(false);

  /**
   * A Home é a primeira tela do Workspace. Enquanto ela está aberta, o menu
   * lateral e as abas ficam escondidos (sem perder o estado dos iframes).
   */
  readonly homeActive = signal(this.restoreHome());

  /** Aplicação selecionada na navegação do header. */
  readonly activeApplicationId = signal<string | undefined>(undefined);

  readonly activeApplication = computed(() =>
    this.applications().find(
      application => application.id === this.activeApplicationId()
    )
  );

  /** Aplicações sem menu (ex.: Rodopar) ocupam a área toda, sem menu lateral. */
  readonly showSideMenu = computed(() =>
    this.activeApplication()?.possuiMenu ?? true
  );

  /** Última aba ativa de cada aplicação, para voltar a ela ao reselecionar. */
  private readonly lastTabBySystem = new Map<string, string>();

  constructor() {
    /**
     * Mantém a aplicação selecionada em sincronia com a aba ativa.
     *
     * As abas são compartilhadas entre as aplicações. Ao clicar na aba do
     * Rodopar estando no WR (ou ao fechar uma aba e outra assumir), a
     * aplicação da aba passa a ser a selecionada, e o menu lateral acompanha.
     */
    effect(() => {
      const tab = this.tabsService.activeTab();
      // Também reage à chegada das aplicações: ao recarregar a página, a aba
      // restaurada da sessão existe antes de /Projetos responder.
      const applications = this.applications();

      if (!tab) {
        return;
      }

      this.lastTabBySystem.set(tab.system, tab.id);

      untracked(() => {
        const application = applications.find(item => item.system === tab.system);

        if (application && application.id !== this.activeApplicationId()) {
          this.activeApplicationId.set(application.id);
          this.loadMenus(application);
        }
      });
    });

    /** Lembra na sessão se o usuário estava na Home (restaurado no F5). */
    effect(() => this.session.salvar('home', this.homeActive()));
  }

  // ---------------------------------------------------------------------
  // Busca global (CommandPalette)
  // ---------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // Trocar visão (grupo / empresa / filial)
  // ---------------------------------------------------------------------

  readonly visaoService = inject(WorkspaceVisaoService);
  readonly visaoOpen = signal(false);
  private readonly visaoTrigger = viewChild<ElementRef<HTMLButtonElement>>('visaoTrigger');

  openVisao(): void {
    this.paletteOpen.set(false);
    this.userPanel.set(null);
    this.visaoOpen.set(true);
  }

  closeVisao(): void {
    this.visaoOpen.set(false);
    this.visaoTrigger()?.nativeElement.focus();
  }

  // ---------------------------------------------------------------------
  // Menu do usuário, Configurações e Notificações
  // ---------------------------------------------------------------------

  readonly usuarioService = inject(WorkspaceUsuarioService);
  readonly userPanel = signal<'menu' | UserMenuAcao | null>(null);
  private readonly userTrigger = viewChild<ElementRef<HTMLButtonElement>>('userTrigger');

  toggleUserMenu(): void {
    this.userPanel.set(this.userPanel() === 'menu' ? null : 'menu');
  }

  openUserPanel(painel: UserMenuAcao): void {
    this.userPanel.set(painel);
  }

  closeUserPanel(): void {
    this.userPanel.set(null);
    this.userTrigger()?.nativeElement.focus();
  }

  readonly paletteOpen = signal(false);
  private readonly searchTrigger = viewChild<ElementRef<HTMLButtonElement>>('searchTrigger');

  /** Ctrl+K / ⌘K abre (ou fecha) a busca de qualquer lugar do Workspace. */
  onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.paletteOpen() ? this.closePalette() : this.openPalette();
    }
  }

  openPalette(): void {
    // A busca procura nas telas do menu: carrega o menu das aplicações que
    // ainda não foram abertas.
    this.applications().forEach(application => this.loadMenus(application));
    this.visaoOpen.set(false);
    this.userPanel.set(null);
    this.paletteOpen.set(true);
  }

  closePalette(): void {
    this.paletteOpen.set(false);
    this.searchTrigger()?.nativeElement.focus();
  }

  runPaletteAction(acao: PaletteAcao): void {
    this.paletteOpen.set(false);

    if (acao.tipo === 'aplicacao') {
      this.selectApplication(acao.applicationId);
      return;
    }

    if (acao.tipo !== 'tela') {
      return;
    }

    const application = this.applications().find(item => item.system === acao.sistema);

    if (!application) {
      return;
    }

    this.selectApplication(application.id);
    this.tabsService.openTab({
      id: acao.id,
      title: acao.titulo,
      system: application.system,
      url: acao.url
    });
  }

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

  ngOnInit(): void {
    this.visaoService.carregar();
    this.usuarioService.carregar();

    this.menuService.getApplications().subscribe(applications => {
      this.applications.set(applications);
    });
  }

  selectApplication(applicationId: string): void {
    const application = this.applications().find(
      item => item.id === applicationId
    );

    if (!application) {
      return;
    }

    this.homeActive.set(false);
    this.activeApplicationId.set(application.id);

    // Sem menu (ex.: Rodopar): abre a própria aplicação em uma aba.
    // Se a aba já existir, apenas volta para ela (o iframe é preservado).
    if (!application.possuiMenu) {
      this.tabsService.openTab({
        id: `aplicacao-${application.system}`,
        title: application.title,
        system: application.system,
        url: application.baseUrl
      });
      return;
    }

    // Com menu (ex.: WR): volta para a última aba da aplicação, se houver;
    // senão, a área principal mostra o estado vazio até escolher uma tela.
    this.activateLastTabOf(application);

    this.loadMenus(application);
  }

  /**
   * Home ao abrir o Workspace; ao recarregar (F5), volta para onde estava.
   * Sem aba ativa para restaurar, abre a Home.
   */
  private restoreHome(): boolean {
    const estavaNaHome = this.session.ler<boolean>('home') ?? true;

    return estavaNaHome || !this.tabsService.activeTab();
  }

  /** Aplicações com menu sendo carregado (evita chamadas duplicadas). */
  private readonly loadingMenus = new Set<string>();

  /** Carrega o menu lateral da aplicação (uma vez; mantido ao voltar da Home). */
  private loadMenus(application: WorkspaceApplication): void {
    if (!application.possuiMenu || application.menus.length || this.loadingMenus.has(application.id)) {
      return;
    }

    this.loadingMenus.add(application.id);

    this.menuService
      .getMenus(
        application.projeto,
        application.baseUrl,
        application.system
      )
      .subscribe({
        complete: () => this.loadingMenus.delete(application.id),
        error: () => this.loadingMenus.delete(application.id),
        next: menus => this.applications.update(applications =>
          applications.map(item =>
            item.id === application.id
              ? {
                ...item,
                menus
              }
              : item
          )
        )
      });
  }

  private activateLastTabOf(application: WorkspaceApplication): void {
    const tabs = this.tabsService.tabs();

    if (this.tabsService.activeTab()?.system === application.system) {
      return;
    }

    const lastTabId = this.lastTabBySystem.get(application.system);
    const lastTab =
      tabs.find(tab => tab.id === lastTabId) ??
      [...tabs].reverse().find(tab => tab.system === application.system);

    if (lastTab) {
      this.tabsService.activateTab(lastTab.id);
    } else {
      this.tabsService.clearActiveTab();
    }
  }
}
