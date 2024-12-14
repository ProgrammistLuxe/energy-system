import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkAreaComponent } from '@shared/index';
import { PassportTemplatesTreeComponent } from './containers/passport-templates-tree/passport-templates-tree.component';
import { PassportTemplatesService } from './services/passport-templates.service';

@Component({
  selector: 'app-passport-templates',
  imports: [CommonModule, WorkAreaComponent, PassportTemplatesTreeComponent, RouterOutlet],
  providers: [PassportTemplatesService],
  templateUrl: './passport-templates.component.html',
  styleUrl: './passport-templates.component.scss',
})
export class PassportTemplatesComponent {}
