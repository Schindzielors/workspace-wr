import { Component } from '@angular/core';
import { WorkspaceShell } from './layout/workspace-shell/workspace-shell';

@Component({
  selector: 'app-root',
  imports: [
    WorkspaceShell
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}