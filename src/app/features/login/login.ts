import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { avaliarSenha } from '../../core/auth/senha-criterios';
import { VisaoForm } from '../../layout/visao-form/visao-form';
import { BrandLogo } from '../../shared/brand-logo/brand-logo';
import { Icon } from '../../shared/icon/icon';
import { WorkspaceVisaoService } from '../workspace/service/workspace-visao.service';
import { LoginShowcase } from './login-showcase/login-showcase';
import { RedefinirSenha } from './redefinir-senha/redefinir-senha';

type Etapa = 'entrar' | 'nova-senha' | 'visao';

/**
 * Tela de login (prints do layout; o Figma ainda não foi liberado).
 *
 * Etapas, sempre à esquerda do painel azul:
 * 1. Entrar: login + senha ("Esqueci minha senha" abre o modal);
 * 2. Defina sua nova senha: só quando a senha é temporária;
 * 3. Selecione por onde você quer começar: grupo / empresa / filial. Se o
 *    usuário só tiver uma opção, a etapa é pulada.
 */
@Component({
  selector: 'app-login',
  imports: [BrandLogo, Icon, LoginShowcase, RedefinirSenha, VisaoForm],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly visaoService = inject(WorkspaceVisaoService);

  readonly versao = environment.version;
  readonly ano = new Date().getFullYear();

  readonly etapa = signal<Etapa>('entrar');
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly redefinirAberto = signal(false);

  // Entrar
  readonly login = signal('');
  readonly senha = signal('');
  readonly mostrarSenha = signal(false);

  // Nova senha
  private tokenTemporario = '';
  readonly novaSenha = signal('');
  readonly confirmacao = signal('');
  readonly mostrarNovaSenha = signal(false);
  readonly mostrarConfirmacao = signal(false);
  readonly criterios = computed(() => avaliarSenha(this.novaSenha(), this.confirmacao()));
  readonly senhaValida = computed(() => this.criterios().every(criterio => criterio.ok));

  /** Critérios ficam neutros até o usuário começar a digitar. */
  readonly avaliandoSenha = computed(() => !!this.novaSenha() || !!this.confirmacao());

  // Visão
  readonly idGrupo = signal<string | null>(null);
  readonly idEmpresa = signal<string | null>(null);
  readonly idFilial = signal<string | null>(null);
  readonly visaoCarregada = computed(
    () => this.visaoService.estrutura().length > 0 && this.visaoService.atual() !== null
  );

  constructor() {
    // Ao chegar na etapa de visão: preenche com a última visão usada e pula
    // a etapa quando só existe um caminho possível.
    effect(() => {
      if (this.etapa() !== 'visao' || !this.visaoCarregada()) {
        return;
      }

      untracked(() => {
        const atual = this.visaoService.atual()!;
        this.idGrupo.set(atual.idGrupo);
        this.idEmpresa.set(atual.idEmpresa);
        this.idFilial.set(atual.idFilial);

        if (this.unicaOpcao()) {
          this.confirmarVisao();
        }
      });
    });
  }

  // ---------------------------------------------------------------------
  // Etapa 1: Entrar
  // ---------------------------------------------------------------------

  entrar(event: Event): void {
    event.preventDefault();

    if (this.enviando()) {
      return;
    }

    if (!this.login().trim() || !this.senha()) {
      this.erro.set('Informe seu login e sua senha.');
      return;
    }

    this.iniciarEnvio();

    this.auth.entrar(this.login(), this.senha()).subscribe({
      next: resultado => {
        this.enviando.set(false);
        this.senha.set('');

        if (resultado.tipo === 'senha-temporaria') {
          this.tokenTemporario = resultado.tokenTemporario;
          this.etapa.set('nova-senha');
          this.focar('nova-senha');
        } else {
          this.irParaVisao();
        }
      },
      error: (erro: Error) => this.falhar(erro)
    });
  }

  // ---------------------------------------------------------------------
  // Etapa 2: Nova senha
  // ---------------------------------------------------------------------

  salvarNovaSenha(event: Event): void {
    event.preventDefault();

    if (this.enviando() || !this.senhaValida()) {
      return;
    }

    this.iniciarEnvio();

    this.auth.definirNovaSenha(this.tokenTemporario, this.novaSenha()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.novaSenha.set('');
        this.confirmacao.set('');
        this.irParaVisao();
      },
      error: (erro: Error) => this.falhar(erro)
    });
  }

  // ---------------------------------------------------------------------
  // Etapa 3: Visão
  // ---------------------------------------------------------------------

  confirmarVisao(event?: Event): void {
    event?.preventDefault();
    const idGrupo = this.idGrupo();

    if (this.enviando()) {
      return;
    }

    // Sem visão (API falhou): entra mesmo assim, com a última visão salva.
    if (!idGrupo) {
      this.abrirWorkspace();
      return;
    }

    this.iniciarEnvio();

    this.visaoService
      .selecionar({ idGrupo, idEmpresa: this.idEmpresa(), idFilial: this.idFilial() })
      .subscribe({
        next: () => this.abrirWorkspace(),
        error: () => this.falhar(new Error('Não foi possível salvar a visão. Tente novamente.'))
      });
  }

  // ---------------------------------------------------------------------

  private irParaVisao(): void {
    this.visaoService.carregar();
    this.etapa.set('visao');
  }

  /** Um grupo, com uma empresa, com uma filial (ou nenhuma). */
  private unicaOpcao(): boolean {
    const grupos = this.visaoService.filhos(null, 'grupo');
    const empresas = grupos.length === 1 ? this.visaoService.filhos(grupos[0].id, 'empresa') : [];
    const filiais = empresas.length === 1 ? this.visaoService.filhos(empresas[0].id, 'filial') : [];

    return grupos.length === 1 && empresas.length <= 1 && filiais.length <= 1;
  }

  private abrirWorkspace(): void {
    this.router.navigateByUrl('/');
  }

  private iniciarEnvio(): void {
    this.enviando.set(true);
    this.erro.set(null);
  }

  private falhar(erro: Error): void {
    this.enviando.set(false);
    this.erro.set(erro.message);
  }

  private focar(id: string): void {
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  }
}
