import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { MatPaginator } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';

export const materialModules = {
  matPaginator: MatPaginator,
  matSelectModule: MatSelectModule,
  matFormFieldModule: MatFormFieldModule,
  matButtonModule: MatButtonModule,
  matIconModule: MatIconModule,
  matInputModule: MatInputModule,
  matProgressSpinnerModule: MatProgressSpinnerModule,
  reactiveFormsModule: ReactiveFormsModule,
  formsModule: FormsModule,
  matSidePanelModule: MatSidenavModule,
  matTooltipModule: MatTooltipModule,
  matCheckBoxModule: MatCheckboxModule,
  matBadgeModule: MatBadgeModule,
  matRadioModule: MatRadioModule,
  matTabsModule: MatTabsModule,
  matExpansionModule: MatExpansionModule,
  matMenuModule: MatMenuModule,
  matDividerModule: MatDividerModule,
  matDialogModule: MatDialogModule,
  virtualScroll: ScrollingModule,
  matTableModule: MatTableModule,
  matSortModule: MatSortModule,
  matOptionModule: MatOptionModule,
  matChipsModule: MatChipsModule,
  matTreeModule: MatTreeModule,
  matButtonToggleModule: MatButtonToggleModule,
  matDatepickerModule: MatDatepickerModule,
};
