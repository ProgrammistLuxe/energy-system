import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfirmDialogComponent } from '@shared/index';
import { DialogService } from '@shared/services/dialog.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CanComponentDeactivate {
  onConfirm(): boolean;
}

@Injectable({ providedIn: 'root' })
export class DeactivatedGuard {
  state: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private dialogService: DialogService) {}

  canDeactivate(
    component: CanComponentDeactivate,
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | boolean {
    if (!component) {
      return true;
    }
    if (!component.onConfirm()) {
      return new Observable((subscriber) => {
        const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
          title: 'Подтверждение',
          data: 'Вы уверены, что хотите покинуть страницу, не сохранив внесённые изменения?',
        });
        dialogRef.afterClosed().subscribe((data) => {
          if (data) {
            subscriber.next(true);
          } else {
            subscriber.next(false);
          }
        });
      });
    }
    return true;
  }
}
