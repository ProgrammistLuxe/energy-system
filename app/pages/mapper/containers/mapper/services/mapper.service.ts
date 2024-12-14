import { Injectable } from '@angular/core';
import { HttpClassTypeService, HttpIntegrationsService, HttpSynchronizationService } from '@api-calls/services';
import { ClassTypeAttr } from '@api-calls/services/http-class-type-service/models';
import { Integration, IntegrationClassType } from '@api-calls/services/http-integrations-service/models';
import {
  AddSyncAttrsByFormReq,
  DesyncAttrsReqModel,
  SyncAttrsReq,
} from '@api-calls/services/http-synchronization-service/models';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FilteredAttrs {
  [key: number]: ClassTypeAttr[];
}

@Injectable({ providedIn: 'root' })
export class MapperService {
  private _filteredAttrs: FilteredAttrs | null = null;
  private _selectedIntegration$: BehaviorSubject<Integration | null> = new BehaviorSubject<Integration | null>(null);
  private _selectedClassType$: BehaviorSubject<IntegrationClassType | null> =
    new BehaviorSubject<IntegrationClassType | null>(null);
  constructor(
    private httpIntegrationsService: HttpIntegrationsService,
    private httpClassTypeService: HttpClassTypeService,
    private httpSynchronizeService: HttpSynchronizationService,
  ) {}
  get filteredAttrs(): FilteredAttrs | null {
    return this._filteredAttrs;
  }
  set filteredAttrs(attrs: FilteredAttrs | null) {
    this._filteredAttrs = attrs;
  }

  get selectedIntegration$(): Observable<Integration | null> {
    return this._selectedIntegration$.asObservable();
  }
  get selectedIntegration(): Integration | null {
    return this._selectedIntegration$.value;
  }
  set selectedIntegration(integration: Integration | null) {
    this._selectedIntegration$.next(integration);
  }
  get selectedClassType$(): Observable<IntegrationClassType | null> {
    return this._selectedClassType$.asObservable();
  }
  get selectedClassType(): IntegrationClassType | null {
    return this._selectedClassType$.value;
  }
  set selectedClassType(class_type: IntegrationClassType | null) {
    this._selectedClassType$.next(class_type);
  }

  getIntegrationList() {
    return this.httpIntegrationsService.getIntegrationList();
  }
  getIntegration(id: number) {
    return this.httpIntegrationsService.getIntegrationById(id);
  }
  getClassTypeList(id: number) {
    return this.httpIntegrationsService.getClassTypeList(id);
  }
  getClassTypeAttrList(class_type_id: number) {
    return this.httpClassTypeService.getAttrsList(class_type_id);
  }
  getIntegrationParticipantList(integration_id: number) {
    return this.httpIntegrationsService.getIntegrationParticipantList(integration_id);
  }
  getSyncObjectList(class_id: number) {
    return this.httpSynchronizeService.getSyncObjectList(class_id);
  }
  getSyncObject(synchronization_id: number) {
    return this.httpSynchronizeService.getSyncObject(synchronization_id);
  }
  synchronize(data: SyncAttrsReq) {
    return this.httpSynchronizeService.synchronize(data);
  }
  desynchronize(data: DesyncAttrsReqModel) {
    return this.httpSynchronizeService.desynchronize(data);
  }
  addSyncAttrs(data: AddSyncAttrsByFormReq) {
    return this.httpSynchronizeService.addSyncObjects(data);
  }
}
