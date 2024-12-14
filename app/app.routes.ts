import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { CheckProdGuard } from '@core/guards/check-prod.guard';
import { CheckUrlGuardService } from '@core/guards/check-url-guard.service';
import { LayoutComponent } from 'app/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'references',
        pathMatch: 'full',
      },
      {
        path: 'auth',
        title: 'Авторизация',
        loadComponent: () => import('@pages/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'password-create',
        title: 'Создайте пароль',
        loadComponent: () =>
          import('@pages/auth/password-create/password-create.component').then((m) => m.PasswordCreateComponent),
      },
      {
        path: 'password-change',
        title: 'Смена пароля',
        loadComponent: () =>
          import('@pages/auth/password-change/password-change.component').then((m) => m.PasswordChangeComponent),
        canActivate: [AuthGuard, CheckProdGuard],
      },
      {
        path: '404',
        title: 'Страница не найдена',
        loadComponent: () => import('@pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
      {
        path: 'access-deny',
        title: 'Доступ запрещён',
        loadComponent: () => import('@pages/access-deny/access-deny.component').then((m) => m.AccessDenyComponent),
      },
      {
        path: 'mapper',
        title: 'Маппер',
        loadChildren: () => import('@pages/mapper/mapper-routes').then((r) => r.routes),
        canActivate: [AuthGuard, CheckProdGuard],
      },
      {
        path: 'journals',
        title: 'Журналы',
        loadChildren: () => import('@pages/journals/journals.routes').then((r) => r.routes),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: 'administration',
        title: 'Администрирование',
        loadChildren: () => import('@pages/administration/administration.routes').then((x) => x.routes),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: 'schemas',
        title: 'Схемы',
        data: { onlyInDevMode: true },
        loadChildren: () => import('@pages/schemas/schemas.routes').then((x) => x.routes),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: 'passport-templates',
        title: 'Шаблоны паспортов',
        data: { onlyInDevMode: true },
        loadChildren: () =>
          import('@pages/architect/passport-templates/passport-templates.router').then((r) => r.routes),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['view_user'] },
      },
      {
        path: 'references',
        title: 'Профиль',
        loadChildren: () => import('@pages/architect/references/references.routes').then((x) => x.routes),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: 'navigator',
        title: 'Навигатор',
        loadChildren: () => import('@pages/architect/navigator/navigator.routes').then((r) => r.routes),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: 'graph',
        title: 'Граф',
        data: { onlyInDevMode: true },
        loadComponent: () => import('@pages/graph/graph.component').then((c) => c.GraphComponent),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: 'map',
        title: 'ГИС',
        loadComponent: () =>
          import('@pages/map-navigator/map-navigator.component').then((c) => c.MapNavigatorComponent),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: 'map-v2',
        title: 'ГИС V2 ',
        loadComponent: () =>
          import('@pages/map-navigator/map-navigator.component').then((c) => c.MapNavigatorComponent),
        canActivate: [AuthGuard, CheckProdGuard],
        // canActivate: [AuthGuard, CheckUrlGuardService],
        // data: { access: ['admin'] },
      },
      {
        path: '**',
        redirectTo: '404',
      },
    ],
  },
];
