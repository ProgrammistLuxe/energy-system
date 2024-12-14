import { MainMenuModel } from '@models';

export const menuRoutes: MainMenuModel[] = [
  // Администратор
  { name: 'Администрирование', link: 'administration', access: ['view_user'], onlyInDevMode: false, isExternal: false },
  //Схемы
  { name: 'Схемы', link: 'schemas', access: [], onlyInDevMode: true, isExternal: false },
  // Архитектор
  { name: 'Шаблоны паспортов', link: 'passport-templates', access: [], onlyInDevMode: true, isExternal: false },
  { name: 'Профиль', link: 'references', access: ['view_user'], onlyInDevMode: false, isExternal: false },
  { name: 'Навигатор', link: 'navigator', access: ['view_user'], onlyInDevMode: false, isExternal: false },
  { name: 'Графы', link: 'graph', access: [], onlyInDevMode: true, isExternal: false },
  { name: 'ГИС', link: 'map', access: [], onlyInDevMode: false, isExternal: false },
  { name: 'ГИС V2', link: 'map-v2', access: [], onlyInDevMode: false, isExternal: false },
  { name: 'Журналы', link: 'journals', access: [], onlyInDevMode: false, isExternal: false },
  { name: 'Маппер', link: 'mapper', access: [], onlyInDevMode: false, isExternal: false },
  { name: 'Потоки', link: 'http://10.5.6.99:8088/nifi/', access: [], onlyInDevMode: false, isExternal: true },
  { name: 'МКС', link: 'https://mcs-web.intechs.by/', access: [], onlyInDevMode: false, isExternal: true },
  {
    name: 'Внешние ссылки',
    link: '',
    access: [],
    onlyInDevMode: false,
    isExternal: false,
    isDropDown: true,
  },
];
