import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { AppConfigService } from '../../../core/services/app-config.service';
import { ThemeService } from '../../../core/services/theme.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthApiService } from '../auth-api.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'stp-login',
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent, IconComponent, AlertComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  protected readonly themeService = inject(ThemeService);
  protected readonly config = inject(AppConfigService);
  protected readonly authApi = inject(AuthApiService);

  protected readonly submitAttempted = signal(false);
  protected readonly invalidCredentials = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.invalidCredentials.set(false));
  }

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const { identifier, password } = this.form.value;
      const result = await firstValueFrom(this.authApi.login(identifier!, password!));
      if (result?.access_token) {
        await this.storage.set('access_token', result.access_token);
        await this.storage.set('refresh_token', result.refresh_token);
        this.router.navigate(['/notices']);
      }
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) {
        this.invalidCredentials.set(true);
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected get identifierCtrl() {
    return this.form.controls.identifier;
  }

  protected get passwordCtrl() {
    return this.form.controls.password;
  }
}
