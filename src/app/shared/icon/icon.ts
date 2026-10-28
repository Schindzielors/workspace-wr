import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Ícones da biblioteca Phosphor (peso "regular"), a mesma usada no Figma.
 *
 * Os SVGs são copiados de `@phosphor-icons/core` para `/icons` no build
 * (ver `angular.json`). O ícone é aplicado como máscara CSS, então herda
 * a cor do texto (`currentColor`) e acompanha estados como ativo e hover.
 */
export type IconName =
  | 'caret-down'
  | 'caret-up-down'
  | 'house'
  | 'magnifying-glass'
  | 'map-trifold'
  | 'squares-four'
  | 'truck';

@Component({
  selector: 'app-icon',
  template: '',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.--icon-url]': 'url()',
    '[style.--icon-size.px]': 'size()'
  }
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);

  protected readonly url = computed(() => `url("icons/${this.name()}.svg")`);
}
