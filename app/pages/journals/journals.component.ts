import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-journals',
  imports: [CommonModule, RouterModule, materialModules.matTabsModule],
  templateUrl: './journals.component.html',
  styleUrl: './journals.component.scss',
})
export class JournalsComponent {}
