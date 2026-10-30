import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map } from 'rxjs';

import { appConfig } from '../../../core/config/app-config';
import {
  WorkspaceFavoritoDto,
  WorkspaceFavoritoOrdemRequestDto,
  WorkspaceFavoritoRequestDto
} from '../dto/workspace-favorito.dto';
import { WorkspaceApplication } from '../model/workspace-application.model';
import { WorkspaceFavorito } from '../model/workspace-favorito.model';
import { WorkspaceMenuItem } from '../model/workspace-menu-item.model';
import { buildSystemId } from '../utils/workspace-url';

interface ListResponseDto<T> {
  items: T[];
  totalItems: number;
}

/**
 * Favoritos do usuário, compartilhados entre o menu lateral e a Home.
 *
 * É a fonte única do estado: favoritar no menu atualiza a Home na hora, e
 * reordenar na Home atualiza a seção "Favoritos" do menu.
 *
 * As alterações são otimistas: a tela muda na hora e, se a API falhar, o
 * estado anterior é restaurado.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceFavoritosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${appConfig.apiUrl}/api/WorkspaceFavorito`;

  private readonly _favoritos = signal<WorkspaceFavorito[] | null>(null);
  private readonly _erro = signal(false);
  private carregando = false;

  /** `null` enquanto carrega. */
  readonly favoritos = this._favoritos.asReadonly();

  /** Verdadeiro quando a lista não pôde ser carregada. */
  readonly erro = this._erro.asReadonly();

  private readonly idsFavoritos = computed(
    () => new Set((this._favoritos() ?? []).map(favorito => favorito.idMenu))
  );

  /** GET /api/WorkspaceFavorito. Carrega uma vez; chamadas seguintes são ignoradas. */
  carregar(): void {
    if (this._favoritos() !== null || this.carregando) {
      return;
    }

    this.carregando = true;
    this._erro.set(false);

    this.http
      .get<ListResponseDto<WorkspaceFavoritoDto>>(this.apiUrl)
      .pipe(map(response => response.items.map(dto => this.mapFavorito(dto))))
      .subscribe({
        next: favoritos => {
          this._favoritos.set(favoritos);
          this.carregando = false;
        },
        error: erro => {
          console.error('Favoritos: falha ao carregar.', erro);
          this._erro.set(true);
          this.carregando = false;
        }
      });
  }

  isFavorito(idMenu: string): boolean {
    return this.idsFavoritos().has(idMenu);
  }

  favoritosDaAplicacao(sistema: string): WorkspaceFavorito[] {
    return (this._favoritos() ?? []).filter(favorito => favorito.sistema === sistema);
  }

  /** Favorita ou desfavorita uma tela do menu. */
  alternar(item: WorkspaceMenuItem, application: WorkspaceApplication): void {
    if (this.isFavorito(item.id)) {
      this.remover(item.id);
    } else {
      this.adicionar(item, application);
    }
  }

  /** POST /api/WorkspaceFavorito */
  adicionar(item: WorkspaceMenuItem, application: WorkspaceApplication): void {
    const caminho = this.caminhoAte(application.menus, item.id) ?? [];
    const favorito: WorkspaceFavorito = {
      idMenu: item.id,
      titulo: item.title,
      categoria: caminho[0]?.title ?? '',
      subcategoria: caminho.length > 1 ? caminho[caminho.length - 1].title : '',
      sistema: application.system,
      projeto: application.projeto,
      rota: item.rota ?? ''
    };

    const anterior = this._favoritos();
    this._favoritos.set([...(anterior ?? []), favorito]);

    this.http
      .post(this.apiUrl, this.toRequest(favorito))
      .subscribe({ error: erro => this.restaurar(anterior, 'favoritar', erro) });
  }

  /** DELETE /api/WorkspaceFavorito/{idMenu} */
  remover(idMenu: string): void {
    const anterior = this._favoritos();
    this._favoritos.set((anterior ?? []).filter(favorito => favorito.idMenu !== idMenu));

    this.http
      .delete(`${this.apiUrl}/${idMenu}`)
      .subscribe({ error: erro => this.restaurar(anterior, 'desfavoritar', erro) });
  }

  /** PUT /api/WorkspaceFavorito/Ordem — recebe a lista já na nova ordem. */
  reordenar(favoritos: WorkspaceFavorito[]): void {
    const anterior = this._favoritos();
    this._favoritos.set(favoritos);

    const body: WorkspaceFavoritoOrdemRequestDto = {
      Ids: favoritos.map(favorito => Number(favorito.idMenu))
    };

    this.http
      .put(`${this.apiUrl}/Ordem`, body)
      .subscribe({ error: erro => this.restaurar(anterior, 'reordenar', erro) });
  }

  private restaurar(anterior: WorkspaceFavorito[] | null, acao: string, erro: unknown): void {
    console.error(`Favoritos: falha ao ${acao}.`, erro);
    this._favoritos.set(anterior);
  }

  /** Pastas acima do item no menu (da raiz até o pai). */
  private caminhoAte(
    itens: WorkspaceMenuItem[],
    id: string,
    caminho: WorkspaceMenuItem[] = []
  ): WorkspaceMenuItem[] | undefined {
    for (const item of itens) {
      if (item.id === id) {
        return caminho;
      }

      const encontrado = item.children?.length
        ? this.caminhoAte(item.children, id, [...caminho, item])
        : undefined;

      if (encontrado) {
        return encontrado;
      }
    }

    return undefined;
  }

  private mapFavorito(dto: WorkspaceFavoritoDto): WorkspaceFavorito {
    return {
      idMenu: dto.IdMenu.toString(),
      titulo: dto.Titulo,
      categoria: dto.Categoria ?? '',
      subcategoria: dto.Subcategoria ?? '',
      sistema: buildSystemId(dto.Projeto),
      projeto: dto.Projeto,
      rota: dto.Rota
    };
  }

  private toRequest(favorito: WorkspaceFavorito): WorkspaceFavoritoRequestDto {
    return {
      IdMenu: Number(favorito.idMenu),
      Titulo: favorito.titulo,
      Categoria: favorito.categoria || null,
      Subcategoria: favorito.subcategoria || null,
      Projeto: favorito.projeto,
      Rota: favorito.rota
    };
  }
}
