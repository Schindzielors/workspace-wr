import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, output, signal } from '@angular/core';

import { IDIOMAS } from '../../features/workspace/model/workspace-usuario.model';
import { iniciais, WorkspaceUsuarioService } from '../../features/workspace/service/workspace-usuario.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icon } from '../../shared/icon/icon';
import { Panel } from '../../shared/panel/panel';
import { Select } from '../../shared/select/select';

/** Tamanho máximo da foto (o mesmo validado pela API). */
const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024;

/**
 * Configurações do usuário (Figma): foto, nome e idioma.
 *
 * - O cargo é definido pelo administrador e não aparece aqui.
 * - "Salvar" só fica habilitado quando há alguma alteração.
 */
@Component({
  selector: 'app-user-settings',
  imports: [Panel, Avatar, Icon, Select],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSettings {
  private readonly usuarioService = inject(WorkspaceUsuarioService);

  readonly fechar = output<void>();

  readonly idiomas = IDIOMAS;

  private readonly perfil = this.usuarioService.perfil;

  readonly nome = signal(this.perfil()?.nome ?? '');
  readonly idioma = signal(this.perfil()?.idioma ?? 'pt-BR');

  /** Nova foto escolhida (ainda não enviada) e sua pré-visualização. */
  private readonly foto = signal<File | null>(null);
  readonly fotoPreview = signal<string | null>(null);

  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly iniciaisAtuais = computed(() => iniciais(this.nome()) || this.usuarioService.iniciais());
  readonly fotoExibida = computed(() => this.fotoPreview() ?? this.perfil()?.fotoUrl ?? null);

  readonly nomeInvalido = computed(() => !this.nome().trim());

  readonly alterado = computed(() => {
    const perfil = this.perfil();

    return !!perfil && (
      this.nome().trim() !== perfil.nome ||
      this.idioma() !== perfil.idioma ||
      !!this.foto()
    );
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.liberarPreview());
  }

  atualizarNome(event: Event): void {
    this.nome.set((event.target as HTMLInputElement).value);
    this.erro.set(null);
  }

  escolherFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith('image/')) {
      this.erro.set('Escolha uma imagem (PNG, JPG...).');
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      this.erro.set('A imagem deve ter no máximo 2 MB.');
      return;
    }

    this.liberarPreview();
    this.foto.set(arquivo);
    this.fotoPreview.set(URL.createObjectURL(arquivo));
    this.erro.set(null);
  }

  salvar(): void {
    if (!this.alterado() || this.nomeInvalido() || this.salvando()) {
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);

    this.usuarioService
      .salvarPerfil({ nome: this.nome().trim(), idioma: this.idioma() }, this.foto())
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.fechar.emit();
        },
        error: erro => {
          console.error('Configurações: falha ao salvar.', erro);
          this.salvando.set(false);
          this.erro.set('Não foi possível salvar. Tente novamente.');
        }
      });
  }

  private liberarPreview(): void {
    const preview = this.fotoPreview();

    if (preview) {
      URL.revokeObjectURL(preview);
    }
  }
}
