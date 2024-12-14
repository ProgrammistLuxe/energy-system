import { Injectable } from '@angular/core';
import { HttpSynchronizationJournalServiceService } from '@api-calls/services';
import { GetRecordsListReq } from '@api-calls/services/http-synchronization-journal-service/models';

@Injectable()
export class SynchronizationService {
  constructor(private httpSyncJournalsService: HttpSynchronizationJournalServiceService) {}
  getRecordsList(req: GetRecordsListReq) {
    return this.httpSyncJournalsService.getLogs(req);
  }
  getLevelsList() {
    return this.httpSyncJournalsService.getLevels();
  }
  getSourceList() {
    return this.httpSyncJournalsService.getSources();
  }
  getJournalNames() {
    return this.httpSyncJournalsService.getJournalNames();
  }
}
