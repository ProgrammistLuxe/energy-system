import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { GlobalSearchData, GlobalSearchService } from '@services';
import { EmptyTemplateComponent, SearchFieldComponent, materialModules } from '@shared/index';
@Component({
  selector: 'app-global-search',
  imports: [
    CommonModule,
    RouterModule,
    SearchFieldComponent,
    EmptyTemplateComponent,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
  ],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.scss',
})
export class GlobalSearchComponent {
  items: GlobalSearchData[] = [];
  constructor(
    protected dialogRef: MatDialogRef<GlobalSearchComponent>,
    private globalSearchService: GlobalSearchService,
  ) {}

  search(value: string) {
    if (!value.trim()) {
      this.items = [];
      return;
    }
    this.items = this.globalSearchService.getSearchedContent(value);
  }
}
