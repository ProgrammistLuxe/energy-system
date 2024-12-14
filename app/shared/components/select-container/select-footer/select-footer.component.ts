import { Component } from '@angular/core';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-select-footer',
  imports: [materialModules.matDividerModule],
  templateUrl: './select-footer.component.html',
  styleUrls: ['./select-footer.component.scss'],
})
export class SelectFooterComponent {}
