import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'surface';
export type BadgeSize = 'sm' | 'md';
export type BadgeStyle = 'solid' | 'light' | 'outlined';

@Component({
  selector: 'stp-badge',
  imports: [NgClass],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('primary');
  readonly size = input<BadgeSize>('md');
  readonly badgeStyle = input<BadgeStyle>('light');
  readonly dot = input<boolean>(false);

  protected readonly hostClasses = computed(() => ({
    'stp-badge': true,
    [`stp-badge--${this.variant()}`]: true,
    [`stp-badge--${this.size()}`]: true,
    [`stp-badge--${this.badgeStyle()}`]: true,
    'stp-badge--dot': this.dot(),
  }));
}
