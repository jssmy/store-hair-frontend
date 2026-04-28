import { Injectable, computed, signal } from '@angular/core';

/**
 * LoadingService — manages a global fullscreen loader.
 *
 * Tracks the number of concurrent pending operations (HTTP calls or manual).
 * The loader stays visible while `activeCount > 0`.
 *
 * Usage (manual):
 *   loadingService.start();
 *   // ... async work ...
 *   loadingService.finish();
 *
 * HTTP calls are handled automatically by `LoadingInterceptor`.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeCount = signal(0);

  /** True while at least one operation is in progress. */
  readonly isLoading = computed(() => this.activeCount() > 0);

  /** Increment the pending-operations counter. */
  start(): void {
    this.activeCount.update(n => n + 1);
  }

  /** Decrement the counter. Never goes below 0. */
  finish(): void {
    this.activeCount.update(n => Math.max(0, n - 1));
  }
}
