import { Injectable } from '@angular/core';
import { HttpReferencesService } from '@api-calls/services';
import { CreateAssociation } from '@api-calls/services/http-references/models/create-association-req.model';
import { CreateAttribute } from '@api-calls/services/http-references/models/create-attribute-req.model';
import { CreateClass } from '@api-calls/services/http-references/models/create-class-req.model';
import { CreatePrefix } from '@api-calls/services/http-references/models/create-prefix-req.model';
import { EditAssociation } from '@api-calls/services/http-references/models/edit-association-req.model';
import { EditAttribute } from '@api-calls/services/http-references/models/edit-attribute-req-model';
import { EditClass } from '@api-calls/services/http-references/models/edit-class-req.model';
import { EditPrefix } from '@api-calls/services/http-references/models/edit-prefix-req.model';

@Injectable()
export class ReferencesService {
  constructor(private httpReferencesService: HttpReferencesService) {}
  createClass(data: CreateClass) {
    return this.httpReferencesService.createClass(data);
  }
  editClass(data: EditClass) {
    return this.httpReferencesService.editClassById(data);
  }
  deleteClass(id: number) {
    return this.httpReferencesService.deleteClassById(id);
  }
  createAttribute(data: CreateAttribute) {
    return this.httpReferencesService.createAttribute(data);
  }
  editAttribute(data: EditAttribute) {
    return this.httpReferencesService.editAttributeById(data);
  }
  deleteAttribute(id: number) {
    return this.httpReferencesService.deleteAttributeById(id);
  }
  createAssociation(data: CreateAssociation) {
    return this.httpReferencesService.createAssociation(data);
  }
  editAssociation(data: EditAssociation) {
    return this.httpReferencesService.editAssociationById(data);
  }
  deleteAssociation(id: number) {
    return this.httpReferencesService.deleteAssociationById(id);
  }
  getClassList() {
    return this.httpReferencesService.getReferencesClass();
  }
  getPrefixList() {
    return this.httpReferencesService.getPrefixList();
  }
  createPrefix(data: CreatePrefix) {
    return this.httpReferencesService.createPrefix(data);
  }
  editPrefix(data: EditPrefix) {
    return this.httpReferencesService.editPrefix(data);
  }
  deletePrefix(id: number) {
    return this.httpReferencesService.deletePrefix(id);
  }
  uploadProfile(fileData: string) {
    return this.httpReferencesService.uploadProfile(fileData);
  }
  downloadProfile() {
    return this.httpReferencesService.downloadProfile();
  }
  getAttrs(class_name: string) {
    return this.httpReferencesService.getAttrs(class_name);
  }
  getAvalilableAttrTypes() {
    return this.httpReferencesService.getAvailableAttrTypes();
  }
}
