import { Injectable } from '@angular/core';
import { HttpClassTypeService, HttpIntegrationsService, HttpSynchronizationService } from '@api-calls/services';
import { AddSyncAttrsReq } from '@api-calls/services/http-synchronization-service/models';

@Injectable()
export class UploadDataService {
  constructor(
    private httpSynchronizationService: HttpSynchronizationService,
    private httpClassTypeService: HttpClassTypeService,
    private httpIntegrationService: HttpIntegrationsService,
  ) {}
  uploadFile(data: AddSyncAttrsReq) {
    return this.httpSynchronizationService.addSyncAttrsFromFile(data);
  }
  getClassList() {
    return this.httpClassTypeService.getClassTypeList();
  }
  getAttrList(class_id: number) {
    return this.httpClassTypeService.getAttrsList(class_id);
  }
  getIntegrationList() {
    return this.httpIntegrationService.getIntegrationList();
  }
  getIntegrationClassList(integration_id: number) {
    return this.httpIntegrationService.getClassTypeList(integration_id);
  }
}
