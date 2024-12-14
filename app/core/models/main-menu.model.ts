import { Permissions } from '../consts/permissions';

export interface MainMenuModel {
  name: string;
  link: string;
  access: (typeof Permissions)[number]['codename'][];
  onlyInDevMode: boolean;
  isExternal: boolean;
  isDropDown?: boolean | undefined;
}
