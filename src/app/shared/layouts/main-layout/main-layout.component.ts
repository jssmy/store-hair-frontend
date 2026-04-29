import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, from, map, startWith } from 'rxjs';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AppFooterComponent } from '../../components/app-footer/app-footer.component';
import { BottomBarComponent } from '../../components/bottom-bar/bottom-bar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AppRoutes } from '../../../core/constants/app-routes';
import { AuthUserService } from '../../../core/services/auth-user.service';

const SIDEBAR_HIDDEN_ROUTES: string[] = [AppRoutes.profile];

@Component({
  selector: 'stp-main-layout',
  imports: [RouterOutlet, AppHeaderComponent, AppFooterComponent, BottomBarComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly authUser = inject(AuthUserService);

  protected readonly user = toSignal(from(this.authUser.user()));
  protected readonly userName = computed(() => this.user()?.name?.split(' ')[0] || '');
  protected readonly sidebarOpen = signal(false);

  protected readonly hideSidebar = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => SIDEBAR_HIDDEN_ROUTES.some(r => e.urlAfterRedirects.startsWith('/' + r))),
      startWith(SIDEBAR_HIDDEN_ROUTES.some(r => this.router.url.startsWith('/' + r))),
    ),
    { initialValue: false },
  );

  constructor() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) this.sidebarOpen.set(false);
    });
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  protected goToProfile(): void {
    this.router.navigate([AppRoutes.profile]);
  }
}
