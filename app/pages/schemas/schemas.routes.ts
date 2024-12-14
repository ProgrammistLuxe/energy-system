import { Routes } from '@angular/router';
import { SchemasComponent } from './schemas.component';
import { NoSchemaComponent } from './components/no-schema/no-schema.component';
import { SchemaComponent } from './containers/schema/schema.component';

export const routes: Routes = [
  {
    path: '',
    component: SchemasComponent,
    children: [
      {
        path: '',
        redirectTo: 'no-schema',
        pathMatch: 'full',
      },
      {
        path: 'no-schema',
        component: NoSchemaComponent,
      },
      {
        path: ':id',
        component: SchemaComponent,
      },
      {
        path: '**',
        redirectTo: 'no-schema',
      },
    ],
  },
];
