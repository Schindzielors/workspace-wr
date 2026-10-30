import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';

import { WorkspaceNotificacao } from '../../features/workspace/model/workspace-usuario.model';
import { WorkspaceUsuarioService } from '../../features/workspace/service/workspace-usuario.service';
import { Panel } from '../../shared/panel/panel';
import { Toggle } from '../../shared/toggle/toggle';

/**
 * Notificações (Figma): liga/desliga cada tipo de mensagem. Cada toggle salva
 * na hora; se a API falhar, volta ao estado anterior e avisa.
 *
 * A lista tem rolagem própria, pensada para muitos tipos de notificação.
 */
@Component({
  selector: 'app-user-notifications',
  imports: [Panel, Toggle],
  templateUrl: './user-notifications.html',
  styleUrl: './user-notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserNotifications {
  readonly usuarioService = inject(WorkspaceUsuarioService);

  readonly fechar = output<void>();

  /** Mensagem de falha ao salvar um toggle. */
  readonly erroSalvar = signal<string | null>(null);

  constructor() {
    this.usuarioService.carregarNotificacoes();
  }

  alterar(notificacao: WorkspaceNotificacao, ativo: boolean): void {
    this.erroSalvar.set(null);

    this.usuarioService.alterarNotificacao(notificacao.id, ativo).subscribe({
      error: erro => {
        console.error('Notificações: falha ao salvar.', erro);
        this.erroSalvar.set(`Não foi possível salvar "${notificacao.titulo}". Tente novamente.`);
      }
    });
  }
}
