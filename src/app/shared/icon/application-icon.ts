import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { IconName } from './icon';

/** Ícones aceitos no campo `icon` da aplicação, no mesmo padrão do Figma. */
const APPLICATION_ICONS: Record<string, IconName> = {
  map: 'map-trifold',
  'map-trifold': 'map-trifold',
  truck: 'truck'
};

/**
 * Ícone da aplicação, usado no header e no título do menu lateral.
 *
 * A API ainda não envia o ícone. Até lá, seguimos o Figma:
 * WR usa MapTrifold e Rodopar usa Truck.
 */
export function applicationIcon(application: WorkspaceApplication): IconName {
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
