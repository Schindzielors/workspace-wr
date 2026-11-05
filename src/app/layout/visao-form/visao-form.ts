import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
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
 * Campos de escolha da visão: busca em todos os níveis + Grupo > Empresa >
 * Filial em cascata. Usado no "Trocar visão" do header e na etapa
 * "Selecione por onde você quer começar" do login.
 *
 * Só edita os ids (`[(idGrupo)]`, `[(idEmpresa)]`, `[(idFilial)]`); quem usa
 * decide quando gravar.
 */
@Component({
  selector: 'app-visao-form',
  imports: [Icon, Select],
  templateUrl: './visao-form.html',
  styleUrl: './visao-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisaoForm {
  private readonly visaoService = inject(WorkspaceVisaoService);

  readonly idGrupo = model<string | null>(null);
  readonly idEmpresa = model<string | null>(null);
  readonly idFilial = model<string | null>(null);

  /** Foca a busca ao abrir. */
  readonly focarBusca = input(false);

  private readonly buscaInput = viewChild.required<ElementRef<HTMLInputElement>>('buscaInput');

  readonly termo = signal('');
  readonly buscaAtiva = signal(false);
  readonly indiceBusca = signal(0);

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
    afterNextRender(() => {
      if (this.focarBusca()) {
        this.buscaInput().nativeElement.focus();
      }
    });
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
      // Primeiro Esc fecha a lista da busca; o segundo fecha o painel em volta.
      event.preventDefault();
      event.stopPropagation();
      this.buscaAtiva.set(false);
    }
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
