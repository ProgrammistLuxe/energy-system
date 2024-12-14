import { GetPassTemplateFolderChild } from './passport-template.model';

export interface GetFolderPassTemplateChildren {
  id: number;
  parent: number;
  level: number;
  title: string;
  children: GetPassTemplateFolderChild[];
  passports_template_folders: PassportTemplateFolderChild[];
  draft_passports_template: PassportTemplateFolderChild[];
}

export interface PassportTemplateFolderChild {
  id: number;
  title: string;
}
