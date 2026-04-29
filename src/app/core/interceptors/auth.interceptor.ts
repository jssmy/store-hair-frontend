import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AppRoutes } from '../constants/app-routes';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  return from(
    Promise.all([
      storage.get<string>('access_token'),
      storage.get<string>('refresh_token'),
    ]),
  ).pipe(
    switchMap(([accessToken, refreshToken]) => {
      if (!accessToken) return next(req);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };
      if (refreshToken) {
        headers['x-refresh-token'] = refreshToken;
      }

      return next(req.clone({ setHeaders: headers })).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            const newAccess = event.headers.get('x-access-token');
            const newRefresh = event.headers.get('x-refresh-token');
            if (newAccess) void storage.set('access_token', newAccess);
            if (newRefresh) void storage.set('refresh_token', newRefresh);
          }
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            void Promise.all([
              storage.remove('access_token'),
              storage.remove('refresh_token'),
            ]).then(() => void router.navigate([AppRoutes.login]));
          }
          return throwError(() => err);
        }),
      );
    }),
  );
};
