import { Component, input, output } from '@angular/core';

import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { Icon, IconName } from '../../shared/icon/icon';

/** Ícones aceitos no campo `icon` da aplicação, no mesmo padrão do Figma. */
const APPLICATION_ICONS: Record<string, IconName> = {
  map: 'map-trifold',
  'map-trifold': 'map-trifold',
  truck: 'truck'
};

@Component({
  selector: 'app-application-rail',
  imports: [Icon],
  templateUrl: './application-rail.html',
  styleUrl: './application-rail.scss'
})
export class ApplicationRail {
  applications = input.required<WorkspaceApplication[]>();
  activeApplicationId = input<string>();
  applicationSelected = output<string>();

  selectApplication(applicationId: string): void {
    this.applicationSelected.emit(applicationId);
  }

  /**
   * A API ainda não envia o ícone da aplicação. Até lá, seguimos o Figma:
   * WR usa MapTrifold e Rodopar usa Truck.
   */
  iconFor(application: WorkspaceApplication): IconName {
    const explicit = application.icon && APPLICATION_ICONS[application.icon];

    if (explicit) {
      return explicit;
    }

    const name = `${application.system} ${application.title}`.toLowerCase();

    if (name.includes('rodopar')) {
      return 'truck';
    }

    if (/\bwr\b/.test(name) || name.includes('-wr')) {
      return 'map-trifold';
    }

    return 'squares-four';
  }
}
