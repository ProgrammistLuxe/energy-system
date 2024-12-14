import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectedNode } from '@pages/graph/graph.component';
import { OverFlowTooltipDirective, materialModules } from '@shared/index';

@Component({
  selector: 'app-action-panel',
  imports: [
    CommonModule,
    OverFlowTooltipDirective,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
    materialModules.matChipsModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './action-panel.component.html',
  styleUrl: './action-panel.component.scss',
})
export class ActionPanelComponent {
  @Input() history: SelectedNode[] = [];
  @Output() onModeChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() onItemDeleted: EventEmitter<SelectedNode> = new EventEmitter<SelectedNode>();
  @Output() onItemSelected: EventEmitter<SelectedNode> = new EventEmitter<SelectedNode>();
  @Output() loadGraph: EventEmitter<void> = new EventEmitter<void>();
}
