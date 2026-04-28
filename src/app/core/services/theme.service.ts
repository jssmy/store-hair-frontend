import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sp-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(StorageService);

  readonly theme = signal<Theme>(this.resolveSystemTheme());

  constructor() {
    // Carga el tema guardado de forma asíncrona (soporta Capacitor en nativo)
    this.storage.get<Theme>(STORAGE_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark') {
        this.theme.set(stored);
      }
    });

    effect(() => {
      const current = this.theme();
      this.document.documentElement.setAttribute('data-theme', current);
      this.storage.set(STORAGE_KEY, current);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  set(theme: Theme): void {
    this.theme.set(theme);
  }

  private resolveSystemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
