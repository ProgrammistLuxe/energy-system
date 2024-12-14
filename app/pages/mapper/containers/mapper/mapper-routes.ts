import { Routes } from '@angular/router';
import { MapperComponent } from './mapper.component';
import { SelectedIntegrationComponent } from './containers/selected-integration/selected-integration.component';
import { NoIntegrationComponent } from './components/no-integration/no-integration.component';

export const routes: Routes = [
  {
    path: '',
    component: MapperComponent,
    children: [
      {
        path: '',
        redirectTo: 'no-integration',
        pathMatch: 'full',
      },
      {
        path: 'no-integration',
        component: NoIntegrationComponent,
      },
      {
        path: ':id',
        component: SelectedIntegrationComponent,
      },
      {
        path: '**',
        redirectTo: 'no-integration',
      },
    ],
  },
];
