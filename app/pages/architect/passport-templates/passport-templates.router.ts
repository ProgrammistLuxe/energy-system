import { Route } from '@angular/router';
import { PassportTemplatesComponent } from './passport-templates.component';
import { PassportTemplateComponent } from './containers/passport-template/passport-template.component';
import { NoTemplateComponent } from './components/no-template/no-template.component';
import { CreateTemplateComponent } from './containers/create-template/create-template.component';
import { PassportTemplateDraftComponent } from './containers/passport-template-draft/passport-template-draft.component';

export const routes: Route[] = [
  {
    path: '',
    component: PassportTemplatesComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: NoTemplateComponent,
      },
      {
        path: ':id',
        component: PassportTemplateComponent,
      },
      {
        path: 'create/:id',
        component: CreateTemplateComponent,
      },
      {
        path: 'draft/:id',
        component: PassportTemplateDraftComponent,
      },
      {
        path: '**',
        component: NoTemplateComponent,
      },
    ],
  },
];
