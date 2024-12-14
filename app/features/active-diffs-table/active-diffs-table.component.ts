import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DiffItem, DiffService } from '@features/active-diffs-table/services/diff.service';
import { MatIconButtonCustomDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { DefaultPipe } from '@shared/pipes';

@Component({
  selector: 'app-active-diffs-table',
  imports: [
    CommonModule,
    materialModules.matTableModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matExpansionModule,
    materialModules.matTooltipModule,
    materialModules.matDividerModule,
    MatIconButtonCustomDirective,
    DefaultPipe,
  ],
  templateUrl: './active-diffs-table.component.html',
  styleUrl: './active-diffs-table.component.scss',
})
export class ActiveDiffsTableComponent {
  columns: string[] = ['place_name', 'diff_name', 'diff_id'];
  expanded: boolean = false;
  constructor(private diffService: DiffService) {}
  get diffList(): DiffItem[] {
    return this.diffService.diffList;
  }
}
