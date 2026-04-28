import { DecimalPipe } from '@angular/common';
import { Component, input, model, output, signal } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { InputNumericComponent } from '../input-numeric/input-numeric.component';
import { CATEGORY_ICONS, Product } from '../../../features/products/products.data';

@Component({
  selector: 'li[stp-sale-product-card]',
  imports: [DecimalPipe, ButtonComponent, InputNumericComponent],
  templateUrl: './sale-product-card.component.html',
  styleUrl: './sale-product-card.component.scss',
  host: {
    'class': 'product-card',
    '[class.product-card--in-cart]': 'inCart()',
    '[class.product-card--out-of-stock]': 'product().stock === 0',
  },
})
export class SaleProductCardComponent {
  readonly product = input.required<Product>();
  
  readonly quantity = signal(1);

  readonly inCart = input<boolean>(false);

  readonly addToCart = output<number>();
  
  protected categoryIcon(): string {
    return CATEGORY_ICONS[this.product().category];
  }

  protected add(): void {
    
    if (this.product().stock === 0) return;

     this.addToCart.emit(this.quantity());
     this.quantity.set(1);
  }

}
