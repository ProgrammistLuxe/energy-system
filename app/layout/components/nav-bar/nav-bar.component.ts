import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChildren,
  ViewChild,
  ElementRef,
  QueryList,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProfileComponent } from '../profile/profile.component';
import { ButtonLoadingDirective, DialogService, MatIconButtonCustomDirective, materialModules } from '@shared/index';
import { MainMenuModel } from '@models';
import { UserAuthService } from '@core/services/user-auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { ReplaySubject, filter, takeUntil } from 'rxjs';
import { menuRoutes } from '../menu-list';
import { AppConfigService, GlobalSearchService } from '@services';
import { GlobalSearchComponent } from '../global-search/global-search.component';

@Component({
  selector: 'app-nav-bar',
  imports: [
    CommonModule,
    RouterModule,
    ProfileComponent,
    materialModules.matMenuModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matTooltipModule,
    MatIconButtonCustomDirective,
    ButtonLoadingDirective,
    RouterModule,
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  @ViewChild('menuContainer') menuContainer: ElementRef<HTMLElement> | null = null;
  @ViewChildren('navItems') navItems: QueryList<any> | null = null;
  @HostListener('window:resize')
  onResize() {
    this.calculateVisibleMenu();
  }
  auth$ = this.userAuthService.isAuth$;
  lastVisibleItem: number = -1;
  hiddenMenu: MainMenuModel[] = [];
  menuItems: MainMenuModel[] = [];
  menuItemsExternal: MainMenuModel[] = [];
  private isDevMode: string = this.appConfigService.config['DEV_MODE'];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private userAuthService: UserAuthService,
    private userStateService: UserStateService,
    private appConfigService: AppConfigService,
    private globalSearchService: GlobalSearchService,
    private dialogService: DialogService,
    private cd: ChangeDetectorRef,
  ) {}

  get fileLoading() {
    return this.globalSearchService.fileLoading;
  }
  openGlobalSearchDialog() {
    this.dialogService.open<GlobalSearchComponent>(GlobalSearchComponent, {
      title: 'Глобальный поиск',
      width: '500px',
      autoFocus: false,
    });
  }
  calculateVisibleMenu() {
    if (!this.menuContainer) {
      return;
    }
    if (!this.menuContainer.nativeElement.offsetWidth) {
      this.lastVisibleItem = -1;
      return;
    }
    if (!this.navItems) {
      return;
    }
    const menuWidth = this.menuContainer.nativeElement.offsetWidth;

    let fullWidth = 0;
    this.navItems.forEach((item, index) => {
      fullWidth += item.nativeElement.offsetWidth;

      if (menuWidth >= fullWidth) {
        this.lastVisibleItem = index;
      }
    });

    this.hiddenMenu = this.menuItems.slice(this.lastVisibleItem + 1);

    this.cd.detectChanges();
  }
  private calculateMenuitems() {
    const items = menuRoutes.filter((route) => (this.isDevMode === 'false' ? !route.onlyInDevMode : true));
    this.menuItems = items.filter(
      (menuItem) =>
        (menuItem.access.length === 0 ||
          menuItem.access.some((permission) => this.userStateService.userValue?.permissions.includes(permission))) &&
        !menuItem.isExternal,
    );

    this.menuItemsExternal = items.filter(
      (menuItem) =>
        (menuItem.access.length === 0 ||
          menuItem.access.some((permission) => this.userStateService.userValue?.permissions.includes(permission))) &&
        menuItem.isExternal,
    );
  }
  ngOnInit() {
    this.calculateMenuitems();

    this.globalSearchService.loadSearchFile();
  }
  ngAfterViewInit() {
    this.userStateService.user$
      .pipe(
        takeUntil(this.destroy$),
        filter((user) => !!user),
      )
      .subscribe(() => {
        this.calculateMenuitems();
        setTimeout(() => {
          this.calculateVisibleMenu();
        }, 300);
      });
    setTimeout(() => {
      this.calculateVisibleMenu();
    }, 300);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
