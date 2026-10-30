import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';

import { WorkspaceTab, WorkspaceTabGroup } from '../../features/workspace/model/workspace-tab.model';
import { WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';
import { Icon } from '../../shared/icon/icon';

/** Item da barra: uma aba sozinha ou duas abas unidas (tela dividida). */
interface ItemBarra {
  chave: string;
  abas: WorkspaceTab[];
  grupo: WorkspaceTabGroup | null;
  ativo: boolean;
}

@Component({
  selector: 'app-tabs',
  imports: [NgTemplateOutlet, Icon],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss'
})
export class Tabs {

  readonly tabsService = inject(WorkspaceTabsService);

  private readonly uniaoTrigger = viewChild<ElementRef<HTMLButtonElement>>('uniaoTrigger');

  /**
   * Itens da barra, na ordem das abas. Abas unidas viram um único chip, na
   * posição da primeira delas.
   */
  readonly itens = computed<ItemBarra[]>(() => {
    const visiveis = new Set(this.tabsService.visibleTabIds());
    const porId = new Map(this.tabsService.tabs().map(tab => [tab.id, tab]));
    const jaIncluidas = new Set<string>();
    const itens: ItemBarra[] = [];

    for (const tab of this.tabsService.tabs()) {
      if (jaIncluidas.has(tab.id)) {
        continue;
      }

      const grupo = this.tabsService.groupOf(tab.id) ?? null;
      const abas = grupo
        ? grupo.tabIds.map(id => porId.get(id)!).filter(Boolean)
        : [tab];

      // Mesma ordem da tela dividida: a que vem antes na barra fica à esquerda.
      abas.sort((a, b) => this.tabsService.tabs().indexOf(a) - this.tabsService.tabs().indexOf(b));
      abas.forEach(aba => jaIncluidas.add(aba.id));

      itens.push({
        chave: grupo?.id ?? tab.id,
        abas,
        grupo,
        ativo: abas.some(aba => visiveis.has(aba.id))
      });
    }

    return itens;
  });

  activate(tabId: string): void {
    this.tabsService.activateTab(tabId);
  }

  reload(event: MouseEvent, tabId: string): void {
    event.stopPropagation();

    this.tabsService.reloadTab(tabId);
  }

  close(event: MouseEvent, tabId: string): void {

    // Impede que o clique no botão de fechar seja propagado para o
    // elemento da aba e acabe acionando também o método `activate`.
    event.stopPropagation();
    this.tabsService.closeTab(tabId);
  }

  // ---------------------------------------------------------------------
  // Unir guias (Figma "WR união de guias")
  // ---------------------------------------------------------------------

  readonly uniaoAberta = signal(false);
  readonly posicaoUniao = signal({ top: 0, right: 0 });

  /** Ids escolhidos, na ordem em que foram marcados (máximo 2). */
  readonly selecionadas = signal<string[]>([]);

  /** Abas que podem ser unidas: as que ainda não estão em uma união. */
  readonly abasDisponiveis = computed(() =>
    this.tabsService.tabs().filter(tab => !this.tabsService.groupOf(tab.id))
  );

  /** União em que está a aba ativa (para oferecer "Separar guias"). */
  readonly grupoAtivo = computed(() => {
    const ativa = this.tabsService.activeTabId();
    return ativa ? this.tabsService.groupOf(ativa) ?? null : null;
  });

  readonly podeAbrirUniao = computed(() =>
    this.abasDisponiveis().length >= 2 || !!this.grupoAtivo()
  );

  alternarUniao(): void {
    this.uniaoAberta() ? this.fecharUniao() : this.abrirUniao();
  }

  abrirUniao(): void {
    // A barra de abas corta o que sai dela (overflow); o painel usa posição
    // fixa, calculada a partir do botão.
    const botao = this.uniaoTrigger()?.nativeElement.getBoundingClientRect();

    if (botao) {
      this.posicaoUniao.set({
        top: botao.bottom + 8,
        right: Math.max(window.innerWidth - botao.right, 12)
      });
    }

    this.selecionadas.set([]);
    this.uniaoAberta.set(true);

    requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>('.union [data-autofocus]')?.focus()
    );
  }

  fecharUniao(): void {
    this.uniaoAberta.set(false);
    this.uniaoTrigger()?.nativeElement.focus();
  }

  /** Marca/desmarca; ao marcar uma terceira, a mais antiga é desmarcada. */
  alternarSelecao(tabId: string): void {
    this.selecionadas.update(selecionadas =>
      selecionadas.includes(tabId)
        ? selecionadas.filter(id => id !== tabId)
        : [...selecionadas, tabId].slice(-2)
    );
  }

  unir(): void {
    const [primeira, segunda] = this.selecionadas();

    if (!primeira || !segunda) {
      return;
    }

    this.tabsService.uniteTabs(primeira, segunda);
    this.fecharUniao();
  }

  separar(groupId: string): void {
    this.tabsService.separateGroup(groupId);
    this.fecharUniao();
  }
}
