import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AddFolderComponent } from '@pages/architect/passport-templates/components/add-folder/add-folder.component';
import { MatErrorExtComponent, materialModules } from '@shared/index';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-node',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
  ],
  templateUrl: './add-node.component.html',
  styleUrl: './add-node.component.scss',
})
export class AddNodeComponent {
  titleControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator(), Validators.maxLength(255)],
    nonNullable: true,
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(private dialogRef: MatDialogRef<AddNodeComponent>) {}
  addNode() {
    const title = this.titleControl.value;
    this.dialogRef.close(title);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
