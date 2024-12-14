import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpReferencesService } from '@api-calls/services/http-references/http-references.service';
import { ReferencesAssociation } from '@api-calls/services/http-references/models/associations';
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
import { CreateAssociationComponent } from './components/create-association/create-association.component';
import { EditAssociationComponent } from './components/edit-association/edit-association.component';

@Component({
  selector: 'app-references-association',
  imports: [
    CommonModule,
    ApiResolverComponent,
    EmptyTemplateComponent,
    DefaultPipe,
    SearchFieldComponent,
    OverFlowTooltipDirective,
    MatIconButtonCustomDirective,
    AddButtonDirective,
    materialModules.matTableModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
  ],
  templateUrl: './association.component.html',
  styleUrl: './association.component.scss',
})
export class AssociationComponent {
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  tableData: ReferencesAssociation[] = [];
  filteredTableData: ReferencesAssociation[] = [];
  dataSource: MatTableDataSource<ReferencesAssociation> = new MatTableDataSource<ReferencesAssociation>();
  fieldsToSearch: string[] = [
    'Смысловое назначение ассоциации',
    'Начальный класс',
    'Конечный класс',
    'Имя ассоциации (англ.)',
  ];
  columns: string[] = ['description', 'initial_class', 'final_class', 'name', 'multiplicity', 'explanation', 'actions'];

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private searchValue: string = '';

  constructor(
    private httpReferencesService: HttpReferencesService,
    private dialogService: DialogService,
    private referenceService: ReferencesService,
    private notificationsService: NotificationsService,
  ) {}
  searchData(value: string | null = null) {
    if (value !== null) {
      this.searchValue = value.trim().toLowerCase();
    }
    const searchValue = value === null ? this.searchValue : value.trim().toLowerCase();
    if (!searchValue) {
      this.dataSource = new MatTableDataSource<ReferencesAssociation>(this.tableData);
    } else {
      this.filteredTableData = this.tableData.filter(
        (item) =>
          item.description.toLowerCase().includes(searchValue) ||
          item.final_class.class_name.toLowerCase().includes(searchValue) ||
          item.initial_class.class_name.toLowerCase().includes(searchValue) ||
          item.name.toLowerCase().includes(searchValue),
      );
      this.dataSource = new MatTableDataSource<ReferencesAssociation>(this.filteredTableData);
    }
  }
  editItem(item: ReferencesAssociation) {
    const dialogRef = this.dialogService.open<EditAssociationComponent>(EditAssociationComponent, {
      title: 'Обновить ассоциацию',
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
    const dialogRef = this.dialogService.open<CreateAssociationComponent>(CreateAssociationComponent, {
      title: 'Добавить ассоциацию',
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
  deleteItem(item: ReferencesAssociation) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить ассоциацию',
        data: `Вы уверены хотите удалить ассоциацию "${item.name}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.referenceService
          .deleteAssociation(item.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Ассоциация успешно удалена', 'success', 3000);
            this.getData();
          });
      });
  }
  getData() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.httpReferencesService
      .getReferencesAssociations()
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.tableData = response.result;
          this.filteredTableData = response.result;
          this.dataSource = new MatTableDataSource<ReferencesAssociation>(this.tableData);
          this.searchData();
        } else {
          this.errorCode = +response;
          this.errorMessage = String(response);
        }
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
