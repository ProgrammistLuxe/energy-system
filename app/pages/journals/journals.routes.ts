import { Routes } from '@angular/router';
import { NoJournalComponent } from './components/no-journal/no-journal.component';
import { DiffsComponent } from './containers/diffs/diffs.component';
import { JournalsComponent } from './journals.component';
import { SynchronizationComponent } from './containers/synchronization/synchronization.component';

export const routes: Routes = [
  {
    path: '',
    component: JournalsComponent,
    children: [
      {
        path: '',
        redirectTo: 'logs',
        pathMatch: 'full',
      },
      {
        path: 'no-journal',
        component: NoJournalComponent,
      },
      {
        path: 'logs',
        component: DiffsComponent,
      },
      {
        path: 'synchronization',
        component: SynchronizationComponent,
      },
      {
        path: '**',
        redirectTo: 'no-journal',
      },
    ],
  },
];
