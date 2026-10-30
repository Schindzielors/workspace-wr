import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Avatar do usuário: foto, ou as iniciais em `brand secondary/light`
 * (Figma "Avatar / Text").
 */
@Component({
  selector: 'app-avatar',
  template: `
    @if (fotoUrl()) {
      <img [src]="fotoUrl()" alt="" />
    } @else {
      <span>{{ iniciais() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: var(--avatar-size);
      height: var(--avatar-size);
      overflow: hidden;
      border-radius: 8px;
      background: var(--header-avatar-bg);
      color: var(--header-avatar-text);
      font-size: calc(var(--avatar-size) * 0.4);
      font-weight: var(--font-weight-medium);
      line-height: 1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.--avatar-size.px]': 'size()'
  }
})
export class Avatar {
  readonly iniciais = input('');
  readonly fotoUrl = input<string | null | undefined>(null);
  readonly size = input(40);
}
