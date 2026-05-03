import { DecimalPipe } from '@angular/common';
import { Component, input, model, output, signal } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { Product } from '../../../features/products/products.data';

@Component({
  selector: 'li[stp-sale-product-card]',
  imports: [DecimalPipe, ButtonComponent],
  templateUrl: './sale-product-card.component.html',
  styleUrl: './sale-product-card.component.scss',
  host: {
    'class': 'product-card',
    '[class.product-card--in-cart]': 'inCart()',
    // '[class.product-card--out-of-stock]': 'product().stock === 0',
  },
})
export class SaleProductCardComponent {
  readonly product = input.required<Product>();
  
  readonly quantity = signal(1);

  readonly inCart = input<boolean>(false);

  readonly addToCart = output<number>();


  protected add(): void {
    
     this.addToCart.emit(this.quantity());
     this.quantity.set(1);
  }

}
