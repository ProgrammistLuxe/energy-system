import { Routes } from '@angular/router';
import { MapperComponent } from './mapper.component';

export const routes: Routes = [
  {
    path: '',
    component: MapperComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'integrations',
      },
      {
        path: 'integrations',
        title: 'Интеграция',
        loadChildren: () => import('./containers/integration/integrations-routes').then((r) => r.routes),
      },
      {
        path: 'systems',
        title: 'Системы',
        loadComponent: () => import('./containers/systems/systems.component').then((m) => m.SystemsComponent),
      },
      {
        path: 'attrs-mapper',
        title: 'Маппер',
        loadChildren: () => import('./containers/mapper/mapper-routes').then((r) => r.routes),
      },
      {
        path: 'upload',
        title: 'Загрузка данных',
        loadChildren: () => import('./containers/upload-data/upload-data-routes').then((r) => r.routes),
      },
    ],
  },
];
