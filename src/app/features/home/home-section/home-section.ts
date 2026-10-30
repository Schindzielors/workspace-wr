import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Icon, IconName } from '../../../shared/icon/icon';

/**
 * Coluna da Home — Figma "Content Header Container".
 *
 * Cabeçalho (ícone, título, contador e descrição), conteúdo rolável
 * projetado via `<ng-content>` e, opcionalmente, um botão no rodapé.
 */
@Component({
  selector: 'app-home-section',
  imports: [Icon],
  templateUrl: './home-section.html',
  styleUrl: './home-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeSection {
  readonly icon = input.required<IconName>();
  readonly titulo = input.required<string>();
  readonly descricao = input.required<string>();

  /** Quantidade exibida no contador; `null` enquanto carrega. */
  readonly total = input<number | null>(null);

  /** Texto do botão do rodapé. Sem texto, o botão não aparece. */
  readonly acao = input<string>();

  /** Botão visível, mas ainda sem destino (padrão "em desenvolvimento"). */
  readonly acaoDesabilitada = input(false);

  /** Altura do degradê no fim da lista (o Figma usa 44px e 68px). */
  readonly fadeHeight = input(44);

  readonly acaoClicada = output<void>();

  /** No Figma: "0", "08", "12", "15". */
  protected readonly totalFormatado = computed(() => {
    const total = this.total();

    if (total === null) {
      return '';
    }

    return total === 0 ? '0' : total.toString().padStart(2, '0');
  });
}
