import { Component, computed, signal } from '@angular/core';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'stp-profile',
  imports: [InputComponent, ButtonComponent, IconComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  // TODO: populate from AuthService when available
  protected readonly name = signal('Joset');
  protected readonly email = signal('');
  protected readonly phone = signal('');
  protected readonly avatarUrl = signal<string | null>(null);

  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');

  protected readonly editingInfo = signal(false);
  protected readonly editingPassword = signal(false);

  protected readonly userInitial = computed(() =>
    this.name().charAt(0).toUpperCase()
  );

  private infoBackup = { email: '', phone: '' };

  protected onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.avatarUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected startEditingInfo(): void {
    this.infoBackup = { email: this.email(), phone: this.phone() };
    this.editingInfo.set(true);
  }

  protected cancelProfile(): void {
    this.email.set(this.infoBackup.email);
    this.phone.set(this.infoBackup.phone);
    this.editingInfo.set(false);
  }

  protected saveProfile(): void {
    // TODO: call ProfileService when backend is ready
    this.editingInfo.set(false);
  }

  protected cancelPassword(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.editingPassword.set(false);
  }

  protected savePassword(): void {
    // TODO: call ProfileService when backend is ready
    this.cancelPassword();
  }
}
