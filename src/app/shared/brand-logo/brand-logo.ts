import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logo da Datapar: símbolo + "datapar" (ou só o símbolo).
 *
 * PROVISÓRIO: o símbolo é um desenho aproximado e o nome é texto. Quando o
 * SVG oficial chegar, troque o conteúdo do template por ele; quem usa o
 * componente não muda.
 */
@Component({
  selector: 'app-brand-logo',
  template: `
    <svg class="logo__simbolo" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="5" width="17" height="22" rx="6" fill="none" stroke="#8ccaf0" stroke-width="2.2" />
      <rect x="7" y="5" width="17" height="22" rx="6" fill="none" stroke="#3f97d8" stroke-width="2.2" />
      <path d="M12.5 10h4.5a6 6 0 0 1 0 12h-4.5z" fill="none" stroke="#2163ad" stroke-width="2.4"
        stroke-linejoin="round" />
    </svg>
    @if (variante() === 'completo') {
      <span class="logo__nome">datapar</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: var(--color-brand-secondary-strong);
    }

    .logo__simbolo {
      width: var(--logo-size, 28px);
      height: var(--logo-size, 28px);
    }

    .logo__nome {
      font-family: var(--font-family-display);
      font-size: calc(var(--logo-size, 28px) * 0.9);
      font-weight: var(--font-weight-semibold);
      letter-spacing: -0.3px;
      line-height: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    'aria-label': 'Datapar'
  }
})
export class BrandLogo {
  readonly variante = input<'completo' | 'simbolo'>('completo');
}
