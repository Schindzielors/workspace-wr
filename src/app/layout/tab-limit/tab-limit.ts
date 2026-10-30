import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { MAX_ABAS, WorkspaceTabsService } from '../../features/workspace/service/workspace-tabs.service';
import { Panel } from '../../shared/panel/panel';

/**
 * "Limite de guias atingido" (Figma "WR limite de guias").
 *
 * Aparece quando o usuário tenta abrir a 11ª aba. Ele marca as abas que quer
 * fechar; "Selecionar" fecha as marcadas e abre a aba que ele havia pedido.
 * Fechar o modal desiste da nova aba.
 */
@Component({
  selector: 'app-tab-limit',
  imports: [Panel],
  templateUrl: './tab-limit.html',
  styleUrl: './tab-limit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabLimit {
  readonly tabsService = inject(WorkspaceTabsService);

  readonly limite = MAX_ABAS;
  readonly selecionadas = signal<ReadonlySet<string>>(new Set());

  alternar(tabId: string): void {
    this.selecionadas.update(atual => {
      const proximo = new Set(atual);
      proximo.has(tabId) ? proximo.delete(tabId) : proximo.add(tabId);
      return proximo;
    });
  }

  confirmar(): void {
    if (this.selecionadas().size) {
      this.tabsService.confirmLimit([...this.selecionadas()]);
    }
  }

  cancelar(): void {
    this.tabsService.cancelLimit();
  }
}
