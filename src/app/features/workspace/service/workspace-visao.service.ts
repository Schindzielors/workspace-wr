import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { appConfig } from '../../../core/config/app-config';
import { WorkspaceVisaoAtualDto, WorkspaceVisaoNoDto } from '../dto/workspace-visao.dto';
import { WorkspaceVisao, WorkspaceVisaoNo, WorkspaceVisaoTipo } from '../model/workspace-visao.model';

interface ListResponseDto<T> {
  items: T[];
  totalItems: number;
}

/**
 * Visão do usuário (grupo / empresa / filial), exibida no header e trocada
 * pelo painel "Trocar visão".
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceVisaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${appConfig.apiUrl}/api/WorkspaceVisao`;

  private readonly _estrutura = signal<WorkspaceVisaoNo[]>([]);
  private readonly _atual = signal<WorkspaceVisao | null>(null);
  private carregado = false;

  /** Grupos, empresas e filiais que o usuário pode acessar. */
  readonly estrutura = this._estrutura.asReadonly();

  /** Visão selecionada; `null` enquanto carrega. */
  readonly atual = this._atual.asReadonly();

  private readonly porId = computed(
    () => new Map(this._estrutura().map(no => [no.id, no]))
  );

  /**
   * Textos do header: empresa (ou grupo) em cima, filial (ou nível) embaixo.
   * Ex.: "Insany 01" / "Insany Alfenas".
   */
  readonly rotulo = computed(() => {
    const atual = this._atual();

    if (!atual) {
      return null;
    }

    const grupo = this.no(atual.idGrupo);
    const empresa = this.no(atual.idEmpresa);
    const filial = this.no(atual.idFilial);

    if (!grupo) {
      return null;
    }

    return {
      titulo: empresa?.nome ?? grupo.nome,
      subtitulo: filial?.nome ?? (empresa ? 'Todas as filiais' : 'Todas as empresas')
    };
  });

  /** GET Estrutura + GET Atual. Carrega uma vez. */
  carregar(): void {
    if (this.carregado) {
      return;
    }

    this.carregado = true;

    this.http
      .get<ListResponseDto<WorkspaceVisaoNoDto>>(`${this.apiUrl}/Estrutura`)
      .pipe(map(response => response.items.map(dto => this.mapNo(dto))))
      .subscribe({
        next: estrutura => this._estrutura.set(estrutura),
        error: erro => console.error('Visão: falha ao carregar a estrutura.', erro)
      });

    this.http
      .get<WorkspaceVisaoAtualDto>(`${this.apiUrl}/Atual`)
      .subscribe({
        next: dto => this._atual.set({
          idGrupo: dto.IdGrupo,
          idEmpresa: dto.IdEmpresa,
          idFilial: dto.IdFilial
        }),
        error: erro => console.error('Visão: falha ao carregar a visão atual.', erro)
      });
  }

  /** PUT Atual. Só atualiza o header depois que a API confirmar. */
  selecionar(visao: WorkspaceVisao): Observable<unknown> {
    const body: WorkspaceVisaoAtualDto = {
      IdGrupo: visao.idGrupo,
      IdEmpresa: visao.idEmpresa,
      IdFilial: visao.idFilial
    };

    return this.http
      .put(`${this.apiUrl}/Atual`, body)
      .pipe(tap(() => this._atual.set(visao)));
  }

  no(id: string | null | undefined): WorkspaceVisaoNo | undefined {
    return id ? this.porId().get(id) : undefined;
  }

  filhos(idPai: string | null, tipo: WorkspaceVisaoTipo): WorkspaceVisaoNo[] {
    return this._estrutura().filter(no => no.tipo === tipo && no.idPai === idPai);
  }

  /** Grupo, empresa e filial a partir de qualquer nó escolhido na busca. */
  visaoDoNo(no: WorkspaceVisaoNo): WorkspaceVisao {
    if (no.tipo === 'grupo') {
      return { idGrupo: no.id, idEmpresa: null, idFilial: null };
    }

    if (no.tipo === 'empresa') {
      return { idGrupo: no.idPai ?? '', idEmpresa: no.id, idFilial: null };
    }

    const empresa = this.no(no.idPai);
    return { idGrupo: empresa?.idPai ?? '', idEmpresa: empresa?.id ?? null, idFilial: no.id };
  }

  /** Nomes dos níveis acima do nó (ex.: ["Insany LTDA", "Insany 01"]). */
  ancestrais(no: WorkspaceVisaoNo): string[] {
    const nomes: string[] = [];
    let pai = this.no(no.idPai);

    while (pai) {
      nomes.unshift(pai.nome);
      pai = this.no(pai.idPai);
    }

    return nomes;
  }

  private mapNo(dto: WorkspaceVisaoNoDto): WorkspaceVisaoNo {
    return {
      id: dto.Id,
      nome: dto.Nome,
      tipo: dto.Tipo.toLowerCase() as WorkspaceVisaoTipo,
      idPai: dto.IdPai
    };
  }
}
