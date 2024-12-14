import { Routes } from '@angular/router';
import { IntegrationsComponent } from './integrations.component';
import { NoIntegrationComponent } from './components/no-integration/no-integration.component';
import { IntegrationComponent } from './containers/integration/integration.component';

export const routes: Routes = [
  {
    path: '',
    component: IntegrationsComponent,
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
        component: IntegrationComponent,
      },
      {
        path: '**',
        redirectTo: 'no-integration',
      },
    ],
  },
];
