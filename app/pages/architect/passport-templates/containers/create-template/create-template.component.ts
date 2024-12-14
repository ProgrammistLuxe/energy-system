import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent, MatErrorExtComponent, ApiResolverComponent, LoadingComponent } from '@shared/components';
import { ButtonLoadingDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject, takeUntil, finalize } from 'rxjs';
import { PassportTemplatesService } from '../../services/passport-templates.service';
import { AttrFormGroup } from '../passport-template/passport-template.component';
import { PostPassTemplate, PostPassTemplateDraftReq } from '@api-calls/services/http-passport-templates/models';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { ReferencesAttribute } from '@api-calls/services/http-references/models/attribute';

@Component({
  selector: 'app-create-template',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matRadioModule,
    materialModules.matInputModule,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
    materialModules.matButtonModule,
    materialModules.matChipsModule,
    materialModules.matIconModule,
    materialModules.matDividerModule,
    FooterComponent,
    MatErrorExtComponent,
    LoadingComponent,
    FooterComponent,
    ButtonLoadingDirective,
  ],
  templateUrl: './create-template.component.html',
  styleUrl: './create-template.component.scss',
})
export class CreateTemplateComponent {
  nodeId: number | null = null;
  saveLoading: boolean = false;
  attrForm: FormGroup = new FormGroup({
    attributes: new FormArray([]),
  });
  templateName: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator()],
    nonNullable: true,
  });
  attrList: ReferencesAttribute[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    protected passportTemplateService: PassportTemplatesService,
    private notificationsService: NotificationsService,
  ) {}
  get attributes(): FormArray<FormGroup<AttrFormGroup>> {
    return this.attrForm.get('attributes') as FormArray<FormGroup<AttrFormGroup>>;
  }

  addAttribute() {
    const attrForm = new FormGroup<AttrFormGroup>({
      class: new FormControl<number | null>(null, { validators: [Validators.required] }),
      type: new FormControl<string>(
        { value: '', disabled: true },
        { validators: [Validators.required], nonNullable: true },
      ),
    });

    this.attributes.push(attrForm);
  }
  deleteAttributes(lessonIndex: number) {
    this.attributes.removeAt(lessonIndex);
  }
  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
  saveNode() {
    if (!this.nodeId) {
      return;
    }
    const title = this.templateName?.value;
    if (!title) {
      return;
    }
    this.saveLoading = true;
    const attrSet: number[] = this.attributes.value.map((group) => group?.class ?? 0);
    const reqData: PostPassTemplate = {
      folder: this.nodeId,
      attribute: attrSet,
      attribute_type: attrSet,
      title,
    };
    this.passportTemplateService
      .createTreeTemplate(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Шаблон успешно создан', 'success', 3000);
          this.router.navigate(['../../'], { relativeTo: this.route });
          this.passportTemplateService.reloadTree = true;
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка создания шаблона';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  saveDraft() {
    if (!this.nodeId) {
      return;
    }
    const title = this.templateName?.value;
    if (!title) {
      return;
    }
    this.saveLoading = true;
    const attrSet: number[] = this.attributes.getRawValue().map((group) => group?.class ?? 0);
    const reqData: PostPassTemplateDraftReq = {
      folder: this.nodeId,
      attribute: attrSet,
      attribute_type: attrSet,
      title,
    };
    this.passportTemplateService
      .createDraft(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Черновик успешно создан', 'success', 3000);
          this.router.navigate(['../../'], { relativeTo: this.route });
          this.passportTemplateService.reloadTree = true;
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка создания черновика';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  setAttrType(value: number, index: number) {
    const attribute = this.attrList.find((attr) => attr.id === value);
    if (!attribute) {
      return;
    }
    this.attributes.controls[index].get('type')?.setValue(attribute.type);
  }
  private getAttrs() {
    this.passportTemplateService
      .getAttributesList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response.error) {
          this.attrList = response.result;
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка получения списка атрибутов';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((param) => {
      if (!param['id']) {
        return;
      }
      this.nodeId = Number([param['id']]);
    });
    this.getAttrs();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
