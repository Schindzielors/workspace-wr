import { Component, input, output } from '@angular/core';

import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { Icon, IconName } from '../../shared/icon/icon';
import { applicationIcon } from '../../shared/icon/application-icon';

@Component({
  selector: 'app-application-rail',
  imports: [Icon],
  templateUrl: './application-rail.html',
  styleUrl: './application-rail.scss'
})
export class ApplicationRail {
  applications = input.required<WorkspaceApplication[]>();
  activeApplicationId = input<string>();

  /** Quando verdadeiro, "Início" fica selecionado e nenhuma aplicação. */
  homeActive = input(false);

  applicationSelected = output<string>();
  homeSelected = output<void>();

  selectApplication(applicationId: string): void {
    this.applicationSelected.emit(applicationId);
  }

  iconFor(application: WorkspaceApplication): IconName {
    return applicationIcon(application);
  }
}
