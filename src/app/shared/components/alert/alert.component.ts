import { Component, computed, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

const ICON_MAP: Record<AlertVariant, string> = {
  success: 'check-circle',
  warning: 'warning',
  error: 'x-circle',
  info: 'info',
};

@Component({
  selector: 'stp-alert',
  imports: [NgClass, IconComponent],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('info');
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly dismissible = input<boolean>(false);
  readonly icon = input<string | null>(null);

  readonly dismissed = output<void>();

  protected readonly visible = signal(true);

  protected readonly resolvedIcon = computed(
    () => this.icon() ?? ICON_MAP[this.variant()],
  );

  protected readonly hostClasses = computed(() => ({
    'stp-alert': true,
    [`stp-alert--${this.variant()}`]: true,
  }));

  protected dismiss(): void {
    this.visible.set(false);
    this.dismissed.emit();
  }
}
