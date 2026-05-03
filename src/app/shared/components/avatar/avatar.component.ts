import { Component, computed, input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'surface';

@Component({
  selector: 'stp-avatar',
  imports: [NgClass],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly name = input<string>('');
  readonly size = input<AvatarSize>('md');
  readonly variant = input<AvatarVariant>('primary');
  readonly alt = input<string>('');

  protected readonly initials = computed(() => {
    const n = this.name().trim();
    if (!n) return '?';
    const parts = n.split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly hostClasses = computed(() => ({
    'stp-avatar': true,
    [`stp-avatar--${this.size()}`]: true,
    [`stp-avatar--${this.variant()}`]: !this.src(),
  }));

  protected readonly showImage = computed(() => !!this.src());
}
