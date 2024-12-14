import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IntegrationService } from '../../services/integration.service';
import { NotificationsService } from '@services';
import {
  ActionPanelComponent,
  ApiResolverComponent,
  DeleteConfirmDialogTemplateComponent,
  EmptyTemplateComponent,
} from '@shared/components';
import { materialModules } from '@shared/materials';
import { DialogService } from '@shared/services';
import { filter, finalize, ReplaySubject, takeUntil } from 'rxjs';
import { MatIconButtonCustomDirective } from '@shared/directives';
import { ClassTypeAttr } from '@api-calls/services/http-class-type-service/models';
import { DefaultPipe } from '@shared/pipes';
import { AddAttrsRowComponent } from '../../components/add-attr/add-attr.component';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';

@Component({
  selector: 'app-attrs',
  standalone: true,
  imports: [
    CommonModule,
    ApiResolverComponent,
    EmptyTemplateComponent,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matTableModule,
    materialModules.matTooltipModule,
    DefaultPipe,
    MatIconButtonCustomDirective,
    ActionPanelComponent,
  ],
  templateUrl: './attrs.component.html',
  styleUrl: './attrs.component.scss',
})
export class AttrsComponent {
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  classTypeId: number | null = null;
  attrsList: ClassTypeAttr[] = [];
  displayedColumns: string[] = [];
  attrsTableData: { [key: string]: ClassTypeAttr }[] = [];

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private integrationService: IntegrationService,
    private dialogService: DialogService,
    private notificationsService: NotificationsService,
  ) {}
  get integrationParticipantList() {
    return this.integrationService.integrationParticipantsList;
  }
  getAttrList() {
    if (!this.classTypeId) {
      return;
    }
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.integrationService
      .getClassTypeAttrList(this.classTypeId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.attrsList = response.result.data;
          this.calculateAttrsTableData();
        }
      });
  }
  deleteAttr(attr: ClassTypeAttr) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить элемент',
        data: 'Вы уверены хотите удалить элемент?',
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.integrationService
          .deleteAttr(attr.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (response.error) {
              const error = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', error, 'error');
              return;
            }
            this.getAttrList();
            this.notificationsService.displayMessage('Успех', `Атрибут ${attr.name} успешно удален`, 'success', 3000);
          });
      });
  }
  editAttr(attr: ClassTypeAttr | null = null) {
    if (!this.classTypeId) {
      return;
    }
    if (!!attr) {
      const dialogRef = this.dialogService.open(AddAttrsRowComponent, {
        width: '420px',
        title: 'Обновить атрибут',
        data: {
          participants: this.integrationParticipantList,
          class_id: this.classTypeId,
          mode: 'edit',
          attr,
          selectedSystem: this.integrationParticipantList.find((item) => item.id === attr.participant_id),
        },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getAttrList();
      });
    } else {
      const dialogRef = this.dialogService.open(AddAttrsRowComponent, {
        width: '420px',
        title: 'Добавить атрибут',
        data: { participants: this.integrationParticipantList, class_id: this.classTypeId, mode: 'add' },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getAttrList();
      });
    }
  }
  private calculateAttrsTableData() {
    const data: { [key: string]: ClassTypeAttr }[] = [];
    this.integrationParticipantList.forEach((participant) => {
      this.attrsList
        .filter((attr) => attr.participant_id === participant.id)
        .forEach((item, index) => {
          if (!data[index]) {
            data[index] = {};
          }
          data[index][participant.name] = item;
        });
    });
    this.attrsTableData = data;
    this.displayedColumns = this.integrationParticipantList.map((participant) => participant.name);
  }
  ngOnInit() {
    this.integrationService.selectedClassType$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (!data) {
        this.attrsList = [];
        return;
      }
      this.classTypeId = data.id;
      this.getAttrList();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
