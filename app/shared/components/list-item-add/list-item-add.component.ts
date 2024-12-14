import { CommonModule, formatPercent } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { OverFlowTooltipDirective, materialModules } from '@shared/index';

@Component({
  selector: 'app-list-item-add',
  imports: [CommonModule, forwardRef(() => OverFlowTooltipDirective), materialModules.matIconModule],
  templateUrl: './list-item-add.component.html',
  styleUrl: './list-item-add.component.scss',
})
export class ListItemAddComponent {
  @Input() name: string = '';
  @Output() clicked: EventEmitter<void> = new EventEmitter<void>();
}
