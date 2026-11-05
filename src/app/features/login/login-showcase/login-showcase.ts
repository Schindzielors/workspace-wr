import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

import { BrandLogo } from '../../../shared/brand-logo/brand-logo';
import { Icon, IconName } from '../../../shared/icon/icon';

interface Slide {
  /** Posição do item destacado na lista de palavras. */
  destaque: number;
  icone: IconName;
  titulo: string;
  texto: string;
}

const PALAVRAS = [
  'Resumo semanal',
  'Clientes ativos',
  'Entregas realizadas',
  'Abastecimento',
  'Rotas',
  'Motoristas',
  'Painéis'
];

// Só o primeiro slide veio nos prints. Os outros dois são provisórios.
const SLIDES: Slide[] = [
  {
    destaque: 2,
    icone: 'folder-open',
    titulo: 'Gestão centralizada',
    texto: 'Reúna seus processos logísticos em uma única plataforma e facilite o acesso às informações do dia a dia.'
  },
  {
    destaque: 3,
    icone: 'gas-pump',
    titulo: 'Operação sob controle',
    texto: 'Acompanhe entregas, frota e abastecimento com informações sempre atualizadas.'
  },
  {
    destaque: 4,
    icone: 'map-trifold',
    titulo: 'Tudo em um só lugar',
    texto: 'Acesse os sistemas da Datapar com um único login e trabalhe com várias telas abertas.'
  }
];

const INTERVALO_MS = 6000;

/**
 * Painel azul do login: lista de palavras que rola até o item destacado e,
 * embaixo, título + texto do slide. Troca sozinho a cada 6s; os indicadores
 * permitem escolher o slide. Decorativo para leitores de tela, exceto o texto.
 */
@Component({
  selector: 'app-login-showcase',
  imports: [BrandLogo, Icon],
  templateUrl: './login-showcase.html',
  styleUrl: './login-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginShowcase {
  readonly palavras = PALAVRAS;
  readonly slides = SLIDES;
  readonly atual = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.iniciar();
    inject(DestroyRef).onDestroy(() => this.parar());
  }

  slide(): Slide {
    return SLIDES[this.atual()];
  }

  /** Distância até o item destacado (0 = destacado). */
  distancia(indice: number): number {
    return Math.abs(indice - this.slide().destaque);
  }

  irPara(indice: number): void {
    this.atual.set(indice);
    this.parar();
    this.iniciar();
  }

  private iniciar(): void {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.timer = setInterval(() => this.atual.update(i => (i + 1) % SLIDES.length), INTERVALO_MS);
  }

  private parar(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
