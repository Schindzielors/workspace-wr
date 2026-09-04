import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { appConfig } from '../../../core/config/app-config';
import { WorkspaceProjectResponseDto } from '../dto/workspace-project-response.dto';
import { WorkspaceApplication } from '../model/workspace-application.model';
import { WorkspaceMenuResponseDto } from '../dto/workspace-menu-response.dto';
import { WorkspaceMenuItem } from '../model/workspace-menu-item.model';
import { WorkspaceMenuDto } from '../dto/workspace-menu.dto';

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

  getMenus(projeto: string): Observable<WorkspaceMenuItem[]> {
    const params = new HttpParams()
      .set('projeto', projeto);

    return this.http
      .get<WorkspaceMenuResponseDto>(
        `${this.apiUrl}/MenuProjetos`,
        { params }
      )
      .pipe(
        map(response => this.buildMenuTree(response.items))
      );
  }

  private buildMenuTree(
    items: WorkspaceMenuDto[]
  ): WorkspaceMenuItem[] {

    const menuMap = new Map<number, WorkspaceMenuItem>();

    items.forEach(item => {
      menuMap.set(item.Id, {
        id: item.Id.toString(),
        title: item.Titulo,
        children: []
      });
    });

    const rootItems: WorkspaceMenuItem[] = [];

    items.forEach(item => {
      const menuItem = menuMap.get(item.Id);

      if (!menuItem) {
        return;
      }

      if (item.IdPai === null) {
        rootItems.push(menuItem);
        return;
      }

      const parent = menuMap.get(item.IdPai);

      if (parent) {
        parent.children?.push(menuItem);
      }
    });

    return rootItems;
  }
}