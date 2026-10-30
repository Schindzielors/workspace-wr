import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, output, signal } from '@angular/core';

import { Icon } from '../../shared/icon/icon';
import { environment } from '../../../environments/environment';
import { HomeSection } from './home-section/home-section';
import { HomeService } from './service/home.service';
import { WorkspaceFavorito } from '../workspace/model/workspace-favorito.model';
import { WorkspaceFavoritosService } from '../workspace/service/workspace-favoritos.service';
import { WorkspaceUsuarioService } from '../workspace/service/workspace-usuario.service';
import {
  HomeConector,
  HomeConectorStatus,
  HomePainel,
  HomeUsuario
} from './model/home.model';

/** Tela que a Home pede para o Workspace abrir em uma aba. */
export interface HomeTelaSolicitada {
  id: string;
  titulo: string;
  sistema: string;
  rota: string;
}

/**
 * Home do Workspace — Figma "Home - Completa" (2725:28125).
 *
 * Primeira tela ao abrir o Workspace e destino do botão "Início".
 * Ocupa a área abaixo do header, sem menu lateral e sem abas.
 */
@Component({
  selector: 'app-home',
  imports: [Icon, HomeSection, CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private readonly homeService = inject(HomeService);
  private readonly favoritosService = inject(WorkspaceFavoritosService);
  private readonly usuarioService = inject(WorkspaceUsuarioService);

  /** Pede ao Workspace para abrir uma tela (favorito ou painel). */
  readonly telaSolicitada = output<HomeTelaSolicitada>();

  /** `null` enquanto carrega. */
  /** Saudação com o primeiro nome do perfil (muda ao salvar em Configurações). */
  readonly usuario = computed<HomeUsuario | null>(() =>
    this.usuarioService.perfil() ? { nome: this.usuarioService.primeiroNome() } : null
  );
  /** Compartilhados com o menu lateral (favoritar no menu atualiza aqui). */
  readonly favoritos = this.favoritosService.favoritos;
  readonly erroFavoritos = this.favoritosService.erro;
  readonly conectores = signal<HomeConector[] | null>(null);
  readonly paineis = signal<HomePainel[] | null>(null);

  readonly versao = environment.version;

  protected readonly statusLabel: Record<HomeConectorStatus, string> = {
    'ativo': 'Ativo',
    'em-analise': 'Em análise',
    'inativo': 'Inativo',
    'aguardando-configuracao': 'Aguardando configuração'
  };

  /** Colunas cuja chamada à API falhou. */
  readonly erros = signal<Partial<Record<'conectores' | 'paineis', boolean>>>({});

  ngOnInit(): void {
    this.usuarioService.carregar();

    this.favoritosService.carregar();

    this.homeService.carregarConectores().subscribe({
      next: conectores => this.conectores.set(conectores),
      error: erro => this.marcarErro('conectores', erro)
    });

    this.homeService.carregarPaineis().subscribe({
      next: paineis => this.paineis.set(paineis),
      error: erro => this.marcarErro('paineis', erro)
    });
  }

  private marcarErro(coluna: 'conectores' | 'paineis', erro: unknown): void {
    console.error(`Home: falha ao carregar ${coluna}.`, erro);
    this.erros.update(erros => ({ ...erros, [coluna]: true }));
  }

  abrirFavorito(favorito: WorkspaceFavorito): void {
    this.telaSolicitada.emit({
      // Mesmo id da aba aberta pelo menu: não duplica a tela.
      id: favorito.idMenu,
      titulo: favorito.titulo,
      sistema: favorito.sistema,
      rota: favorito.rota
    });
  }

  /** Arrastar e soltar pela alça (ícone de lista) reordena os favoritos. */
  reordenarFavoritos(evento: CdkDragDrop<WorkspaceFavorito[]>): void {
    const favoritos = this.favoritos();

    if (!favoritos || evento.previousIndex === evento.currentIndex) {
      return;
    }

    const novaOrdem = [...favoritos];
    moveItemInArray(novaOrdem, evento.previousIndex, evento.currentIndex);
    this.favoritosService.reordenar(novaOrdem);
  }

  /** Painéis só abrem quando a API informar aplicação e rota. */
  podeAbrirPainel(painel: HomePainel): boolean {
    return !!painel.sistema && !!painel.rota;
  }

  abrirPainel(painel: HomePainel): void {
    if (!painel.sistema || !painel.rota) {
      return;
    }

    this.telaSolicitada.emit({
      id: `painel-${painel.id}`,
      titulo: painel.titulo,
      sistema: painel.sistema,
      rota: painel.rota
    });
  }
}
