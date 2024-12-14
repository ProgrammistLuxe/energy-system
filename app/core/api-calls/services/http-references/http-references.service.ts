import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { ReferencesAssociation } from './models/associations';
import { ReferencesAttribute } from './models/attribute';
import { ReferencesClass } from './models/class';
import { CreateAssociation } from './models/create-association-req.model';
import { EditAssociation } from './models/edit-association-req.model';
import { EditAttribute } from './models/edit-attribute-req-model';
import { CreateAttribute } from './models/create-attribute-req.model';
import { EditClass } from './models/edit-class-req.model';
import { CreateClass } from './models/create-class-req.model';
import { ReferencePrefix } from './models/get-prefix-res.model';
import { EditPrefix } from './models/edit-prefix-req.model';
import { CreatePrefix } from './models/create-prefix-req.model';
import { GetAttrsRes } from './models/get-attrs-res';
import { GetAvailableAttrType } from './models/get-available-types.mode';

@Injectable({ providedIn: 'root' })
export class HttpReferencesService {
  constructor(private apiService: ApiService) {}

  getReferencesAssociations() {
    return this.apiService.request<ReferencesAssociation[]>(new JSONRpcRequest('GetReferencesAssociations', {}));
  }
  getReferencesAssociationsById(id: number) {
    return this.apiService.request<ReferencesAssociation>(new JSONRpcRequest('GetReferencesAssociationsById_', { id }));
  }
  createAssociation(data: CreateAssociation) {
    return this.apiService.request<Record<string, any>>(new JSONRpcRequest('PostReferencesAssociations_', { ...data }));
  }
  editAssociationById(data: EditAssociation) {
    return this.apiService.request<Record<string, any>>(
      new JSONRpcRequest('PutReferencesAssociationsById_', { ...data }),
    );
  }
  deleteAssociationById(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeleteReferencesAssociationsById_', { id }));
  }

  getReferencesAttribute() {
    return this.apiService.request<ReferencesAttribute[]>(new JSONRpcRequest('GetReferencesAttribute', {}));
  }
  getReferencesAttributeById(id: number) {
    return this.apiService.request<ReferencesAttribute>(new JSONRpcRequest('GetReferencesAttributeById_', { id }));
  }
  createAttribute(data: CreateAttribute) {
    return this.apiService.request<Record<string, any>>(new JSONRpcRequest('PostReferencesAttribute_', { ...data }));
  }
  editAttributeById(data: EditAttribute) {
    return this.apiService.request<Record<string, any>>(new JSONRpcRequest('PutReferencesAttributeById_', { ...data }));
  }
  deleteAttributeById(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeleteReferencesAttributeById_', { id }));
  }

  getReferencesClass() {
    return this.apiService.request<ReferencesClass[]>(new JSONRpcRequest('GetReferencesClass', {}));
  }
  GetReferencesClassById(id: number) {
    return this.apiService.request<ReferencesClass>(new JSONRpcRequest('GetReferencesClassById_', { id }));
  }
  createClass(data: CreateClass) {
    return this.apiService.request<Record<string, any>>(new JSONRpcRequest('PostReferencesClass_', { ...data }));
  }
  editClassById(data: EditClass) {
    return this.apiService.request<Record<string, any>>(new JSONRpcRequest('PutReferencesClassById_', { ...data }));
  }
  deleteClassById(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeleteReferencesClassById_', { id }));
  }
  getPrefixList() {
    return this.apiService.request<ReferencePrefix[]>(new JSONRpcRequest('GetReferencesPrefix', {}));
  }
  createPrefix(data: CreatePrefix) {
    return this.apiService.request<Record<string, any>>(new JSONRpcRequest('PostReferencesPrefix', { ...data }));
  }
  editPrefix(data: EditPrefix) {
    return this.apiService.request<Record<string, any>>(new JSONRpcRequest('PutReferencesPrefixById', { ...data }));
  }
  deletePrefix(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeleteReferencesPrefixById', { id }));
  }
  uploadProfile(fileData: string) {
    return this.apiService.request(new JSONRpcRequest('PostReferencesLoadFromExcel', { base64: fileData }));
  }
  downloadProfile() {
    return this.apiService.request<{ data: string }>(new JSONRpcRequest('GetReferencesUploadToExcel', {}));
  }
  getAttrs(class_name: string) {
    return this.apiService.request<GetAttrsRes[]>(new JSONRpcRequest('GetReferencesTreeAttribute', { class_name }));
  }

  getAvailableAttrTypes() {
    return this.apiService.request<GetAvailableAttrType>(
      new JSONRpcRequest('GetReferencesAttributeGetAttributeType', {}),
    );
  }
}
