import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { EnergyElementIcon } from './models';

@Injectable({
  providedIn: 'root',
})
export class HttpIconsService {
  constructor(private apiService: ApiService) {}

  getEnergyElementsIcons() {
    return this.apiService.request<EnergyElementIcon[]>(new JSONRpcRequest('GetPrimitivesClass', {}));
  }
}
