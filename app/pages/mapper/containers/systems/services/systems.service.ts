import { Injectable } from '@angular/core';
import { HttpParticipantsService } from '@api-calls/services';
import { UpdateParticipantReq } from '@api-calls/services/http-participants-service/models';

@Injectable()
export class SystemsService {
  constructor(private httpParticipantsServices: HttpParticipantsService) {}

  addSystem(name: string) {
    return this.httpParticipantsServices.addSystem(name);
  }
  updateSystem(data: UpdateParticipantReq) {
    return this.httpParticipantsServices.updateSystem(data);
  }
  getSystemList() {
    return this.httpParticipantsServices.getSystemList();
  }
  deleteSystem(id: number) {
    return this.httpParticipantsServices.deleteSystemById(id);
  }
  getSystemById(id: number) {
    return this.httpParticipantsServices.getSystemById(id);
  }
}
