import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';

import { Icon } from '../../shared/icon/icon';
import { environment } from '../../../environments/environment';
import { HomeSection } from './home-section/home-section';
import { HomeService } from './service/home.service';
import {
  HomeConector,
  HomeConectorStatus,
  HomeFavorito,
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
  imports: [Icon, HomeSection],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private readonly homeService = inject(HomeService);

  /** Pede ao Workspace para abrir uma tela (favorito ou painel). */
  readonly telaSolicitada = output<HomeTelaSolicitada>();

  /** `null` enquanto carrega. */
  readonly usuario = signal<HomeUsuario | null>(null);
  readonly favoritos = signal<HomeFavorito[] | null>(null);
  readonly conectores = signal<HomeConector[] | null>(null);
  readonly paineis = signal<HomePainel[] | null>(null);

  readonly versao = environment.version;

  protected readonly statusLabel: Record<HomeConectorStatus, string> = {
    'ativo': 'Ativo',
    'em-analise': 'Em análise',
    'inativo': 'Inativo',
    'aguardando-configuracao': 'Aguardando configuração'
  };

  ngOnInit(): void {
    this.homeService.carregarUsuario().subscribe(usuario => this.usuario.set(usuario));
    this.homeService.carregarFavoritos().subscribe(favoritos => this.favoritos.set(favoritos));
    this.homeService.carregarConectores().subscribe(conectores => this.conectores.set(conectores));
    this.homeService.carregarPaineis().subscribe(paineis => this.paineis.set(paineis));
  }

  abrirFavorito(favorito: HomeFavorito): void {
    this.telaSolicitada.emit({
      id: `favorito-${favorito.id}`,
      titulo: favorito.titulo,
      sistema: favorito.sistema,
      rota: favorito.rota
    });
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
