import { Routes } from '@angular/router';
import { AdministrationComponent } from './administration.component';
import { EmptyComponent } from './components/empty/empty.component';
import { CreateEmployeeInfoComponent } from './containers/employees/components/create/tabs/employee-info/employee-info.component';
import { CreateEmployeeRightsComponent } from './containers/employees/components/create/tabs/employee-rights/employee-rights.component';
import { CreateEmployeeTabsComponent } from './containers/employees/components/create/tabs/tabs.component';
import { CreateEmployeeComponent } from './containers/employees/components/create/create.component';
import { EditEmployeeInfoComponent } from './containers/employees/components/edit/tabs/employee-info/employee-info.component';
import { EditEmployeeRightsComponent } from './containers/employees/components/edit/tabs/employee-rights/employee-rights.component';
import { EditEmployeeTabsComponent } from './containers/employees/components/edit/tabs/tabs.component';
import { EditEmployeeComponent } from './containers/employees/components/edit/edit.component';
import { EmployeesComponent } from './containers/employees/employees.component';
import { GroupComponent } from './containers/role-groups/components/group/group.component';
import { NoGroupComponent } from './containers/role-groups/components/no-group/no-group.component';
import { RoleGroupsComponent } from './containers/role-groups/role-groups.component';
import { GroupEmployeesComponent } from './containers/role-groups/tabs/group-employees/group-employees.component';
import { GroupRightsComponent } from './containers/role-groups/tabs/group-rights/group-rights.component';

export const routes: Routes = [
  {
    path: '',
    component: AdministrationComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'empty',
      },
      {
        path: 'empty',
        component: EmptyComponent,
      },
      {
        path: 'role-groups',
        component: RoleGroupsComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: NoGroupComponent,
          },
          {
            path: ':id',
            component: GroupComponent,
            children: [
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'group-rights',
              },
              {
                path: 'group-rights',
                component: GroupRightsComponent,
              },
              {
                path: 'group-employees',
                component: GroupEmployeesComponent,
              },
            ],
          },
          {
            path: '**',
            component: NoGroupComponent,
          },
        ],
      },
      {
        path: 'employees',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: EmployeesComponent,
          },
          {
            path: 'create',
            pathMatch: 'prefix',
            component: CreateEmployeeComponent,
            children: [
              {
                path: '',
                component: CreateEmployeeTabsComponent,
                children: [
                  {
                    path: '',
                    pathMatch: 'full',
                    redirectTo: 'employee-info',
                  },
                  {
                    path: 'employee-info',
                    component: CreateEmployeeInfoComponent,
                  },
                  {
                    path: 'employee-rights',
                    component: CreateEmployeeRightsComponent,
                  },
                ],
              },
            ],
          },
          {
            path: ':id',
            pathMatch: 'prefix',
            component: EditEmployeeComponent,
            children: [
              {
                path: '',
                component: EditEmployeeTabsComponent,
                children: [
                  {
                    path: '',
                    pathMatch: 'full',
                    redirectTo: 'employee-info',
                  },
                  {
                    path: 'employee-info',
                    component: EditEmployeeInfoComponent,
                  },
                  {
                    path: 'employee-rights',
                    component: EditEmployeeRightsComponent,
                  },
                ],
              },
            ],
          },
          {
            path: '**',
            component: EmployeesComponent,
          },
        ],
      },
      {
        path: '**',
        redirectTo: 'empty',
      },
    ],
  },
];
