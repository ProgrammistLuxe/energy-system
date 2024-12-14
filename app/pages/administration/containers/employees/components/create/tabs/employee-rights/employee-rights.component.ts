import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-create-employee-rights',
  imports: [CommonModule, materialModules.matButtonModule, FooterComponent],
  templateUrl: './employee-rights.component.html',
  styleUrl: './employee-rights.component.scss',
})
export class CreateEmployeeRightsComponent {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  back() {
    this.router.navigate(['../employee-info'], { queryParamsHandling: 'preserve', relativeTo: this.activatedRoute });
  }
}
