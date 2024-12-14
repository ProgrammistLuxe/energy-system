import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { materialModules } from '@shared/index';

@Component({
  selector: 'app-references-tabs',
  imports: [
    CommonModule,
    materialModules.matTabsModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    RouterModule,
  ],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class ReferencesTabsComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
