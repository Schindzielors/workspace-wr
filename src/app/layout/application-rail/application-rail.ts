import { Component, EventEmitter, input, Input, output, Output } from '@angular/core';

import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';

@Component({
  selector: 'app-application-rail',
  imports: [],
  templateUrl: './application-rail.html',
  styleUrl: './application-rail.scss'
})
export class ApplicationRail {

  // @Input({ required: true })
  // applications: WorkspaceApplication[] = [];
  applications = input.required<WorkspaceApplication[]>();

  // @Input()
  // activeApplicationId?: string;
  activeApplicationId = input<string>();


  // @Output()
  // applicationSelected = new EventEmitter<string>();
  applicationSelected = output<string>();

  selectApplication(applicationId: string): void {
    this.applicationSelected.emit(applicationId);
  }

}