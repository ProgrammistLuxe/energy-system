import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkAreaComponent } from '@shared/components';
import { NavigatorService } from './services/navigator.service';
import { ClassesTreeComponent } from './containers/classes-tree/classes-tree.component';
import { NavigatorGenerateDiffsService } from './services/navigator-generate-diffs.service';

@Component({
  selector: 'app-passports',
  templateUrl: './navigator.component.html',
  styleUrl: './navigator.component.scss',
  providers: [NavigatorService, NavigatorGenerateDiffsService],
  imports: [CommonModule, WorkAreaComponent, ClassesTreeComponent, RouterOutlet],
})
export class NavigatorComponent {}
