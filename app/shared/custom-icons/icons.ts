import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export class Icons {
  constructor(
    protected matIconRegistry: MatIconRegistry,
    protected domSanitizer: DomSanitizer,
  ) {}

  addIcon(name: string, path: string) {
    this.matIconRegistry.addSvgIcon(name, this.domSanitizer.bypassSecurityTrustResourceUrl(path));
  }
}
