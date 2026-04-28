import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl';
export type CardShadow = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'stp-card',
  imports: [NgClass],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  readonly padding = input<CardPadding>('md');
  readonly radius = input<CardRadius>('md');
  readonly shadow = input<CardShadow>('sm');
  readonly border = input<boolean>(true);
  readonly interactive = input<boolean>(false);

  protected readonly hostClasses = computed(() => ({
    'stp-card': true,
    [`stp-card--p-${this.padding()}`]: true,
    [`stp-card--radius-${this.radius()}`]: true,
    [`stp-card--shadow-${this.shadow()}`]: true,
    'stp-card--border': this.border(),
    'stp-card--interactive': this.interactive(),
  }));
}
