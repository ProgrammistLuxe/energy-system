import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { OverFlowTooltipDirective, materialModules } from '@shared/index';

@Component({
  selector: 'app-list-item-remove',
  imports: [CommonModule, forwardRef(() => OverFlowTooltipDirective), materialModules.matIconModule],
  templateUrl: './list-item-remove.component.html',
  styleUrl: './list-item-remove.component.scss',
})
export class ListItemRemoveComponent {
  @Input() name: string = '';
  @Output() clicked: EventEmitter<void> = new EventEmitter<void>();
}
