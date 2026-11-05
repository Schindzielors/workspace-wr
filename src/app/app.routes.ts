import { Routes } from '@angular/router';

import { anonimoGuard, autenticadoGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [anonimoGuard],
    title: 'Entrar | Datapar Workspace',
    loadComponent: () => import('./features/login/login').then(m => m.Login)
  },
  {
    path: '',
    pathMatch: 'full',
    canMatch: [autenticadoGuard],
    title: 'Workspace Datapar',
    loadComponent: () => import('./layout/workspace-shell/workspace-shell').then(m => m.WorkspaceShell)
  },
  { path: '**', redirectTo: '' }
];
