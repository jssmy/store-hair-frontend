import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import {
  Product,
  HAIR_TYPE_LABELS,
  HAIR_COLOR_HEX,
  HairType,
} from '../../../features/products/products.data';

const HAIR_TYPE_PHOSPHOR: Record<HairType, string> = {
  lote:       'scissors',
  viethanmita:'flower-lotus',
  golden:     'sun',
  premium:    'sparkle',
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'li[stp-sale-product-card]',
  imports: [DecimalPipe, ButtonComponent, IconComponent],
  templateUrl: './sale-product-card.component.html',
  styleUrl: './sale-product-card.component.scss',
  host: {
    'class': 'product-card',
    '[class.product-card--in-cart]': 'inCart()',
  },
})
export class SaleProductCardComponent {
  readonly product   = input.required<Product>();
  readonly inCart    = input<boolean>(false);
  readonly addToCart = output<number>();

  protected typeIcon(): string {
    return HAIR_TYPE_PHOSPHOR[this.product().type as HairType] ?? 'package';
  }

  protected typeLabel(): string {
    return HAIR_TYPE_LABELS[this.product().type as HairType] ?? (this.product().type ?? '');
  }

  protected imageUrl(): string | undefined {
    return this.product().imageUrls?.[0];
  }

  protected colorHex(): string {
    const c = this.product().color;
    return c ? HAIR_COLOR_HEX[c] : 'transparent';
  }

  protected colorTitle(): string {
    const c = this.product().color;
    if (!c) return '';
    return c === 'natural' ? 'Natural' : 'Pintado';
  }

  protected productCode(): string {
    return this.product().po!;
  }

  protected totalPrice(): number {
    const { price, weight } = this.product();
    return price * (weight ?? 1);
  }

  protected add(): void {
    this.addToCart.emit(1);
  }
}
