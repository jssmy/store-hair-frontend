import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { AppConfigService } from '../../../core/services/app-config.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'stp-app-header',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  readonly userName = input<string>('');
  readonly menuToggle = output<void>();
  readonly profileSettings = output<void>();
  readonly accountSettings = output<void>();
  readonly logout = output<void>();

  protected readonly config = inject(AppConfigService);
  protected readonly storageService = inject(StorageService);
  protected readonly themeService = inject(ThemeService);
  private readonly el = inject(ElementRef);
  readonly router = inject(Router);

  protected readonly dropdownOpen = signal(false);

  protected userInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  protected toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  protected onProfileSettings(): void {
    this.profileSettings.emit();
    this.dropdownOpen.set(false);
  }

  protected onAccountSettings(): void {
    this.accountSettings.emit();
    this.dropdownOpen.set(false);
  }

  protected onLogout(): void {
    this.storageService.clear();
    this.router.navigate(['/login']);
    this.logout.emit();
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.dropdownOpen.set(false);
    }
  }
}
