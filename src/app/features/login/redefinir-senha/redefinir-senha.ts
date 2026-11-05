import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { Icon } from '../../../shared/icon/icon';

/**
 * Modal "Esqueci minha senha", em duas etapas:
 * 1. "Redefinir senha": e-mail ou login + Enviar;
 * 2. "Solicitação enviada": confirmação + Fechar.
 *
 * A confirmação aparece mesmo se o login não existir (a API sempre
 * responde 204), para não revelar quais usuários existem.
 */
@Component({
  selector: 'app-redefinir-senha',
  imports: [Icon],
  templateUrl: './redefinir-senha.html',
  styleUrl: './redefinir-senha.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'fechar.emit()'
  }
})
export class RedefinirSenha {
  private readonly auth = inject(AuthService);

  /** Login já digitado na tela de entrar (vem preenchido). */
  readonly loginInicial = input('');
  readonly fechar = output<void>();

  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');
  private readonly botaoFechar = viewChild<ElementRef<HTMLButtonElement>>('botaoFechar');

  readonly valor = signal('');
  readonly enviando = signal(false);
  readonly enviado = signal(false);
  readonly erro = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      this.valor.set(this.loginInicial());
      this.campo()?.nativeElement.focus();
    });
  }

  enviar(event: Event): void {
    event.preventDefault();

    if (!this.valor().trim() || this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    this.auth.solicitarRedefinicao(this.valor()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
        requestAnimationFrame(() => this.botaoFechar()?.nativeElement.focus());
      },
      error: (erro: Error) => {
        this.enviando.set(false);
        this.erro.set(erro.message);
      }
    });
  }
}
