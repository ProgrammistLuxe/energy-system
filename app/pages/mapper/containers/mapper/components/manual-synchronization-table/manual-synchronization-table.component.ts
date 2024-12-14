import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableData } from '../../containers/synchronization-table/synchronization-table.component';
import { CommonModule } from '@angular/common';
import { materialModules } from '@shared/materials';
import { DefaultPipe, ActionPanelComponent } from '@shared/index';
import { EmptyTemplateComponent } from '@shared/components';
import { ButtonLoadingDirective, OverFlowTooltipDirective } from '@shared/directives';
import { GetColumnNamePipe } from '../../pipes/get-column-name.pipe';

@Component({
  selector: 'app-manual-synchronization-table',
  standalone: true,
  imports: [
    CommonModule,
    materialModules.matButtonModule,
    materialModules.matTableModule,
    materialModules.matIconModule,
    GetColumnNamePipe,
    OverFlowTooltipDirective,
    ButtonLoadingDirective,
    EmptyTemplateComponent,
    DefaultPipe,
    ActionPanelComponent,
  ],
  templateUrl: './manual-synchronization-table.component.html',
  styleUrl: './manual-synchronization-table.component.scss',
})
export class ManualSynchronizationTableComponent {
  @Input() mappingTableData: TableData[] = [];
  @Input() displayedColumns: string[] = [];
  @Input() groupDisplayedColumns: string[] = [];
  @Input() columnsToShow: { [key: string]: string[] } = {};
  @Input() saveLoading: boolean = false;
  @Output() reset: EventEmitter<void> = new EventEmitter<void>();
  @Output() synchronize: EventEmitter<void> = new EventEmitter<void>();
  @Output() desync: EventEmitter<void> = new EventEmitter<void>();
}
