import { Injectable } from '@angular/core';
import { HttpPassportTemplatesService } from '@api-calls/services';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PostPassTemplate,
  PostPassTemplateDraftReq,
  PostPassTemplateFolderRequest,
} from '@api-calls/services/http-passport-templates/models';
import { HttpReferencesService } from '@api-calls/services/http-references/http-references.service';
import { TemplateFlatNode } from '../models';

@Injectable()
export class PassportTemplatesService {
  constructor(
    private httpPassportTemplatesService: HttpPassportTemplatesService,
    private httpReferencesService: HttpReferencesService,
  ) {}
  private _reloadTree$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get reloadTree$(): Observable<boolean> {
    return this._reloadTree$.asObservable();
  }
  set reloadTree(value: boolean) {
    this._reloadTree$.next(value);
  }

  private _expanded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get expanded$(): Observable<boolean> {
    return this._expanded$.asObservable();
  }
  set expanded(value: boolean) {
    this._expanded$.next(value);
  }

  private _currentNode$: BehaviorSubject<TemplateFlatNode | null> = new BehaviorSubject<TemplateFlatNode | null>(null);
  set currentNode(node: TemplateFlatNode | null) {
    this._currentNode$.next(node);
  }
  get currentNode(): TemplateFlatNode | null {
    return this._currentNode$.value;
  }
  get currentNode$(): Observable<TemplateFlatNode | null> {
    return this._currentNode$.asObservable();
  }

  loadChildren(id: number) {
    return this.httpPassportTemplatesService.getPassportTemplatesFolderPassTemplateByIdChildren(id);
  }
  loadTree() {
    return this.httpPassportTemplatesService.getPassportTemplatesFolderPassTemplateLevel();
  }
  getTemplateById(id: number) {
    return this.httpPassportTemplatesService.getPassportTemplatesPassTemplatesById(id);
  }
  createTreeTemplate(data: PostPassTemplate) {
    return this.httpPassportTemplatesService.postPassportTemplatesPassTemplates(data);
  }
  createTreeFolder(data: PostPassTemplateFolderRequest) {
    return this.httpPassportTemplatesService.postPassportTemplatesFolderPassTemplate(data);
  }
  getTreeFolderById(id: number) {
    return this.httpPassportTemplatesService.getPassportTemplatesFolderPassTemplateById(id);
  }
  updateTreeTemplate(id: number, data: PostPassTemplate) {
    return this.httpPassportTemplatesService.putPassportTemplatesPassTemplatesById(id, data);
  }
  updateTreeFolder(id: number, data: PostPassTemplateFolderRequest) {
    return this.httpPassportTemplatesService.putPassportTemplatesFolderPassTemplateById(id, data);
  }
  deletePassportTemplate(id: number) {
    return this.httpPassportTemplatesService.deletePassportTemplatesPassTemplatesById(id);
  }
  deleteFolder(id: number) {
    return this.httpPassportTemplatesService.deletePassportTemplatesFolderPassTemplateById(id);
  }
  getDrafts() {
    return this.httpPassportTemplatesService.getPassportTemplatesDraftPassTemplate();
  }
  createDraft(data: PostPassTemplateDraftReq) {
    return this.httpPassportTemplatesService.postPassportTemplatesDraftPassTemplate(data);
  }
  getDraft(id: number) {
    return this.httpPassportTemplatesService.getPassportTemplatesDraftPassTemplateById(id);
  }
  updateDraft(id: number, data: PostPassTemplateDraftReq) {
    return this.httpPassportTemplatesService.putPassportTemplatesDraftPassTemplateById(id, data);
  }
  deleteDraft(id: number) {
    return this.httpPassportTemplatesService.deletePassportTemplatesDraftPassTemplateById(id);
  }
  getAttributesList() {
    return this.httpReferencesService.getReferencesAttribute();
  }
  getAttributeById(id: number) {
    return this.httpReferencesService.getReferencesAttributeById(id);
  }
}
