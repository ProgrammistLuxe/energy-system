import { Routes } from '@angular/router';
import { ReferencesComponent } from './references.component';
import { AssociationComponent } from './tabs/association/association.component';
import { AttributeComponent } from './tabs/attribute/attribute.component';
import { ClassComponent } from './tabs/class/class.component';
import { PrefixComponent } from './tabs/prefix/prefix.component';
import { ReferencesTabsComponent } from './tabs/tabs.component';
import { ReferenceActionsComponent } from './references-actions/reference-actions.component';

export const routes: Routes = [
  {
    path: '',
    component: ReferencesComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'actions',
      },
      {
        path: 'actions',
        component: ReferenceActionsComponent,
      },
      {
        path: 'profile',
        component: ReferencesTabsComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'class',
          },
          {
            path: 'class',
            component: ClassComponent,
          },
          {
            path: 'attribute',
            component: AttributeComponent,
          },
          {
            path: 'association',
            component: AssociationComponent,
          },
          {
            path: 'prefix',
            component: PrefixComponent,
          },
          {
            path: '**',
            redirectTo: 'class',
          },
        ],
      },
      {
        path: '**',
        redirectTo: 'actions',
      },
    ],
  },
];
