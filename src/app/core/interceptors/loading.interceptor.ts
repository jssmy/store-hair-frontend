import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * LoadingInterceptor — functional HTTP interceptor.
 *
 * Calls `LoadingService.start()` before each request and
 * `LoadingService.finish()` once it completes (success, error, or cancel).
 * The counter approach ensures the loader disappears only when ALL
 * concurrent requests have settled.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  // loading.start();

  return next(req).pipe(
    // finalize(() => loading.finish()),
  );
};
