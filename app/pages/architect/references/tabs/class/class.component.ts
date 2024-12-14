import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpReferencesService } from '@api-calls/services/http-references/http-references.service';
import { ReferencesClass } from '@api-calls/services/http-references/models/class';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import {
  ApiResolverComponent,
  DeleteConfirmDialogTemplateComponent,
  EmptyTemplateComponent,
  SearchFieldComponent,
  WorkAreaComponent,
} from '@shared/components';
import {
  AddButtonDirective,
  DefaultPipe,
  DialogService,
  MatIconButtonCustomDirective,
  OverFlowTooltipDirective,
  materialModules,
} from '@shared/index';
import { ReplaySubject, filter, finalize, takeUntil, timer } from 'rxjs';
import { ReferencesService } from '../../services/references.service';
import { CreateClassComponent } from './components/create-class/create-class.component';
import { EditClassComponent } from './components/edit-class/edit-class.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AttrsTableComponent } from './components/attrs-table/attrs-table.component';

@Component({
  selector: 'app-references-class',
  imports: [
    CommonModule,
    SearchFieldComponent,
    ApiResolverComponent,
    EmptyTemplateComponent,
    DefaultPipe,
    OverFlowTooltipDirective,
    MatIconButtonCustomDirective,
    AddButtonDirective,
    AttrsTableComponent,
    materialModules.matTableModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matSortModule,
  ],
  templateUrl: './class.component.html',
  styleUrl: './class.component.scss',
})
export class ClassComponent {
  @ViewChild(MatSort) sort: MatSort | undefined;
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  tableData: ReferencesClass[] = [];
  filteredTableData: ReferencesClass[] = [];
  dataSource: MatTableDataSource<ReferencesClass> = new MatTableDataSource<ReferencesClass>();
  columns: string[] = ['details', 'description', 'class_name', 'parent', 'explanation', 'is_library', 'actions'];
  fieldsToSearch: string[] = ['Имя класса', 'Смысловое определение основного класса'];
  expandedElement: ReferencesClass | null = null;
  private class_id: string | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private searchValue: string = '';
  constructor(
    private httpReferencesService: HttpReferencesService,
    private referenceService: ReferencesService,
    private notificationsService: NotificationsService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}
  scrollToRow(id: number | null) {
    if (!id) {
      return;
    }
    const elem = document.getElementById(String(id));
    if (!!elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.classList.add('active');
      const stop$: ReplaySubject<void> = new ReplaySubject<void>();
      timer(2000)
        .pipe(takeUntil(stop$))
        .subscribe(() => {
          elem.classList.remove('active');
          stop$.next();
          stop$.complete();
        });
    }
  }
  searchData(value: string | null = null) {
    if (value !== null) {
      this.searchValue = value.trim().toLowerCase();
    }
    const searchValue = value === null ? this.searchValue : value.trim().toLowerCase();
    if (!searchValue) {
      this.dataSource = new MatTableDataSource<ReferencesClass>(this.tableData);
    } else {
      this.filteredTableData = this.tableData.filter(
        (item) =>
          item.class_name.toLowerCase().includes(searchValue) || item.description.toLowerCase().includes(searchValue),
      );
      this.dataSource = new MatTableDataSource<ReferencesClass>(this.filteredTableData);
    }
  }
  getData() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.httpReferencesService
      .getReferencesClass()
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
          return;
        }
        this.tableData = response.result;
        this.filteredTableData = response.result;
        this.dataSource = new MatTableDataSource<ReferencesClass>(this.tableData);
        this.searchData();

        setTimeout(() => {
          if (!this.class_id) {
            return;
          }
          this.scrollToRow(+this.class_id);
          this.router.navigate([], { relativeTo: this.route, queryParams: { class_id: null } });
          this.class_id = null;
        }, 1000);
      });
  }
  editItem(item: ReferencesClass) {
    const dialogRef = this.dialogService.open<EditClassComponent>(EditClassComponent, {
      title: 'Обновить класс',
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
    const dialogRef = this.dialogService.open<CreateClassComponent>(CreateClassComponent, {
      title: 'Добавить класс',
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
  deleteItem(item: ReferencesClass) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить класс',
        data: `Вы уверены хотите удалить класс "${item.class_name}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.referenceService
          .deleteClass(item.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Класс успешно удален', 'success', 3000);
            this.getData();
          });
      });
  }
  ngOnInit() {
    this.class_id = this.route.snapshot.queryParamMap.get('class_id');
    this.getData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
