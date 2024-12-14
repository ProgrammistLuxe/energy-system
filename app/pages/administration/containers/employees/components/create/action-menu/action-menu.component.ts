import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-create-action-menu',
  imports: [materialModules.matIconModule],
  templateUrl: './action-menu.component.html',
  styleUrl: './action-menu.component.scss',
})
export class CreateActionMenuComponent {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  back() {
    this.router.navigate(['..'], { queryParamsHandling: 'preserve', relativeTo: this.activatedRoute });
  }
}
