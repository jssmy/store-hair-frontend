import { Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import {
  HAIR_TYPE_ICONS,
  Product,
  HairType,
} from '../../../features/products/products.data';

@Component({
  selector: 'li[stp-product-card]',
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

  protected hairTypeIcon(hairType: HairType): string {
    return HAIR_TYPE_ICONS[hairType];
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
