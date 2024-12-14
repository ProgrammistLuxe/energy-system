import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddFolderComponent } from '@pages/architect/passport-templates/components/add-folder/add-folder.component';
import { MatErrorExtComponent, materialModules } from '@shared/index';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-edit-node',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
  ],
  templateUrl: './edit-node.component.html',
  styleUrl: './edit-node.component.scss',
})
export class EditNodeComponent {
  titleControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator(), Validators.maxLength(255)],
    nonNullable: true,
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: string,
    private dialogRef: MatDialogRef<EditNodeComponent>,
  ) {}
  editNode() {
    const title = this.titleControl.value;
    this.dialogRef.close(title);
  }
  ngOnInit() {
    this.titleControl.setValue(this.data);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
