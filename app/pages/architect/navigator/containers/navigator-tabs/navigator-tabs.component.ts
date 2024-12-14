import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { materialModules } from '@shared/materials';
import { NavigatorService } from '../../services/navigator.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navigator-tabs',
  imports: [CommonModule, materialModules.matTabsModule, RouterModule],
  templateUrl: './navigator-tabs.component.html',
  styleUrl: './navigator-tabs.component.scss',
})
export class NavigatorTabsComponent {
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private navigatorService: NavigatorService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (!params['id']) {
        return;
      }
      this.navigatorService.selectedUid = params['id'];
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
