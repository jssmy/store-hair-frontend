import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { AppRoutes } from '../constants/app-routes';
import { AuthApiService } from '../../features/auth/auth-api.service';
import { environment } from '../../../environments/environment';

const ignoredUrls = [environment.endpoints.auth.refresh, environment.endpoints.auth.login];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const router = inject(Router);
  const authService = inject(AuthApiService);

  if (ignoredUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  return from(
    Promise.all([
      storage.get<string>('access_token'),
      storage.get<string>('refresh_token'),
    ]),
  ).pipe(
    switchMap(([accessToken, refreshToken]) => {
      const authReq = accessToken
        ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
        : req;

      return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status !== 401) {
            return throwError(() => err);
          }

          if (!refreshToken) {
            return from(storage.clear()).pipe(
              switchMap(() => {
                router.navigate([AppRoutes.login]);
                return throwError(() => err);
              }),
            );
          }

          return authService.refresh(refreshToken).pipe(
            switchMap(tokens =>
              from(
                Promise.all([
                  storage.set('access_token', tokens.access_token),
                  storage.set('refresh_token', tokens.refresh_token),
                ]),
              ).pipe(
                switchMap(() => {
                  const retryReq = req.clone({
                    setHeaders: { Authorization: `Bearer ${tokens.access_token}` },
                  });
                  return next(retryReq);
                }),
              ),
            ),
            catchError((refreshErr: HttpErrorResponse) =>
              from(storage.clear()).pipe(
                switchMap(() => {
                  router.navigate([AppRoutes.login]);
                  return throwError(() => refreshErr);
                }),
              ),
            ),
          );
        }),
      );
    }),
  );
};
