import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Tabs } from '../tabs/tabs';
import { IframeHost } from '../../features/workspace/iframe-host/iframe-host';

@Component({
  selector: 'app-workspace-shell',
  imports: [
    Sidebar,
    Tabs,
    IframeHost
  ],
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.scss'
})
export class WorkspaceShell {}