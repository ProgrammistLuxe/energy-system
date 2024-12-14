import { Injectable } from '@angular/core';
import { HttpDiffService } from '@api-calls/services/http-diff-service/http-diff.service';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { PostDiffReq } from '@api-calls/services/http-diff-service/models';
import { HttpMinioService } from '@api-calls/services';
import { ApiResponseError, ApiResponseSuccess } from '@api-calls/api-models';
import { NotificationsService } from '@services';

@Injectable()
export class DiffsService {
  constructor(
    private httpMinioService: HttpMinioService,
    private httpDiffService: HttpDiffService,
    private notificationsService: NotificationsService,
  ) {}
  loadDiffList(pageSize: number, pageIndex: number) {
    return this.httpDiffService.getGraphDiff(pageSize, pageIndex);
  }
  saveDiffWithFile(value: FileList, description: string | null = null) {
    const formData = new FormData();
    const requests: Observable<ApiResponseError | ApiResponseSuccess<unknown>>[] = [];
    if (!value?.length) {
      this.notificationsService.displayMessage('Файлы не выбраны', 'Ошибка', 'error', 3000);
      return of(null);
    }
    for (let i = 0; i < value.length; i++) {
      formData.append('file', value[i], value[i].name);
      const req = this.httpMinioService.saveToMinio('diffs', value[i].name, formData);
      requests.push(req);
    }
    return forkJoin(requests).pipe(
      switchMap(([...responses]) => {
        const reqData: PostDiffReq[] = [];
        const errorFiles: string[] = [];
        responses.forEach((response, index) => {
          if (!value?.length) {
            this.notificationsService.displayMessage('Файлы не выбраны', 'Ошибка', 'error', 3000);
            return;
          }
          if (response.error) {
            errorFiles.push(value[index].name);
            return;
          }
          reqData.push({
            object_name: value[index].name,
            bucket_name: 'diffs',
            description: description || null,
          });
        });
        if (errorFiles.length) {
          const errorMessage = 'Возникла ошибка в файлах:' + errorFiles.join(', ');
          this.notificationsService.displayMessage(errorMessage, 'Ошибка', 'error', 3000);
        }
        if (reqData.length) {
          return this.httpDiffService.postGraphDiffAsync(reqData);
        }
        return of(null);
      }),
    );
  }
}
