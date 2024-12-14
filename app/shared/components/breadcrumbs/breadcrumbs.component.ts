import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { FirstLetterUppercasePipe, materialModules } from '@shared/index';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, materialModules.matButtonModule, materialModules.matIconModule, FirstLetterUppercasePipe],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent {
  @Input() name: string = '';
  @Input() showButton: boolean = false;
  constructor(private _location: Location) {}
  goBack() {
    this._location.back();
  }
}
