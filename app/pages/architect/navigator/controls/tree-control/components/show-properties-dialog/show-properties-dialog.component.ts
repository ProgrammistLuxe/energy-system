import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AttributesLinkData } from '@api-calls/services/http-graph-service/models';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-show-properties-dialog',
  imports: [CommonModule, materialModules.matTooltipModule, materialModules.matDialogModule],
  templateUrl: './show-properties-dialog.component.html',
  styleUrl: './show-properties-dialog.component.scss',
})
export class ShowPropertiesDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    protected data: { links: AttributesLinkData[]; route: ActivatedRoute },
    private router: Router,
    private dialogRef: MatDialogRef<ShowPropertiesDialogComponent>,
  ) {}
  handleLinkClick(e: Event, node: AttributesLinkData) {
    e.stopPropagation();
    this.router.navigate(['../../', node.uid], { relativeTo: this.data.route }).then((value) => {
      if (value) {
        this.dialogRef.close();
      }
    });
  }
}
