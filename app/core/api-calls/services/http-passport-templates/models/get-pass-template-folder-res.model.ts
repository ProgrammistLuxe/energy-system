import { GetPassTemplateFolderChild } from './passport-template.model';

export interface GetPassTemplateFolder {
  id: number;
  children: GetPassTemplateFolderChild[];
  title: string;
  level: number;
  parent: number;
}
