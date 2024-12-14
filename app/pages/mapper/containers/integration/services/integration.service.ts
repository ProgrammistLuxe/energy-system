import { Injectable } from '@angular/core';
import {
  HttpAttributesService,
  HttpClassTypeService,
  HttpIntegrationsService,
  HttpParticipantsService,
} from '@api-calls/services';
import { AddAttributeReq, UpdateAttrReq } from '@api-calls/services/http-attributes-service/models';
import { AddClassTypeReq, UpdateClassTypeReq } from '@api-calls/services/http-class-type-service/models';
import {
  AddParticipantsReq,
  DeleteParticipantReq,
  Integration,
  IntegrationParticipant,
} from '@api-calls/services/http-integrations-service/models';
import { IntegrationClassType } from '@api-calls/services/http-integrations-service/models/integration-class-type.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class IntegrationService {
  private _selectedIntegration$: BehaviorSubject<Integration | null> = new BehaviorSubject<Integration | null>(null);
  private _selectedClassType$: BehaviorSubject<IntegrationClassType | null> =
    new BehaviorSubject<IntegrationClassType | null>(null);
  private _integrationParticipantList$: BehaviorSubject<IntegrationParticipant[]> = new BehaviorSubject<
    IntegrationParticipant[]
  >([]);

  constructor(
    private httpAttributesService: HttpAttributesService,
    private httpParticipantsService: HttpParticipantsService,
    private httpIntegrationsService: HttpIntegrationsService,
    private httpClassTypeService: HttpClassTypeService,
  ) {}

  get selectedClassType$(): Observable<IntegrationClassType | null> {
    return this._selectedClassType$.asObservable();
  }
  get selectedClassType(): IntegrationClassType | null {
    return this._selectedClassType$.value;
  }
  set selectedClassType(class_type: IntegrationClassType | null) {
    this._selectedClassType$.next(class_type);
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

  get integrationParticipantsList$(): Observable<IntegrationParticipant[]> {
    return this._integrationParticipantList$.asObservable();
  }
  get integrationParticipantsList(): IntegrationParticipant[] {
    return this._integrationParticipantList$.value;
  }
  set integrationParticipantsList(value: IntegrationParticipant[]) {
    this._integrationParticipantList$.next(value);
  }

  getParticipantList() {
    return this.httpParticipantsService.getSystemList();
  }
  getIntegrationList() {
    return this.httpIntegrationsService.getIntegrationList();
  }
  getIntegrationById(integration_id: number) {
    return this.httpIntegrationsService.getIntegrationById(integration_id);
  }
  addIntegration(name: string) {
    return this.httpIntegrationsService.addIntegration(name);
  }
  updateIntegration(integration_id: number, name: string) {
    return this.httpIntegrationsService.updateIntegration(integration_id, name);
  }
  deleteIntegration(integration_id: number) {
    return this.httpIntegrationsService.deleteIntegration(integration_id);
  }
  getIntegrationParticipantList(integration_id: number) {
    return this.httpIntegrationsService.getIntegrationParticipantList(integration_id);
  }
  addParticipantsToIntegration(data: AddParticipantsReq) {
    return this.httpIntegrationsService.addParticipantsToIntegration(data);
  }
  deleteParticipantFromIntegration(data: DeleteParticipantReq) {
    return this.httpIntegrationsService.deleteParticipantFromIntegration(data);
  }
  getIntegrationClassTypeList(integration_id: number) {
    return this.httpIntegrationsService.getClassTypeList(integration_id);
  }
  addClassType(data: AddClassTypeReq) {
    return this.httpClassTypeService.addClassType(data);
  }
  getClassTypeById(class_type_id: number) {
    return this.httpClassTypeService.getClassTypeById(class_type_id);
  }
  updateClassType(data: UpdateClassTypeReq) {
    return this.httpClassTypeService.updateClassType(data);
  }
  deleteClassType(class_type_id: number) {
    return this.httpClassTypeService.deleteClassType(class_type_id);
  }
  getClassTypeAttrList(class_type_id: number) {
    return this.httpClassTypeService.getAttrsList(class_type_id);
  }
  addAttr(data: AddAttributeReq) {
    return this.httpAttributesService.addAttribute(data);
  }
  deleteAttr(attribute_id: number) {
    return this.httpAttributesService.deleteAttribute(attribute_id);
  }
  getAttrTypeList() {
    return this.httpAttributesService.getTypeList();
  }
  updateAttr(data: UpdateAttrReq) {
    return this.httpAttributesService.updateAttribute(data);
  }
}
