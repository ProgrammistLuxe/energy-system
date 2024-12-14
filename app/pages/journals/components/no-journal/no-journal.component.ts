import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-no-schema',
  imports: [CommonModule, EmptyTemplateComponent, materialModules.matIconModule],
  templateUrl: './no-journal.component.html',
  styleUrl: './no-journal.component.scss',
})
export class NoJournalComponent {}
