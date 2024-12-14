import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpReferencesService } from '@api-calls/services/http-references/http-references.service';
import { AttributeClass, ReferencesAttribute } from '@api-calls/services/http-references/models/attribute';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import {
  ApiResolverComponent,
  DeleteConfirmDialogTemplateComponent,
  EmptyTemplateComponent,
  SearchFieldComponent,
} from '@shared/components';
import {
  AddButtonDirective,
  DialogService,
  MatIconButtonCustomDirective,
  OverFlowTooltipDirective,
} from '@shared/index';
import { materialModules } from '@shared/materials';
import { DefaultPipe } from '@shared/pipes';
import { ReplaySubject, filter, finalize, takeUntil } from 'rxjs';
import { ReferencesService } from '../../services/references.service';
import { NotificationsService } from '@services';
import { CreateAttributeComponent } from './components/create-attribute/create-attribute.component';
import { EditAttributeComponent } from './components/edit-attribute/edit-attribute.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-references-attribute',
  imports: [
    CommonModule,
    ApiResolverComponent,
    EmptyTemplateComponent,
    SearchFieldComponent,
    DefaultPipe,
    OverFlowTooltipDirective,
    MatIconButtonCustomDirective,
    AddButtonDirective,
    materialModules.matTableModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
  ],
  templateUrl: './attribute.component.html',
  styleUrl: './attribute.component.scss',
})
export class AttributeComponent {
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  tableData: ReferencesAttribute[] = [];
  filteredTableData: ReferencesAttribute[] = [];
  dataSource: MatTableDataSource<ReferencesAttribute> = new MatTableDataSource<ReferencesAttribute>();
  columns: string[] = ['name', 'description', 'attributes_class', 'type', 'explanation', 'actions'];
  fieldsToSearch: string[] = ['Смысловое назначение атрибута', 'Имя атрибута (англ.)', 'Имя класса атрибута (англ.)'];
  private searchValue: string = '';
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private httpReferencesService: HttpReferencesService,
    private referenceService: ReferencesService,
    private notificationsService: NotificationsService,
    private dialogService: DialogService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  goToClass(item: AttributeClass | null) {
    if (!item) {
      return;
    }
    this.router.navigate(['./class'], { relativeTo: this.route, queryParams: { class_id: item.id } });
  }
  searchData(value: string | null = null) {
    if (value !== null) {
      this.searchValue = value.trim().toLowerCase();
    }
    const searchValue = value === null ? this.searchValue : value.trim().toLowerCase();
    if (!searchValue) {
      this.dataSource = new MatTableDataSource<ReferencesAttribute>(this.tableData);
    } else {
      this.filteredTableData = this.tableData.filter(
        (item) =>
          item.description.toLowerCase().includes(searchValue) ||
          item.attributes_class.class_name.toLowerCase().includes(searchValue) ||
          item.name.toLowerCase().includes(searchValue),
      );
      this.dataSource = new MatTableDataSource<ReferencesAttribute>(this.filteredTableData);
    }
  }
  getData() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.httpReferencesService
      .getReferencesAttribute()
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.tableData = response.result;
          this.filteredTableData = response.result;
          this.dataSource = new MatTableDataSource<ReferencesAttribute>(this.tableData);
          this.searchData();
        } else {
          this.errorCode = +response;
          this.errorMessage = String(response);
        }
      });
  }
  editItem(item: ReferencesAttribute) {
    const dialogRef = this.dialogService.open<EditAttributeComponent>(EditAttributeComponent, {
      title: 'Обновить атрибут',
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
    const dialogRef = this.dialogService.open<CreateAttributeComponent>(CreateAttributeComponent, {
      title: 'Добавить атрибут',
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
  deleteItem(item: ReferencesAttribute) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить атрибут',
        data: `Вы уверены хотите удалить атрибут "${item.name}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.referenceService
          .deleteAttribute(item.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Атрибут успешно удален', 'success', 3000);
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
