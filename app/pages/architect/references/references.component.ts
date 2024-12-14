import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReferencesService } from './services/references.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-references',
  providers: [ReferencesService],
  imports: [CommonModule, RouterModule],
  templateUrl: './references.component.html',
  styleUrl: './references.component.scss',
})
export class ReferencesComponent {}
