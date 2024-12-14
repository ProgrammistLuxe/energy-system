import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import {
  GetFolderPassTemplateChildren,
  GetPassTemplate,
  GetPassTemplateDraft,
  GetPassTemplateFolder,
  GetPassTemplateLevel,
  PostPassTemplate,
  PostPassTemplateFolderRequest,
} from './models';

@Injectable({
  providedIn: 'root',
})
export class HttpPassportTemplatesService {
  constructor(private apiService: ApiService) {}
  //templates
  getPassportTemplatesPassTemplates(search?: string, ordering?: string) {
    return this.apiService.request<GetPassTemplate[]>(new JSONRpcRequest('GetPassportTemplatesPassTemplates', {}));
  }
  postPassportTemplatesPassTemplates(body: PostPassTemplate) {
    return this.apiService.request<GetPassTemplate>(
      new JSONRpcRequest('PostPassportTemplatesPassTemplates', { ...body }),
    );
  }
  putPassportTemplatesPassTemplatesById(id: number, body: PostPassTemplate) {
    return this.apiService.request<GetPassTemplate>(
      new JSONRpcRequest('PutPassportTemplatesPassTemplatesById', { id, ...body }),
    );
  }
  getPassportTemplatesPassTemplatesById(id: number) {
    return this.apiService.request<GetPassTemplate>(
      new JSONRpcRequest('GetPassportTemplatesPassTemplatesById', { id }),
    );
  }
  deletePassportTemplatesPassTemplatesById(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeletePassportTemplatesPassTemplatesById', { id }));
  }

  //drafts
  getPassportTemplatesDraftPassTemplate() {
    return this.apiService.request<GetPassTemplateDraft[]>(
      new JSONRpcRequest('GetPassportTemplatesDraftPassTemplate', {}),
    );
  }
  postPassportTemplatesDraftPassTemplate(data: PostPassTemplate) {
    return this.apiService.request<GetPassTemplateDraft>(
      new JSONRpcRequest('PostPassportTemplatesDraftPassTemplate', { ...data }),
    );
  }
  putPassportTemplatesDraftPassTemplateById(id: number, data: PostPassTemplate) {
    return this.apiService.request<GetPassTemplateDraft>(
      new JSONRpcRequest('PutPassportTemplatesDraftPassTemplateById', { id, ...data }),
    );
  }
  getPassportTemplatesDraftPassTemplateById(id: number) {
    return this.apiService.request<GetPassTemplateDraft>(
      new JSONRpcRequest('GetPassportTemplatesDraftPassTemplateById', { id }),
    );
  }
  deletePassportTemplatesDraftPassTemplateById(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeletePassportTemplatesDraftPassTemplateById', { id }));
  }

  //folders
  getPassportTemplatesFolderPassTemplate(search?: string, ordering?: string) {
    return this.apiService.request<GetPassTemplateFolder[]>(
      new JSONRpcRequest('GetPassportTemplatesFolderPassTemplate', {}),
    );
  }
  postPassportTemplatesFolderPassTemplate(data: PostPassTemplateFolderRequest) {
    return this.apiService.request<GetPassTemplateFolder>(
      new JSONRpcRequest('PostPassportTemplatesFolderPassTemplate', { ...data }),
    );
  }
  putPassportTemplatesFolderPassTemplateById(id: number, data: PostPassTemplateFolderRequest) {
    return this.apiService.request<GetPassTemplateFolder>(
      new JSONRpcRequest('PutPassportTemplatesFolderPassTemplateById', { id, ...data }),
    );
  }
  getPassportTemplatesFolderPassTemplateById(id: number) {
    return this.apiService.request<GetPassTemplateFolder>(
      new JSONRpcRequest('GetPassportTemplatesFolderPassTemplateById', { id }),
    );
  }
  getPassportTemplatesFolderPassTemplateLevel() {
    return this.apiService.request<GetPassTemplateLevel[]>(
      new JSONRpcRequest('GetPassportTemplatesFolderPassTemplateLevel', {}),
    );
  }
  getPassportTemplatesFolderPassTemplateByIdChildren(id: number) {
    return this.apiService.request<GetFolderPassTemplateChildren>(
      new JSONRpcRequest('GetPassportTemplatesFolderPassTemplateByIdChildren', { id }),
    );
  }
  deletePassportTemplatesFolderPassTemplateById(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeletePassportTemplatesFolderPassTemplateById', { id }));
  }
}
