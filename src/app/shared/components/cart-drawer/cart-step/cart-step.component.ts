import { Component, computed, effect, input, output } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { DecimalPipe } from '@angular/common';
import { CartItem } from '../../../../features/products/products.data';
import { ButtonComponent } from '../../button/button.component';
import { CartItemComponent } from '../../cart-item/cart-item.component';
import { SwipeItemComponent, SwipeOption } from '../../swipe-item/swipe-item.component';
import { EmptyStateComponent } from '../../empty-state/empty-state.component';

@Component({
  selector: 'stp-cart-step',
  imports: [DecimalPipe, ButtonComponent, CartItemComponent, SwipeItemComponent, IconComponent, EmptyStateComponent],
  templateUrl: './cart-step.component.html',
  styleUrl: './cart-step.component.scss',
})
export class CartStepComponent {
  readonly items        = input.required<CartItem[]>();
  readonly swipeOptions = input<SwipeOption[]>([]);

  readonly remove          = output<number>();
  readonly salePriceChange = output<{ productId: number; salePrice: number }>();
  readonly close           = output<void>();
  readonly clear           = output<void>();
  readonly checkout        = output<void>();


  constructor() {
    effect(() => {
      console.log('Cart items:', this.items());
    });
  }


  /** Total usa el precio de venta definido por el usuario */
  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + (item.salePrice * (item.product.weight ?? 0)), 0),
  );

  protected readonly count = computed(() => this.items().length);
}
