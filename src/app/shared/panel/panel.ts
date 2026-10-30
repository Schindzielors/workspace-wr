import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';

import { Icon } from '../icon/icon';

let proximoId = 0;

/**
 * Painel flutuante abaixo do header (Figma "Configurações", "Notificações"):
 * fundo escurecido, título, subtítulo, botão fechar, conteúdo e rodapé
 * opcional (`<ng-content select="[panel-footer]">`).
 *
 * Esc ou clique fora fecham. O foco vai para o elemento com `data-autofocus`
 * (ou para o botão fechar).
 */
@Component({
  selector: 'app-panel',
  imports: [Icon],
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'fechar.emit()'
  }
})
export class Panel {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly align = input<'left' | 'right'>('right');

  readonly fechar = output<void>();

  readonly id = `panel-${++proximoId}`;

  constructor() {
    afterNextRender(() => {
      const foco =
        this.host.nativeElement.querySelector<HTMLElement>('[data-autofocus]') ??
        this.host.nativeElement.querySelector<HTMLElement>('.panel__close');

      foco?.focus();
    });
  }
}
