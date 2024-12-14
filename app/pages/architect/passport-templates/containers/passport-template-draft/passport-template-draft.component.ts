import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PostPassTemplate, PostPassTemplateDraftReq } from '@api-calls/services/http-passport-templates/models';
import { ReferencesAttribute } from '@api-calls/services/http-references/models/attribute';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import {
  ApiResolverComponent,
  ButtonLoadingDirective,
  EmptyTemplateComponent,
  FooterComponent,
  LoadingComponent,
  MatErrorExtComponent,
  materialModules,
} from '@shared/index';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject, finalize, mergeMap, of, takeUntil } from 'rxjs';
import { TemplateFlatNode, PassTemplateNode } from '../../models';
import { PassportTemplatesService } from '../../services/passport-templates.service';
import { getCalculatedTemplateNode } from '../../utils/templateFlatNodeMapper';
import { AttrFormGroup } from '../passport-template/passport-template.component';

@Component({
  selector: 'app-passport-template-draft',
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
    ApiResolverComponent,
    LoadingComponent,
    FooterComponent,
    ButtonLoadingDirective,
    EmptyTemplateComponent,
  ],
  templateUrl: './passport-template-draft.component.html',
  styleUrl: './passport-template-draft.component.scss',
})
export class PassportTemplateDraftComponent {
  loading: boolean = false;
  saveLoading: boolean = false;
  nodeId: number | null = null;
  errorCode: number | null = null;
  errorMessage: string | null = null;
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
    protected passportTemplateService: PassportTemplatesService,
    private notificationsService: NotificationsService,
  ) {}
  get attributes(): FormArray<FormGroup<AttrFormGroup>> {
    return this.attrForm.get('attributes') as FormArray<FormGroup<AttrFormGroup>>;
  }
  get currentNode(): TemplateFlatNode | null {
    return this.passportTemplateService.currentNode;
  }
  addAttribute(id: number | null = null, type: string = '') {
    const attrForm = new FormGroup<AttrFormGroup>({
      class: new FormControl<number | null>(id, { validators: [Validators.required] }),
      type: new FormControl<string>(
        { value: type || '', disabled: true },
        { validators: [Validators.required], nonNullable: true },
      ),
    });

    this.attributes.push(attrForm);
  }
  deleteAttributes(lessonIndex: number) {
    this.attributes.removeAt(lessonIndex);
  }
  getDraft() {
    if (!this.nodeId) {
      return;
    }
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    let result: PassTemplateNode | null = null;
    let attrSet: number[] = [];
    let attrTypeSet: number[] = [];
    this.passportTemplateService
      .getDraft(this.nodeId)
      .pipe(
        takeUntil(this.destroy$),
        mergeMap((response) => {
          if (!!response.error) {
            this.errorCode = +response;
            this.errorMessage = String(response);
            return of(null);
          }
          result = {
            id: response.result.id,
            parent: response.result.folder,
            hasChildren: false,
            level: 0,
            type: 'template',
            title: response.result.title,
          };
          attrSet = response.result.attribute;
          attrTypeSet = response.result.attribute_type;
          return this.passportTemplateService.getTreeFolderById(response.result.folder);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (!response || response?.error) {
          return;
        }
        if (!this.passportTemplateService.currentNode && result) {
          result.level = response.result.level;
          this.passportTemplateService.currentNode = getCalculatedTemplateNode(result);
        }
        this.setControlsValues(attrSet, result?.title || '');
      });
  }
  createNode() {
    const title = this.templateName?.value;
    if (!this.nodeId || !title || !this.currentNode) {
      return;
    }
    this.saveLoading = true;
    const attrSet: number[] = this.attributes.getRawValue().map((group) => group?.class ?? 0);
    const reqData: PostPassTemplate = {
      folder: this.currentNode.parent,
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
          this.notificationsService.displayMessage('Успешно', 'Шаблон успешно обновлен', 'success', 3000);
          this.passportTemplateService.reloadTree = true;
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления шаблона';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  saveDraft() {
    if (!this.nodeId || !this.currentNode) {
      return;
    }
    const title = this.templateName?.value;
    if (!title) {
      return;
    }
    this.saveLoading = true;
    const attrSet: number[] = this.attributes.value.map((group) => group?.class ?? 0);
    const reqData: PostPassTemplateDraftReq = {
      folder: this.currentNode.parent,
      attribute: attrSet,
      attribute_type: attrSet,
      title,
    };
    this.passportTemplateService
      .updateDraft(this.nodeId, reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Черновик успешно обновлен', 'success', 3000);
          this.passportTemplateService.reloadTree = true;
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления черновика';
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
  private setControlsValues(attrSet: number[], title: string) {
    if (!this.currentNode) {
      return;
    }
    this.attributes.clear();
    this.templateName.setValue(title);
    attrSet.forEach((attr_id) => {
      const attribute = this.attrList.find((attr) => attr.id === attr_id);
      if (!attribute) {
        return;
      }
      this.addAttribute(attr_id, attribute.type);
    });
  }
  ngOnInit() {
    this.getAttrs();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((param) => {
      if (!param['id']) {
        return;
      }
      this.nodeId = Number([param['id']]);
      this.getDraft();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
