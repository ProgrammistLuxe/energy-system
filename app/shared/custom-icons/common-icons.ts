import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Icons } from './icons';

export class CommonIcons extends Icons {
  constructor(
    protected override matIconRegistry: MatIconRegistry,
    protected override domSanitizer: DomSanitizer,
  ) {
    super(matIconRegistry, domSanitizer);

    this.addIcon('custom_excel', '../assets/icons/excel.svg');
  }
}
