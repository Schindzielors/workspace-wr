import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';

import { appConfig } from '../../../core/config/app-config';
import { buildSystemId } from '../../workspace/utils/workspace-url';
import {
  HomeConectorDto,
  HomeFavoritoDto,
  HomeListResponseDto,
  HomePainelDto,
  HomeUsuarioDto
} from '../dto/home.dto';
import {
  HOME_MOCK_DELAY_MS,
  homeMockCenario,
  MOCK_CONECTORES,
  MOCK_FAVORITOS,
  MOCK_PAINEIS,
  MOCK_USUARIO
} from '../mock/home.mock';
import {
  HomeConector,
  HomeConectorStatus,
  HomeFavorito,
  HomePainel,
  HomeUsuario
} from '../model/home.model';

/**
 * Dados da Home do Workspace.
 *
 * ENQUANTO A API NÃO EXISTE:
 * cada método `carregar...` devolve dados simulados (`../mock/home.mock.ts`)
 * no mesmo formato da API e passa pela mesma conversão (`map...`).
 *
 * PARA LIGAR A API (em cada método):
 * 1. descomente o bloco "API";
 * 2. apague o bloco "MOCK";
 * 3. confirme a rota e o DTO com o backend.
 *
 * Quando todos os métodos estiverem ligados, remova `../mock/home.mock.ts`
 * e o import dele abaixo.
 */
@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly http = inject(HttpClient);

  /** Rota base proposta para os endpoints da Home. */
  private readonly apiUrl = `${appConfig.apiUrl}/api/WorkspaceHome`;

  private readonly cenario = homeMockCenario();

  /** Usuário logado, para a saudação. */
  carregarUsuario(): Observable<HomeUsuario> {
    // API:
    // return this.http
    //   .get<HomeUsuarioDto>(`${this.apiUrl}/Usuario`)
    //   .pipe(map(dto => this.mapUsuario(dto)));

    // MOCK:
    return this.mock(MOCK_USUARIO).pipe(
      map(dto => this.mapUsuario(dto))
    );
  }

  /** Telas favoritas do usuário (coluna "Favoritos"). */
  carregarFavoritos(): Observable<HomeFavorito[]> {
    // API:
    // return this.http
    //   .get<HomeListResponseDto<HomeFavoritoDto>>(`${this.apiUrl}/Favoritos`)
    //   .pipe(map(response => response.items.map(dto => this.mapFavorito(dto))));

    // MOCK:
    const vazio = this.cenario === 'sem-favoritos' || this.cenario === 'vazio';

    return this.mockLista(MOCK_FAVORITOS, vazio).pipe(
      map(response => response.items.map(dto => this.mapFavorito(dto)))
    );
  }

  /** Conectores disponíveis para o sistema (coluna "Conectores"). */
  carregarConectores(): Observable<HomeConector[]> {
    // API:
    // return this.http
    //   .get<HomeListResponseDto<HomeConectorDto>>(`${this.apiUrl}/Conectores`)
    //   .pipe(map(response => response.items.map(dto => this.mapConector(dto))));

    // MOCK:
    const vazio = this.cenario === 'sem-conectores' || this.cenario === 'vazio';

    return this.mockLista(MOCK_CONECTORES, vazio).pipe(
      map(response => response.items.map(dto => this.mapConector(dto)))
    );
  }

  /** Painéis favoritos do usuário (coluna "Painéis"). */
  carregarPaineis(): Observable<HomePainel[]> {
    // API:
    // return this.http
    //   .get<HomeListResponseDto<HomePainelDto>>(`${this.apiUrl}/Paineis`)
    //   .pipe(map(response => response.items.map(dto => this.mapPainel(dto))));

    // MOCK:
    const vazio = this.cenario === 'sem-paineis' || this.cenario === 'vazio';

    return this.mockLista(MOCK_PAINEIS, vazio).pipe(
      map(response => response.items.map(dto => this.mapPainel(dto)))
    );
  }

  // ---------------------------------------------------------------------
  // Conversão DTO (API) -> modelo (componentes)
  // ---------------------------------------------------------------------

  private mapUsuario(dto: HomeUsuarioDto): HomeUsuario {
    return { nome: dto.Nome };
  }

  private mapFavorito(dto: HomeFavoritoDto): HomeFavorito {
    return {
      id: dto.Id.toString(),
      titulo: dto.Titulo,
      categoria: dto.Categoria,
      subcategoria: dto.Subcategoria,
      sistema: buildSystemId(dto.Projeto),
      rota: dto.Rota
    };
  }

  private mapConector(dto: HomeConectorDto): HomeConector {
    return {
      id: dto.Id.toString(),
      nome: dto.Nome,
      descricao: dto.Descricao,
      categoria: dto.Categoria,
      status: this.mapConectorStatus(dto.Status),
      logoUrl: dto.LogoUrl ?? undefined
    };
  }

  private mapConectorStatus(status: string): HomeConectorStatus {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
        return 'ativo';
      case 'EM_ANALISE':
        return 'em-analise';
      case 'AGUARDANDO_CONFIGURACAO':
        return 'aguardando-configuracao';
      default:
        return 'inativo';
    }
  }

  private mapPainel(dto: HomePainelDto): HomePainel {
    return {
      id: dto.Id.toString(),
      titulo: dto.Titulo,
      sistema: dto.Projeto ? buildSystemId(dto.Projeto) : undefined,
      rota: dto.Rota ?? undefined
    };
  }

  // ---------------------------------------------------------------------
  // MOCK: remover junto com `../mock/home.mock.ts`
  // ---------------------------------------------------------------------

  private mock<T>(data: T): Observable<T> {
    return of(data).pipe(delay(HOME_MOCK_DELAY_MS));
  }

  private mockLista<T>(
    response: HomeListResponseDto<T>,
    vazio: boolean
  ): Observable<HomeListResponseDto<T>> {
    return this.mock(vazio ? { items: [], totalItems: 0 } : response);
  }
}
