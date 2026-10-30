import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

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
  HomeConector,
  HomeConectorStatus,
  HomeFavorito,
  HomePainel,
  HomeUsuario
} from '../model/home.model';

/**
 * Dados da Home do Workspace, lidos de `/api/WorkspaceHome`.
 *
 * Os dados simulados ficam na própria API (WorkspaceHomeController), então
 * este serviço já está ligado de verdade: quando o backend trocar o mock
 * pelas consultas reais, nada muda aqui.
 *
 * Cada método converte o DTO da API (PascalCase) para o modelo usado pelos
 * componentes.
 */
@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${appConfig.apiUrl}/api/WorkspaceHome`;

  /** Usuário logado, para a saudação. GET /api/WorkspaceHome/Usuario */
  carregarUsuario(): Observable<HomeUsuario> {
    return this.http
      .get<HomeUsuarioDto>(`${this.apiUrl}/Usuario`)
      .pipe(map(dto => this.mapUsuario(dto)));
  }

  /** Telas favoritas do usuário (coluna "Favoritos"). GET /api/WorkspaceHome/Favoritos */
  carregarFavoritos(): Observable<HomeFavorito[]> {
    return this.http
      .get<HomeListResponseDto<HomeFavoritoDto>>(`${this.apiUrl}/Favoritos`)
      .pipe(map(response => response.items.map(dto => this.mapFavorito(dto))));
  }

  /** Conectores disponíveis (coluna "Conectores"). GET /api/WorkspaceHome/Conectores */
  carregarConectores(): Observable<HomeConector[]> {
    return this.http
      .get<HomeListResponseDto<HomeConectorDto>>(`${this.apiUrl}/Conectores`)
      .pipe(map(response => response.items.map(dto => this.mapConector(dto))));
  }

  /** Painéis favoritos do usuário (coluna "Painéis"). GET /api/WorkspaceHome/Paineis */
  carregarPaineis(): Observable<HomePainel[]> {
    return this.http
      .get<HomeListResponseDto<HomePainelDto>>(`${this.apiUrl}/Paineis`)
      .pipe(map(response => response.items.map(dto => this.mapPainel(dto))));
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
}
