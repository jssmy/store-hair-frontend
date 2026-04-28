import { Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type TagVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'surface';
export type TagSize = 'sm' | 'md';
export type TagStyle = 'light' | 'solid' | 'outlined';

@Component({
  selector: 'stp-tag',
  imports: [NgClass, IconComponent],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
})
export class TagComponent {
  readonly variant = input<TagVariant>('surface');
  readonly size = input<TagSize>('md');
  readonly tagStyle = input<TagStyle>('light');
  readonly removable = input<boolean>(false);
  readonly icon = input<string | null>(null);

  readonly removed = output<void>();

  protected readonly hostClasses = computed(() => ({
    'stp-tag': true,
    [`stp-tag--${this.variant()}`]: true,
    [`stp-tag--${this.size()}`]: true,
    [`stp-tag--${this.tagStyle()}`]: true,
  }));
}
