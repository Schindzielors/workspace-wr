import { Component, inject } from '@angular/core';

import { ApplicationRail } from '../application-rail/application-rail';
import { ApplicationMenu } from '../application-menu/application-menu';
import { Tabs } from '../tabs/tabs';

import { IframeHost } from '../../features/workspace/iframe-host/iframe-host';
import { WorkspaceMenuService } from '../../features/workspace/service/workspace-menu.service';
import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';

@Component({
  selector: 'app-workspace-shell',
  imports: [
    ApplicationRail,
    ApplicationMenu,
    Tabs,
    IframeHost
  ],
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.scss'
})
export class WorkspaceShell {

  private readonly menuService = inject(WorkspaceMenuService);

  readonly applications = this.menuService.getApplications();

  activeApplicationId = this.applications[0]?.id;

  get activeApplication(): WorkspaceApplication | undefined {
    return this.applications.find(
      application => application.id === this.activeApplicationId
    );
  }

  selectApplication(applicationId: string): void {
    this.activeApplicationId = applicationId;

    //Teste
    this.menuService.getProjects().subscribe(response => {
      console.log('Projetos da API:', response);
    });
  }

}