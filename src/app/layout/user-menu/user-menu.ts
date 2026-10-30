import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output
} from '@angular/core';

import { WorkspaceUsuarioService } from '../../features/workspace/service/workspace-usuario.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icon } from '../../shared/icon/icon';

export type UserMenuAcao = 'configuracoes' | 'notificacoes';

/**
 * Menu do usuário (Figma: clique no usuário do header): avatar, nome, e-mail,
 * Configurações, Notificações, Ajuda e Sair.
 *
 * Teclado: ↑↓ navega entre as opções, Esc fecha (foco volta ao header).
 */
@Component({
  selector: 'app-user-menu',
  imports: [Avatar, Icon],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'onKeydown($event)'
  }
})
export class UserMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly usuarioService = inject(WorkspaceUsuarioService);

  readonly escolhido = output<UserMenuAcao>();
  readonly fechar = output<void>();

  constructor() {
    afterNextRender(() => this.itens()[0]?.focus());
  }

  onKeydown(event: KeyboardEvent): void {
    const itens = this.itens();
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const passo = event.key === 'ArrowDown' ? 1 : -1;
      itens[(atual + passo + itens.length) % itens.length]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.fechar.emit();
    } else if (event.key === 'Tab') {
      this.fechar.emit();
    }
  }

  /** Opções habilitadas, na ordem da tela. */
  private itens(): HTMLButtonElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.user-menu__item:not(:disabled)')
    );
  }
}
