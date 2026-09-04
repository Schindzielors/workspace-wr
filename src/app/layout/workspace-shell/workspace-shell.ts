import { Component, inject, OnInit, signal } from '@angular/core';

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
export class WorkspaceShell implements OnInit {
  private readonly menuService = inject(WorkspaceMenuService);

  readonly applications = signal<WorkspaceApplication[]>([]);
  activeApplicationId?: string;

  get activeApplication(): WorkspaceApplication | undefined {
    return this.applications().find(
      application => application.id === this.activeApplicationId
    );
  }

  ngOnInit(): void {
    this.menuService.getApplications().subscribe(applications => {
      this.applications.set(applications);

      const firstApplication = applications[0];

      if (firstApplication) {
        this.selectApplication(firstApplication.id);
      }
    });
  }

  selectApplication(applicationId: string): void {
    this.activeApplicationId = applicationId;

    const application = this.applications().find(
      item => item.id === applicationId
    );

    if (!application) {
      return;
    }

    this.menuService
      .getMenus(
        application.projeto,
        application.baseUrl
      )
      .subscribe(menus => {
        this.applications.update(applications =>
          applications.map(item =>
            item.id === application.id
              ? {
                ...item,
                menus
              }
              : item
          )
        );
      });
  }
}