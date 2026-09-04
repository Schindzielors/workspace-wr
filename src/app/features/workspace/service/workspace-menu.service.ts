import { inject, Injectable } from '@angular/core';
import { WorkspaceApplication } from '../model/workspace-application.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkspaceProjectResponseDto } from '../dto/workspace-project-response.dto';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceMenuService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://localhost:7055/api/WorkspaceMenu';

  /**
   * Aplicações disponíveis no Workspace.
   *
   * Neste momento os dados permanecem mockados para permitir
   * a evolução da POC. Futuramente essa estrutura poderá ser
   * carregada a partir do backend.
   */
  private readonly applications: WorkspaceApplication[] = [
    {
      id: 'portal-wr',
      title: 'Portal WR',
      shortTitle: 'Portal WR',
      icon: 'map',
      menus: [
        {
          id: 'cotacoes',
          title: 'Cotações',
          children: [
            {
              id: 'portal-wr-cotacoes-aberto',
              title: 'Cotações em aberto',
              system: 'portal-wr',
              url: 'http://54.232.212.10:8588/#/login'
            }
          ]
        }
      ]
    },
    {
      id: 'web-rodopar',
      title: 'Web Rodopar',
      shortTitle: 'Web RP',
      icon: 'truck',
      menus: [
        {
          id: 'web-rodopar-home',
          title: 'Web Rodopar',
          system: 'web-rodopar',
          url: 'https://webrodopar-dev.datapardc.com/#/login'
        }
      ]
    },
    {
      id: 'rodopar',
      title: 'Rodopar',
      shortTitle: 'Rodopar',
      icon: 'monitor',
      menus: [
        {
          id: 'rodopar-legado',
          title: 'Rodopar',
          system: 'rodopar',
          url: 'https://webcloud1.datapardc.com/'
        }
      ]
    }
  ];

  /**
   * Retorna as aplicações disponíveis no Workspace.
   */
  getApplications(): WorkspaceApplication[] {
    return this.applications;
  }

  getProjects(): Observable<WorkspaceProjectResponseDto> {
    return this.http.get<WorkspaceProjectResponseDto>(
      `${this.apiUrl}/Projetos`
    );
  }
}