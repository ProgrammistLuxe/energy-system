import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppInitService } from '@services';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { DialogServiceConfig } from '@core/models/dialog-service-config.model';
import { AuthInterceptor } from '@core/interceptors/auth.interceptor';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MyCustomPaginatorIntl } from '@core/services/mat-cusom-paginator-intl.service';
import { LeafletMarkerClusterModule } from '@bluehalo/ngx-leaflet-markercluster';

function initializeApp(appInitService: AppInitService) {
  return appInitService.init();
}

function dialogConfig(): DialogServiceConfig {
  return {
    ...new DialogServiceConfig(),
    restoreFocus: false,
    disableClose: true,
    disableCloseEsc: false,
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(LeafletMarkerClusterModule),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: MatPaginatorIntl, useClass: MyCustomPaginatorIntl },
    provideAppInitializer(() => {
      initializeApp(inject(AppInitService));
    }),
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useFactory: dialogConfig,
    },
  ],
};
