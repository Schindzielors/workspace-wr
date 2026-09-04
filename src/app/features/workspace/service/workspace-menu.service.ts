import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { appConfig } from '../../../core/config/app-config';
import { WorkspaceProjectResponseDto } from '../dto/workspace-project-response.dto';
import { WorkspaceApplication } from '../model/workspace-application.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceMenuService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${appConfig.apiUrl}/api/WorkspaceMenu`;

  /**
   * Retorna as aplicações disponíveis no Workspace.
   *
   * O contrato da API é convertido para o modelo utilizado
   * pelos componentes do Workspace.
   */
  getApplications(): Observable<WorkspaceApplication[]> {
    return this.http
      .get<WorkspaceProjectResponseDto>(
        `${this.apiUrl}/Projetos`
      )
      .pipe(
        map(response =>
          response.items.map(project => ({
            id: project.id.toString(),
            projeto: project.projeto,
            title: project.nome,
            shortTitle: project.nome,
            menus: []
          }))
        )
      );
  }
}