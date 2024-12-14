import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-mapper',
  imports: [CommonModule, RouterModule, materialModules.matTabsModule],
  templateUrl: './mapper.component.html',
  styleUrl: './mapper.component.scss',
})
export class MapperComponent {}
