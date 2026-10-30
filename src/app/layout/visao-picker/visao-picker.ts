import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  output,
  signal,
  viewChild
} from '@angular/core';

import { WorkspaceVisaoNo, WorkspaceVisaoTipo } from '../../features/workspace/model/workspace-visao.model';
import { WorkspaceVisaoService } from '../../features/workspace/service/workspace-visao.service';
import { Icon } from '../../shared/icon/icon';
import { Select, SelectOption } from '../../shared/select/select';

const ROTULO_TIPO: Record<WorkspaceVisaoTipo, string> = {
  grupo: 'Grupo',
  empresa: 'Empresa',
  filial: 'Filial'
};

/**
 * Painel "Trocar visão" (Figma "Home - Perfil empresa"), aberto pelo bloco
 * da empresa no header.
 *
 * Duas formas de escolher, que se completam:
 * - Buscar: encontra grupo, empresa ou filial em qualquer nível e preenche
 *   os três campos de uma vez;
 * - Campos em cascata: Grupo > Empresa > Filial.
 *
 * "Selecionar" grava na API e atualiza o header. Esc ou clique fora fecha.
 */
@Component({
  selector: 'app-visao-picker',
  imports: [Icon, Select],
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

  private readonly buscaInput = viewChild.required<ElementRef<HTMLInputElement>>('buscaInput');

  /** Escolha em andamento (só vale depois de "Selecionar"). */
  readonly idGrupo = signal<string | null>(this.visaoService.atual()?.idGrupo ?? null);
  readonly idEmpresa = signal<string | null>(this.visaoService.atual()?.idEmpresa ?? null);
  readonly idFilial = signal<string | null>(this.visaoService.atual()?.idFilial ?? null);

  readonly termo = signal('');
  readonly buscaAtiva = signal(false);
  readonly indiceBusca = signal(0);
  readonly salvando = signal(false);
  readonly erro = signal(false);

  readonly opcoesGrupo = computed(() => this.opcoes(null, 'grupo'));
  readonly opcoesEmpresa = computed(() => this.idGrupo() ? this.opcoes(this.idGrupo(), 'empresa') : []);
  readonly opcoesFilial = computed(() => this.idEmpresa() ? this.opcoes(this.idEmpresa(), 'filial') : []);

  /** Resultados da busca: todos os níveis, filtrados pelo texto. */
  readonly resultados = computed(() => {
    const termo = normalizar(this.termo());

    return this.visaoService
      .estrutura()
      .filter(no => !termo || normalizar(`${no.nome} ${this.visaoService.ancestrais(no).join(' ')}`).includes(termo))
      .map(no => ({ no, caminho: this.visaoService.ancestrais(no), tipo: ROTULO_TIPO[no.tipo] }));
  });

  readonly mostrarResultados = computed(() => this.buscaAtiva() || !!this.termo());

  constructor() {
    this.visaoService.carregar();
    afterNextRender(() => this.buscaInput().nativeElement.focus());
  }

  // ---------------------------------------------------------------------
  // Campos em cascata
  // ---------------------------------------------------------------------

  escolherGrupo(id: string): void {
    if (id !== this.idGrupo()) {
      this.idGrupo.set(id);
      this.idEmpresa.set(null);
      this.idFilial.set(null);
    }
  }

  escolherEmpresa(id: string): void {
    if (id !== this.idEmpresa()) {
      this.idEmpresa.set(id);
      this.idFilial.set(null);
    }
  }

  escolherFilial(id: string): void {
    this.idFilial.set(id);
  }

  // ---------------------------------------------------------------------
  // Busca
  // ---------------------------------------------------------------------

  atualizarTermo(event: Event): void {
    this.termo.set((event.target as HTMLInputElement).value);
    this.indiceBusca.set(0);
  }

  /** Preenche grupo, empresa e filial a partir do resultado escolhido. */
  escolherResultado(no: WorkspaceVisaoNo): void {
    const visao = this.visaoService.visaoDoNo(no);

    this.idGrupo.set(visao.idGrupo);
    this.idEmpresa.set(visao.idEmpresa);
    this.idFilial.set(visao.idFilial);
    this.termo.set('');
    this.buscaAtiva.set(false);
    this.buscaInput().nativeElement.value = '';
  }

  onBuscaKeydown(event: KeyboardEvent): void {
    const total = this.resultados().length;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.buscaAtiva.set(true);

      if (total) {
        const passo = event.key === 'ArrowDown' ? 1 : -1;
        this.indiceBusca.set((this.indiceBusca() + passo + total) % total);
        requestAnimationFrame(() =>
          document.getElementById(`visao-resultado-${this.indiceBusca()}`)?.scrollIntoView({ block: 'nearest' })
        );
      }
    } else if (event.key === 'Enter' && this.mostrarResultados()) {
      const resultado = this.resultados()[this.indiceBusca()];

      if (resultado) {
        event.preventDefault();
        this.escolherResultado(resultado.no);
      }
    } else if (event.key === 'Escape' && this.mostrarResultados()) {
      // Primeiro Esc fecha a lista da busca; o segundo fecha o painel.
      event.preventDefault();
      event.stopPropagation();
      this.buscaAtiva.set(false);
    }
  }

  // ---------------------------------------------------------------------
  // Selecionar
  // ---------------------------------------------------------------------

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

  private opcoes(idPai: string | null, tipo: WorkspaceVisaoTipo): SelectOption[] {
    return this.visaoService.filhos(idPai, tipo).map(no => ({ value: no.id, label: no.nome }));
  }
}

function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
