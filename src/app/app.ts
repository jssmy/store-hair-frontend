import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'stp-root',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('storePointWeb');
  protected readonly themeService = inject(ThemeService);
  protected readonly loadingService = inject(LoadingService);
}
