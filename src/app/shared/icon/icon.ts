import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Ícones da biblioteca Phosphor (peso "regular"), a mesma usada no Figma.
 *
 * Os SVGs ficam em `public/icons` (licença MIT da Phosphor ao lado). Para
 * adicionar um ícone, copie o SVG e inclua o nome no tipo abaixo:
 *   cp node_modules/@phosphor-icons/core/assets/regular/<nome>.svg public/icons/
 * Ícones preenchidos vêm da pasta `fill` (ex.: star-fill.svg).
 *
 * O ícone é aplicado como máscara CSS, então herda a cor do texto
 * (`currentColor`) e acompanha estados como ativo e hover.
 */
export type IconName =
  | 'arrow-elbow-down-left'
  | 'arrows-down-up'
  | 'bell'
  | 'camera'
  | 'caret-double-left'
  | 'caret-double-right'
  | 'caret-down'
  | 'caret-up'
  | 'caret-up-down'
  | 'folder-open'
  | 'gear'
  | 'grid-nine'
  | 'house'
  | 'list'
  | 'magnifying-glass'
  | 'map-trifold'
  | 'question'
  | 'sign-out'
  | 'squares-four'
  | 'star'
  | 'star-fill'
  | 'truck'
  | 'usb'
  | 'x';

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
