import { Component, HostListener, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MapAction } from '@pages/map-navigator/containers/map/models';
import { MatErrorExtComponent, materialModules } from '@shared/index';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject } from 'rxjs';
import { LatLng } from 'leaflet';
import { COORDS_ROUNDING_VALUE } from '../../const/coords-rounding-value';
@Component({
  selector: 'app-element-data-modal',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    materialModules.formsModule,
    MatErrorExtComponent,
  ],
  templateUrl: './add-element-data-modal.component.html',
  styleUrl: './add-element-data-modal.component.scss',
})
export class AddElementDataModalComponent {
  @HostListener('click', ['$event']) onClick(e: MouseEvent) {
    e.stopPropagation();
  }
  nameControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator(), Validators.maxLength(255)],
    nonNullable: true,
  });
  coordsForm = this.fb.group({
    lat: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.required, Validators.maxLength(8)],
    }),
    lng: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.required, Validators.maxLength(8)],
    }),
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogRef: MatDialogRef<AddElementDataModalComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    protected data: { action: MapAction | undefined; name: string | undefined; latlng: LatLng },
  ) {}

  addName() {
    if (this.data.action === 'LineSpan') {
      this.dialogRef.close(this.nameControl.value);
      return;
    }
    const value = this.coordsForm.getRawValue();
    const data = {
      name: this.nameControl.value,
      lat: +value.lat.toFixed(COORDS_ROUNDING_VALUE),
      lng: +value.lng.toFixed(COORDS_ROUNDING_VALUE),
    };

    this.dialogRef.close(data);
  }
  ngOnInit() {
    if (this.data.name) {
      this.nameControl.setValue(this.data.name);
    }
    if (this.data.action === 'LineSpan') {
      return;
    }
    const latLng = {
      lat: +this.data.latlng.lat.toFixed(COORDS_ROUNDING_VALUE),
      lng: +this.data.latlng.lng.toFixed(COORDS_ROUNDING_VALUE),
    };
    this.coordsForm.setValue(latLng);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
