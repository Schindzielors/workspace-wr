import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import { Icon } from '../icon/icon';

export interface SelectOption {
  value: string;
  label: string;
}

let proximoId = 0;

/**
 * Select com dropdown próprio (Figma "Trocar visão"): botão + lista.
 *
 * Teclado: Enter/Espaço/↓ abre, ↑↓ navega, Enter escolhe, Esc fecha.
 * Clique fora fecha. Esc com a lista aberta não fecha o painel em volta.
 */
@Component({
  selector: 'app-select',
  imports: [Icon],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousedown)': 'onDocumentMousedown($event)'
  }
})
export class Select {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input.required<string>();
  readonly placeholder = input('Selecione');
  readonly options = input.required<SelectOption[]>();
  readonly value = input<string | null>(null);
  readonly disabled = input(false);

  readonly valueChange = output<string>();

  readonly id = `select-${++proximoId}`;
  readonly aberto = signal(false);
  readonly indiceAtivo = signal(0);

  readonly selecionado = computed(
    () => this.options().find(option => option.value === this.value()) ?? null
  );

  alternar(): void {
    this.aberto() ? this.fechar() : this.abrir();
  }

  abrir(): void {
    if (this.disabled() || !this.options().length) {
      return;
    }

    const indice = this.options().findIndex(option => option.value === this.value());
    this.indiceAtivo.set(Math.max(indice, 0));
    this.aberto.set(true);
    this.rolarParaAtivo();
  }

  fechar(): void {
    this.aberto.set(false);
  }

  escolher(option: SelectOption): void {
    this.valueChange.emit(option.value);
    this.fechar();
    this.host.nativeElement.querySelector<HTMLButtonElement>('.select__trigger')?.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    const total = this.options().length;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();

        if (!this.aberto()) {
          this.abrir();
          return;
        }

        const passo = event.key === 'ArrowDown' ? 1 : -1;
        this.indiceAtivo.set((this.indiceAtivo() + passo + total) % total);
        this.rolarParaAtivo();
        break;
      }

      case 'Enter':
      case ' ':
        event.preventDefault();

        if (this.aberto()) {
          const option = this.options()[this.indiceAtivo()];
          option ? this.escolher(option) : this.fechar();
        } else {
          this.abrir();
        }
        break;

      case 'Escape':
        if (this.aberto()) {
          event.preventDefault();
          event.stopPropagation();
          this.fechar();
        }
        break;

      case 'Tab':
        this.fechar();
        break;
    }
  }

  onDocumentMousedown(event: MouseEvent): void {
    if (this.aberto() && !this.host.nativeElement.contains(event.target as Node)) {
      this.fechar();
    }
  }

  private rolarParaAtivo(): void {
    requestAnimationFrame(() => {
      this.host.nativeElement
        .querySelector(`#${this.id}-opcao-${this.indiceAtivo()}`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }
}
