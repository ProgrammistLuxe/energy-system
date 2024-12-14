import { Component, Input } from '@angular/core';
import { IntegrationClassType, IntegrationParticipant } from '@api-calls/services/http-integrations-service/models';
import { MapperService } from '../../services/mapper.service';
import { DialogService } from '@shared/services';
import { finalize, forkJoin, ReplaySubject, takeUntil } from 'rxjs';
import { SyncObject, SyncObjectAttr } from '@api-calls/services/http-synchronization-service/models';
import { CommonModule } from '@angular/common';
import { materialModules } from '@shared/materials';
import {
  ActionPanelComponent,
  ApiResolverComponent,
  ConfirmDialogComponent,
  EmptyTemplateComponent,
  SearchFieldComponent,
} from '@shared/components';
import { FilterAttrsComponent } from '../../components/filter-attrs/filter-attrs.component';
import { DefaultPipe } from '@shared/pipes';
import { NotificationsService } from '@services';
import { ManualSynchronizationTableComponent } from '../../components/manual-synchronization-table/manual-synchronization-table.component';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { ClassTypeAttr } from '@api-calls/services/http-class-type-service/models';
import { OverFlowTooltipDirective } from '@shared/directives';
import { GetColumnNamePipe } from '../../pipes/get-column-name.pipe';

export interface TableData {
  sync_obj_id: number;
  data: {
    [key: string]: {
      [key: string]: SyncObjectAttr;
    };
  };
}
@Component({
  selector: 'app-synchronization-table',
  standalone: true,
  imports: [
    CommonModule,
    materialModules.matTableModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matFormFieldModule,
    materialModules.formsModule,
    materialModules.matOptionModule,
    materialModules.matSelectModule,
    GetColumnNamePipe,
    ManualSynchronizationTableComponent,
    OverFlowTooltipDirective,
    SearchFieldComponent,
    DefaultPipe,
    ActionPanelComponent,
    EmptyTemplateComponent,
    ApiResolverComponent,
  ],
  templateUrl: './synchronization-table.component.html',
  styleUrl: './synchronization-table.component.scss',
})
export class SynchronizationTableComponent {
  @Input() integrationParticipantList: IntegrationParticipant[] = [];
  @Input() classTypeList: IntegrationClassType[] = [];
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  syncObjectList: SyncObject[] = [];
  displayedColumns: string[] = [];
  groupDisplayedColumns: string[] = [];
  tableData: TableData[] = [];
  filteredTableData: TableData[] = [];
  mappingTableData: TableData[] = [];
  saveLoading: boolean = false;
  attrList: ClassTypeAttr[] = [];
  columnsToShow: { [key: string]: string[] } = {};
  private searchValue: string = '';
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private mapperService: MapperService,
    private dialogService: DialogService,
    private notificationsService: NotificationsService,
  ) {}
  get selectedClassType() {
    return this.mapperService.selectedClassType;
  }
  desync() {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Подтверждение',
      data: 'Вы уверены, что хотите разъединить выбранные объекты?',
    });
    dialogRef.afterClosed().subscribe((data) => {
      if (!this.mapperService.selectedClassType) {
        return;
      }
      if (data) {
        this.saveLoading = true;
        const idList = this.mappingTableData.map((item) => item.sync_obj_id);
        this.mapperService
          .desynchronize({ class_type_id: this.mapperService.selectedClassType.id, sync_object_list: idList })
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.saveLoading = false)),
          )
          .subscribe((response) => {
            if (response.error) {
              const message = getErrorsMessage(response.error) || 'Ошибка разъединения';
              this.notificationsService.displayMessage('Ошибка', message, 'error');
            } else {
              this.notificationsService.displayMessage(
                'Успех',
                'Выбранные вами объекты успешно разъединились',
                'success',
                3000,
              );
              this.mappingTableData = [];
              this.getSyncObjectList();
            }
          });
      }
    });
  }

  synchronize() {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Подтверждение',
      data: 'Вы уверены, что хотите соединить выбранные объекты?',
    });
    dialogRef.afterClosed().subscribe((data) => {
      if (!this.mapperService.selectedClassType) {
        return;
      }
      if (data) {
        this.saveLoading = true;
        const idList = this.mappingTableData.map((item) => item.sync_obj_id);
        this.mapperService
          .synchronize({ class_type_id: this.mapperService.selectedClassType.id, merge_object_list: idList })
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.saveLoading = false)),
          )
          .subscribe((response) => {
            if (response.error) {
              const message = getErrorsMessage(response.error) || 'Ошибка соединения';
              this.notificationsService.displayMessage('Ошибка', message, 'error');
            } else {
              this.notificationsService.displayMessage(
                'Успех',
                'Выбранные вами объекты успешно соединились',
                'success',
                3000,
              );
              this.mappingTableData = [];
              this.getSyncObjectList();
            }
          });
      }
    });
  }
  reset() {
    this.mappingTableData = [];
  }
  onSearchValueChanged(value: string) {
    this.searchValue = value.trim().toLowerCase();
    this.filterTableData();
  }
  setSelectedType(value: IntegrationClassType | null) {
    this.mapperService.selectedClassType = value;
  }
  openFilterDialog() {
    const participants = this.integrationParticipantList.filter((item) =>
      this.getSyncObjParticipants().some((el) => el.participant_id === item.id),
    );

    const dialogRef = this.dialogService.open(FilterAttrsComponent, {
      width: '1000px',
      title: 'Настройки отображения атрибутов',
      data: {
        integrationParticipantList: participants,
        attrList: this.attrList,
      },
      panelClass: 'filter-attrs',
    });
    dialogRef.afterClosed().subscribe((data) => {
      if (!data) {
        return;
      }
      this.calculateTableData();
    });
  }
  getSyncObjectList() {
    if (!this.mapperService.selectedClassType) {
      return;
    }
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.mapperService
      .getSyncObjectList(this.mapperService.selectedClassType.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.syncObjectList = response.result.data;
          this.calculateTableData();
        }
      });
  }

  addToMapping(sync_obj: TableData) {
    if (this.mappingTableData.length >= 2) {
      this.notificationsService.displayMessage(
        'Действие невозможно',
        'В таблицу ручного маппинга можно добавить только 2 записи',
        'info',
        3000,
      );
      return;
    }
    this.mappingTableData = this.mappingTableData.concat(sync_obj);
  }
  loadData() {
    const id = this.mapperService.selectedClassType?.id;
    if (!id) {
      return;
    }
    this.attrList = [];
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    forkJoin([this.mapperService.getClassTypeAttrList(id), this.mapperService.getSyncObjectList(id)])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe(([res1, res2]) => {
        this.mapperService.filteredAttrs = null;
        if (res2.error) {
          this.errorCode = +res1;
          this.errorMessage = String(res2);
        } else {
          this.syncObjectList = res2.result.data;
        }
        if (!res1.error) {
          this.attrList = res1.result.data;
          this.getSyncObjParticipants().forEach((item) => {
            if (!this.mapperService.filteredAttrs) {
              this.mapperService.filteredAttrs = {};
            }
            this.mapperService.filteredAttrs = {
              ...this.mapperService.filteredAttrs,
              [item.participant_id]: this.attrList.filter((attr) => attr.participant_id === item.participant_id),
            };
          });
        }
        this.calculateTableData();
      });
  }
  private getSyncObjParticipants() {
    if (!this.syncObjectList.length) {
      return [];
    }
    let maxParticipantsObj = this.syncObjectList[0];
    this.syncObjectList.forEach((item) => {
      if (item.participants.length > maxParticipantsObj.participants.length) {
        maxParticipantsObj = item;
      }
    });
    return maxParticipantsObj.participants;
  }
  private filterTableData() {
    if (!this.searchValue) {
      this.filteredTableData = structuredClone(this.tableData);
      return;
    }
    this.filteredTableData = this.tableData.filter((item) => {
      return Object.keys(item.data).some((key) => {
        return Object.keys(item.data[key]).some((child_key) =>
          item.data[key][child_key].value.includes(this.searchValue),
        );
      });
    });
  }
  private calculateTableData() {
    this.displayedColumns = [];
    this.tableData = [];
    this.columnsToShow = {};
    if (!this.mapperService.selectedClassType) {
      return;
    }
    if (!this.syncObjectList.length) {
      return;
    }
    const data: TableData[] = [];
    let maxParticipantsObj = this.syncObjectList[0];
    this.syncObjectList.forEach((item) => {
      if (item.participants.length > maxParticipantsObj.participants.length) {
        maxParticipantsObj = item;
      }
    });
    this.groupDisplayedColumns = this.integrationParticipantList
      .filter((item) => this.getSyncObjParticipants().some((el) => el.participant_id === item.id))
      .map((participant) => participant.name);
    this.integrationParticipantList.forEach((participant) => {
      const foundedParticipant = this.getSyncObjParticipants().find((item) => item.participant_id === participant.id);
      if (!foundedParticipant) {
        return;
      }
      foundedParticipant.attributes.forEach((attr) => {
        const isActiveAttr = this.mapperService.filteredAttrs?.[participant.id]
          ?.map((el) => el.name)
          .some((item) => item === attr.name);
        if (isActiveAttr) {
          this.displayedColumns.push(participant.name + attr.name);
        }
      });
    });
    this.groupDisplayedColumns.forEach((column) => {
      this.columnsToShow = {
        ...this.columnsToShow,
        [column]: this.displayedColumns.filter((item) => item.includes(column)),
      };
    });

    if (!this.displayedColumns.length) {
      return;
    }

    this.syncObjectList.forEach((obj, index) =>
      obj.participants.forEach((participant) => {
        participant.attributes.forEach((attr) => {
          const participant_name = this.integrationParticipantList.find(
            (item) => item.id === participant.participant_id,
          )?.name;
          if (!participant_name) {
            return;
          }
          if (!data[index]) {
            data[index] = {
              sync_obj_id: obj.synchronization_id,
              data: {},
            };
          }

          const isActiveAttr = this.mapperService.filteredAttrs?.[participant.participant_id]
            ?.map((el) => el.name)
            .some((item) => item === attr.name);
          if (!isActiveAttr) {
            return;
          }
          if (!data[index].data[participant_name]) {
            data[index].data[participant_name] = {};
          }
          data[index].data[participant_name][participant_name + attr.name] = attr;
        });
      }),
    );
    this.tableData = data;
    this.filterTableData();
  }
  ngOnInit() {
    this.mapperService.selectedClassType$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (!data) {
        return;
      }
      this.loadData();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
