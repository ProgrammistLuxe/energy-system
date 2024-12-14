import { Route } from '@angular/router';
import { NoTemplateComponent } from './components/no-template/no-template.component';
import { NavigatorComponent } from './navigator.component';
import { ObjectDataComponent } from './containers/object-data/object-data.component';
import { DeactivatedGuard } from '@core/guards/deactivate-guard.service';
import { NavigatorTabsComponent } from './containers/navigator-tabs/navigator-tabs.component';
import { GraphViewComponent } from './containers/graph-view/graph-view.component';

export const routes: Route[] = [
  {
    path: '',
    component: NavigatorComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: NoTemplateComponent,
      },
      {
        path: ':id',
        component: NavigatorTabsComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'edit',
          },
          {
            path: 'edit',
            component: ObjectDataComponent,
            canDeactivate: [DeactivatedGuard],
          },
          {
            path: 'graph-view',
            component: GraphViewComponent,
          },
        ],
      },
      { path: 'empty', component: NoTemplateComponent },
      { path: '**', redirectTo: 'empty' },
    ],
  },
];
