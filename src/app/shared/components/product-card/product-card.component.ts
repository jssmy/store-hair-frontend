import { Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import {
  CATEGORY_ICONS,
  Product,
  ProductCategory,
} from '../../../features/products/products.data';

@Component({
  selector: 'li[stp-product-card]',
  imports: [IconComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  host: { 'class': 'product-card' },
})
export class ProductCardComponent {
  readonly product = input.required<Product>();

  protected stockStatus(stock: number): 'ok' | 'low' | 'out' {
    if (stock === 0) return 'out';
    if (stock <= 5) return 'low';
    return 'ok';
  }

  protected stockLabel(stock: number): string {
    if (stock === 0) return 'Sin stock';
    if (stock <= 5) return `Bajo: ${stock}`;
    return `Stock: ${stock}`;
  }

  protected formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
  }

  protected categoryIcon(category: ProductCategory): string {
    return CATEGORY_ICONS[category];
  }

  protected productInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
}
