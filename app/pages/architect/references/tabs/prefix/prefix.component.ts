import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpReferencesService } from '@api-calls/services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import {
  SearchFieldComponent,
  ApiResolverComponent,
  EmptyTemplateComponent,
  DeleteConfirmDialogTemplateComponent,
} from '@shared/components';
import { OverFlowTooltipDirective, MatIconButtonCustomDirective, AddButtonDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { DefaultPipe } from '@shared/pipes';
import { DialogService } from '@shared/services';
import { ReplaySubject, finalize, takeUntil, filter } from 'rxjs';
import { ReferencesService } from '../../services/references.service';
import { CreatePrefixComponent } from './components/create-prefix/create-prefix.component';
import { EditPrefixComponent } from './components/edit-prefix/edit-prefix.component';
import { ReferencePrefix } from '@api-calls/services/http-references/models/get-prefix-res.model';

@Component({
  selector: 'app-prefix',
  imports: [
    CommonModule,
    SearchFieldComponent,
    ApiResolverComponent,
    EmptyTemplateComponent,
    DefaultPipe,
    MatIconButtonCustomDirective,
    AddButtonDirective,
    materialModules.matTableModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matSortModule,
  ],
  templateUrl: './prefix.component.html',
  styleUrl: './prefix.component.scss',
})
export class PrefixComponent {
  @ViewChild(MatSort) sort: MatSort | undefined;
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  tableData: ReferencePrefix[] = [];
  filteredTableData: ReferencePrefix[] = [];
  dataSource: MatTableDataSource<ReferencePrefix> = new MatTableDataSource<ReferencePrefix>();
  columns: string[] = ['id', 'short_name', 'full_name', 'description', 'actions'];
  private searchValue: string = '';
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private httpReferencesService: HttpReferencesService,
    private referenceService: ReferencesService,
    private notificationsService: NotificationsService,
    private dialogService: DialogService,
  ) {}
  searchData(value: string | null = null) {
    if (value !== null) {
      this.searchValue = value.trim().toLowerCase();
    }
    const searchValue = value === null ? this.searchValue : value.trim().toLowerCase();
    if (!searchValue) {
      this.dataSource = new MatTableDataSource<ReferencePrefix>(this.tableData);
    } else {
      this.filteredTableData = this.tableData.filter(
        (item) =>
          item.full_name.toLowerCase().includes(searchValue) ||
          item.short_name.toLowerCase().includes(searchValue) ||
          item.description?.toLowerCase().includes(searchValue),
      );
      this.dataSource = new MatTableDataSource<ReferencePrefix>(this.filteredTableData);
    }
  }
  getData() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.httpReferencesService
      .getPrefixList()
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.tableData = response.result;
          this.filteredTableData = response.result;
          this.dataSource = new MatTableDataSource<ReferencePrefix>(this.tableData);
          this.searchData();
        } else {
          this.errorCode = +response;
          this.errorMessage = String(response);
        }
      });
  }
  editItem(item: ReferencePrefix) {
    const dialogRef = this.dialogService.open<EditPrefixComponent>(EditPrefixComponent, {
      title: 'Обновить префикс',
      width: '480px',
      data: item,
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.getData();
      });
  }
  addItem() {
    const dialogRef = this.dialogService.open<CreatePrefixComponent>(CreatePrefixComponent, {
      title: 'Добавить префикс',
      width: '480px',
      autoFocus: false,
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.getData();
      });
  }
  deleteItem(item: ReferencePrefix) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить префикс',
        data: `Вы уверены хотите удалить префикс "${item.short_name}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.referenceService
          .deletePrefix(item.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Префикс успешно удален', 'success', 3000);
            this.getData();
          });
      });
  }
  ngOnInit() {
    this.getData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
