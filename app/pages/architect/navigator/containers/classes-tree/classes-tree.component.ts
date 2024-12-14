import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AddButtonDirective,
  ApiResolverComponent,
  ButtonLoadingDirective,
  CheckScrollDirective,
  DefaultPipe,
  DeleteConfirmDialogTemplateComponent,
  DialogService,
  EmptyTemplateComponent,
  FooterComponent,
  MatIconButtonCustomDirective,
  OverFlowTooltipDirective,
  SearchFieldComponent,
  materialModules,
} from '@shared/index';
import { BehaviorSubject, ReplaySubject, filter, finalize, merge, of, switchMap, takeUntil } from 'rxjs';
import { NavigatorService } from '../../services/navigator.service';
import { ReferencesClass } from '@api-calls/services/http-references/models/class';
import { getCroppedName } from '@core/utils/cut-prefix';
import { FormControl } from '@angular/forms';
import { CutPrefixPipe } from '../../pipes/cut-prefix.pipe';
import { GetGraphClassListSearchReq, GetGraphClassSearchReq } from '@api-calls/services/http-graph-service/models';
import { PageEvent } from '@angular/material/paginator';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { group } from '@angular/animations';
import { NavigatorGenerateDiffsService } from '../../services/navigator-generate-diffs.service';
import { DiffItem, DiffService } from '@features/active-diffs-table/services/diff.service';
import { CreateEntityComponent } from '../../components/create-entity/create-entity.component';
import { ReferencePrefix } from '@api-calls/services/http-references/models/get-prefix-res.model';
export interface ClassInstance {
  className: string;
  uid: string;
  name: string | null;
}
@Component({
  selector: 'app-classes-tree',
  imports: [
    CommonModule,
    OverFlowTooltipDirective,
    DefaultPipe,
    ApiResolverComponent,
    SearchFieldComponent,
    EmptyTemplateComponent,
    CutPrefixPipe,
    FooterComponent,
    CheckScrollDirective,
    MatIconButtonCustomDirective,
    ButtonLoadingDirective,
    AddButtonDirective,
    materialModules.matTooltipModule,
    materialModules.reactiveFormsModule,
    materialModules.matPaginator,
    materialModules.matSelectModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matProgressSpinnerModule,
  ],
  templateUrl: './classes-tree.component.html',
  styleUrl: './classes-tree.component.scss',
})
export class ClassesTreeComponent {
  classListLoading: boolean = false;
  length = 0;
  pageSize = 20;
  pageIndex = 0;
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  instanceList: ClassInstance[] = [];
  classList$: BehaviorSubject<ReferencesClass[]> = new BehaviorSubject<ReferencesClass[]>([]);
  searchedClassList$: BehaviorSubject<ReferencesClass[]> = new BehaviorSubject<ReferencesClass[]>([]);
  classControl: FormControl<string | null> = new FormControl<string | null>(null, { nonNullable: false });
  searchValue: string = '';
  saveLoading: boolean = false;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private selectedClass: string = '';
  constructor(
    private navigatorService: NavigatorService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationsService: NotificationsService,
    private dialogService: DialogService,
    private generateDiffService: NavigatorGenerateDiffsService,
    private diffService: DiffService,
  ) {}

  get selectedNode(): ClassInstance | null {
    return this.navigatorService.selectedNode;
  }
  openCreateEntityDialog() {
    const dialogRef = this.dialogService.open<CreateEntityComponent>(CreateEntityComponent, {
      width: '590px',
      height: '650px',
      title: 'Создать элемент',
      data: { class_name: this.selectedClass },
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.notificationsService.displayMessage(
          'Успешно',
          'Успешно сохранено. Вы сможете увидеть изменения только после успешного применнеия diffа в системе',
          'success',
          4000,
        );
      });
  }
  openDeleteElementDialog(item: ClassInstance) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить элемент',
        data: `Вы уверены хотите удалить элемент "${item.name}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(async () => {
        const diff = this.generateDiffService.generateDeleteEntityDiff(item.uid, this.selectedClass);
        this.saveLoading = true;
        const res = await this.diffService.saveDiff(diff);

        res
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.saveLoading = false)),
          )
          .subscribe((response) => {
            if (!response) {
              this.notificationsService.displayMessage('Ошибка', 'Ошибка сохранения', 'error');
              return;
            }
            if (response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка сохранения';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage(
              'Успешно',
              'Успешно сохранено. Вы сможете увидеть изменения только после успешного применнеия diffа в системе',
              'success',
              4000,
            );

            const computedDiff: DiffItem = {
              diff_id: response.result.data[0].id,
              diff_name: response.result.data[0].object_name,
              place_name: item.name || 'Удаление объекта',
            };
            this.diffService.insertIntoDiffList(computedDiff);
          });
      });
  }
  searchClass(value: string) {
    const searchValue: string = value.toLowerCase().trim();
    if (searchValue) {
      const filteredList = this.classList$
        .getValue()
        .filter(
          (item) =>
            getCroppedName(item.class_name).toLowerCase().includes(searchValue) ||
            this.classControl?.value === item.class_name,
        );
      this.searchedClassList$.next(filteredList);
    } else {
      this.searchedClassList$.next(this.classList$.getValue());
    }
  }
  onSearch(value: string) {
    this.pageSize = 20;
    this.pageIndex = 0;
    this.navigateToInstances();
    const searchValue: string = value.toLowerCase().trim();
    this.searchValue = searchValue;
    this.getClassInstances();
  }
  getClassInstances() {
    if (!this.classControl.value) {
      return;
    }
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    const reqData: GetGraphClassSearchReq = {
      page: this.pageIndex + 1,
      size: this.pageSize,
      text: this.searchValue,
      class_name: getCroppedName(this.classControl.value),
    };
    this.navigatorService
      .getGraphInstanceListByName(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((res) => {
        if (res.error) {
          this.errorCode = +res;
          this.errorMessage = String(res);
          return;
        }

        this.instanceList = res.result.data.map((item) => ({
          className: this.classControl.value ? getCroppedName(this.classControl.value) : '',
          uid: item.uid,
          name: item.name,
        }));
        this.length = res.result.total;
        if (this.navigatorService.selectedUid && !this.navigatorService.selectedNode) {
          this.navigatorService.selectedNode =
            this.instanceList.find((el) => el.uid === this.navigatorService.selectedUid) || null;
        }
      });
  }
  handlePageEvent(e: PageEvent) {
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.navigateToInstances();
    this.getClassInstances();
  }

  goToObject(item: ClassInstance) {
    this.router.navigate([item.uid], { queryParamsHandling: 'merge', relativeTo: this.route }).then((value) => {
      if (!value) {
        return;
      }
      this.navigatorService.selectedNode = item;
    });
  }
  private expandElementByUid() {
    const uid = this.navigatorService.selectedUid;
    if (!uid) {
      return;
    }
    let prefixList: ReferencePrefix[] = [];
    this.navigatorService
      .getPrefixList()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res) => {
          if (res.error) {
            return of(null);
          } else {
            prefixList = res.result;
            return this.navigatorService.getGraphNodeData(uid);
          }
        }),
      )
      .subscribe((res) => {
        if (!res) {
          return;
        }
        if (res.error) {
          const errorMessage = getErrorsMessage(res.error) || 'Ошибка получения списка классов';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
          return;
        }
        Object.keys(res.result.data.properties).forEach((key) => {
          if (res.result.data.properties[key]?.length !== 1) {
            return;
          }
          if (res.result.data.properties[key][0]?.['class_name'] !== null) {
            return;
          }
          if (key.includes('type') && res.result.data.properties[key][0]['value']?.includes('#')) {
            const className = res.result.data.properties[key][0]['value'].split('#')[1];
            const full_name = res.result.data.properties[key][0]['value'].split('#')[0] + '#';
            const prefix = prefixList.find((el) => el.full_name === full_name);
            this.selectedClass = prefix ? prefix.short_name + ':' + className : className;
          } else if (key.includes('IdentifiedObject.name')) {
            this.searchValue = res.result.data.properties[key][0]['value'];
          }
          if (this.selectedClass && this.searchValue) {
            this.classControl.setValue(this.selectedClass, { emitEvent: false });
            this.navigatorService.selectedNode = {
              uid: uid,
              className: getCroppedName(this.selectedClass),
              name: this.searchValue,
            };
            this.getClassInstances();
          }
        });
      });
  }
  private navigateToInstances() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pageSize: this.pageSize, pageIndex: this.pageIndex, selectedClass: this.selectedClass },
    });
  }

  private getClassList() {
    this.classListLoading = true;
    this.navigatorService
      .getClassList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.classListLoading = false)),
      )
      .subscribe((res) => {
        if (!res.error) {
          this.classList$.next(res.result);
          this.searchedClassList$.next(res.result);
          if (this.selectedClass) {
            this.classControl.setValue(this.selectedClass, { emitEvent: false });
            this.getClassInstances();
          }
        } else {
          const errorMessage = getErrorsMessage(res.error) || 'Ошибка получения списка классов';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  private loadParams() {
    const pageSize = this.route.snapshot.queryParamMap.get('pageSize');
    const pageIndex = this.route.snapshot.queryParamMap.get('pageIndex');
    const selectedClass = this.route.snapshot.queryParamMap.get('selectedClass');
    if (pageSize) {
      this.pageSize = +pageSize;
    }
    if (pageIndex) {
      this.pageIndex = +pageIndex;
    }
    if (selectedClass) {
      this.selectedClass = selectedClass;
    }
  }
  private initData() {
    this.loadParams();
    this.getClassList();

    this.navigatorService.selectedUid$.pipe(takeUntil(this.destroy$)).subscribe((uid) => {
      if (!uid || this.selectedClass) {
        return;
      }
      this.expandElementByUid();
    });
    this.classControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (!value) {
        return;
      }
      this.searchedClassList$.next(this.classList$.getValue());
      this.pageIndex = 0;
      this.pageSize = 20;
      this.selectedClass = value;
      this.navigateToInstances();
      this.getClassInstances();
    });
  }
  ngOnInit() {
    this.initData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
