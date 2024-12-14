import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FilteredAttrs, MapperService } from '../../services/mapper.service';
import { NotificationsService } from '@services';
import { materialModules } from '@shared/materials';
import { ClassTypeAttr } from '@api-calls/services/http-class-type-service/models/get-class-type-attrs.model';
import { DefaultPipe } from '@shared/pipes';
import { IntegrationParticipant } from '@api-calls/services/http-integrations-service/models';
import { ReplaySubject } from 'rxjs';
import { ApiResolverComponent } from '@shared/components';
import { ActiveAttrPipe } from '../../pipes/active-attr.pipe';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-filter-attrs',
  standalone: true,
  imports: [
    CommonModule,
    materialModules.matTableModule,
    materialModules.matCheckBoxModule,
    materialModules.matButtonModule,
    materialModules.matDialogModule,
    ActiveAttrPipe,
    DefaultPipe,
    ApiResolverComponent,
  ],
  templateUrl: './filter-attrs.component.html',
  styleUrl: './filter-attrs.component.scss',
})
export class FilterAttrsComponent {
  displayedColumns: string[] = [];
  attrsTableData: { [key: string]: ClassTypeAttr }[] = [];
  private startFilteredAttrs: FilteredAttrs | null = null;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    protected data: {
      integrationParticipantList: IntegrationParticipant[];
      attrList: ClassTypeAttr[];
    },
    private dialogRef: MatDialogRef<FilterAttrsComponent>,
    private notificationsService: NotificationsService,
    private mapperService: MapperService,
  ) {}
  get filteredAttrs() {
    return this.mapperService.filteredAttrs;
  }
  applyFilter() {
    this.notificationsService.displayMessage(
      'Успешно применено',
      'Выбранные вами фильтры успешно применены',
      'success',
      3000,
    );
    this.dialogRef.close(true);
  }
  checkedChange(event: MatCheckboxChange, attr: ClassTypeAttr) {
    if (!this.mapperService.filteredAttrs) {
      this.mapperService.filteredAttrs = {};
    }
    if (event.checked) {
      this.mapperService.filteredAttrs[attr.participant_id] = [
        ...(this.mapperService.filteredAttrs[attr.participant_id] || []),
        attr,
      ];
    } else {
      this.mapperService.filteredAttrs[attr.participant_id] = this.mapperService.filteredAttrs[
        attr.participant_id
      ].filter((item) => item.id !== attr.id);
    }
  }
  cancelFilers() {
    this.mapperService.filteredAttrs = this.startFilteredAttrs;
    this.dialogRef.close();
  }
  private calculateAttrsTableData() {
    const data: { [key: string]: ClassTypeAttr }[] = [];
    this.data.integrationParticipantList.forEach((participant) => {
      this.data.attrList
        .filter((attr) => attr.participant_id === participant.id)
        .forEach((item, index) => {
          if (!data[index]) {
            data[index] = {};
          }
          data[index][participant.name] = item;
        });
    });
    this.attrsTableData = data;
    this.displayedColumns = this.data.integrationParticipantList.map((participant) => participant.name);
    this.startFilteredAttrs = structuredClone(this.mapperService.filteredAttrs);
  }
  ngOnInit() {
    this.calculateAttrsTableData();
  }
}
