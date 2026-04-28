import { Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { DecimalPipe } from '@angular/common';
import { CartItem } from '../../../../features/products/products.data';
import { ButtonComponent } from '../../button/button.component';
import { CartItemComponent } from '../../cart-item/cart-item.component';
import { SwipeItemComponent, SwipeOption } from '../../swipe-item/swipe-item.component';

@Component({
  selector: 'stp-cart-step',
  imports: [DecimalPipe, ButtonComponent, CartItemComponent, SwipeItemComponent, IconComponent],
  templateUrl: './cart-step.component.html',
  styleUrl: './cart-step.component.scss',
})
export class CartStepComponent {
  readonly items = input.required<CartItem[]>();
  readonly swipeOptions = input<SwipeOption[]>([]);

  readonly quantityChange = output<{ productId: number; quantity: number | undefined }>();
  readonly remove = output<number>();
  readonly close = output<void>();
  readonly clear = output<void>();
  readonly checkout = output<void>();

  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );
  protected readonly count = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0),
  );
}
