import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';

import { WorkspaceVisaoService } from '../../features/workspace/service/workspace-visao.service';
import { Icon } from '../../shared/icon/icon';
import { VisaoForm } from '../visao-form/visao-form';

/**
 * Painel "Trocar visão" (Figma "Home - Perfil empresa"), aberto pelo bloco
 * da empresa no header.
 *
 * Os campos (busca + Grupo > Empresa > Filial) ficam no `app-visao-form`,
 * compartilhado com o login. "Selecionar" grava na API e atualiza o header.
 * Esc ou clique fora fecha.
 */
@Component({
  selector: 'app-visao-picker',
  imports: [Icon, VisaoForm],
  templateUrl: './visao-picker.html',
  styleUrl: './visao-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'fechar.emit()'
  }
})
export class VisaoPicker {
  readonly visaoService = inject(WorkspaceVisaoService);

  readonly fechar = output<void>();

  /** Escolha em andamento (só vale depois de "Selecionar"). */
  readonly idGrupo = signal<string | null>(this.visaoService.atual()?.idGrupo ?? null);
  readonly idEmpresa = signal<string | null>(this.visaoService.atual()?.idEmpresa ?? null);
  readonly idFilial = signal<string | null>(this.visaoService.atual()?.idFilial ?? null);

  readonly salvando = signal(false);
  readonly erro = signal(false);

  constructor() {
    this.visaoService.carregar();
  }

  selecionar(): void {
    const idGrupo = this.idGrupo();

    if (!idGrupo || this.salvando()) {
      return;
    }

    this.salvando.set(true);
    this.erro.set(false);

    this.visaoService
      .selecionar({ idGrupo, idEmpresa: this.idEmpresa(), idFilial: this.idFilial() })
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.fechar.emit();
        },
        error: erro => {
          console.error('Visão: falha ao trocar.', erro);
          this.salvando.set(false);
          this.erro.set(true);
        }
      });
  }
}
