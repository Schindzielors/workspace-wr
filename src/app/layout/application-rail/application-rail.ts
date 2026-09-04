import { Component, EventEmitter, Input, Output } from '@angular/core';

import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';

@Component({
  selector: 'app-application-rail',
  imports: [],
  templateUrl: './application-rail.html',
  styleUrl: './application-rail.scss'
})
export class ApplicationRail {

  @Input({ required: true })
  applications: WorkspaceApplication[] = [];

  @Input()
  activeApplicationId?: string;

  @Output()
  applicationSelected = new EventEmitter<string>();

  selectApplication(applicationId: string): void {
    this.applicationSelected.emit(applicationId);
  }

}