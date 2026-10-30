import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Interruptor liga/desliga (Figma "Notificações"). `role="switch"`. */
@Component({
  selector: 'app-toggle',
  template: `
    <button type="button" class="toggle" role="switch"
      [attr.aria-checked]="checked()" [attr.aria-label]="label()"
      [disabled]="disabled()" (click)="checkedChange.emit(!checked())">
      <span class="toggle__thumb"></span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .toggle {
      position: relative;
      width: 36px;
      height: 20px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: var(--color-neutral-light);
      cursor: pointer;
      transition: background 150ms ease;
    }

    .toggle[aria-checked='true'] {
      background: var(--color-brand-secondary-base);
    }

    .toggle__thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(3, 7, 18, 0.2);
      transition: transform 150ms ease;
    }

    .toggle[aria-checked='true'] .toggle__thumb {
      transform: translateX(16px);
    }

    .toggle:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle:focus-visible {
      outline: 2px solid var(--color-feedback-info-strong);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .toggle,
      .toggle__thumb {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Toggle {
  readonly checked = input(false);
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly checkedChange = output<boolean>();
}
