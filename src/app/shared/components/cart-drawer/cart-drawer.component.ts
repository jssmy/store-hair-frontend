import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CartItem } from '../../../features/products/products.data';
import { CartStepComponent } from './cart-step/cart-step.component';
import { PaymentStepComponent } from './payment-step/payment-step.component';
import { CustomerStepComponent } from './customer-step/customer-step.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import type { PaymentData } from './payment-step/payment-step.component';
import type { Customer } from '../../../core/services/customer.service';

export type { PaymentData, PaymentMethod, CashPaymentData, CreditPaymentData } from './payment-step/payment-step.component';
export type { Customer } from '../../../core/services/customer.service';

export interface CartBottomSheetData {
  items: CartItem[];
}

export interface CartDismissResult {
  items: CartItem[];
  confirmed: boolean;
  payment?: PaymentData;
  customer?: Customer;
}

@Component({
  selector: 'stp-cart-drawer',
  imports: [DecimalPipe, CartStepComponent, PaymentStepComponent, CustomerStepComponent, ButtonComponent, IconComponent],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
})
export class CartDrawerComponent {
  readonly swipeOptions = [
    { label: 'Eliminar', icon: 'trash', key: 'delete', stpClass: 'error-bg' },
  ];

  private readonly sheetRef = inject<MatBottomSheetRef<CartDrawerComponent, CartDismissResult | null>>(MatBottomSheetRef);
  protected readonly items = signal<CartItem[]>(inject<CartBottomSheetData>(MAT_BOTTOM_SHEET_DATA).items);
  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.salePrice, 0),
  );
  protected readonly step = signal<'listItems' | 'paymentMethod' | 'customerInformation' | 'confirmation'>('listItems');
  protected readonly pendingPayment = signal<PaymentData | null>(null);
  private pendingResult: CartDismissResult | null = null;

  protected close(): void {
    this.sheetRef.dismiss({ items: this.items(), confirmed: false });
  }

  protected updateQty(productId: number, quantity: number | undefined): void {
    if (quantity === undefined || quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this.items.update(items =>
      items.map(item => item.product.id === productId ? { ...item, quantity } : item),
    );
  }

  protected removeItem(productId: number): void {
    this.items.update(items => items.filter(item => item.product.id !== productId));
  }

  protected updateSalePrice(productId: number, salePrice: number): void {
    this.items.update(items =>
      items.map(item => item.product.id === productId ? { ...item, salePrice } : item),
    );
  }

  protected clear(): void {
    this.sheetRef.dismiss({ items: [], confirmed: false });
  }

  protected goToPayment(): void {
    this.step.set('paymentMethod');
  }

  protected goBack(): void {
    this.step.set('listItems');
  }

  protected goBackFromCustomer(): void {
    this.step.set('paymentMethod');
  }

  protected onPaymentConfirmed(payment: PaymentData): void {
    this.pendingPayment.set(payment);
    this.step.set('customerInformation');
  }

  protected onCustomerConfirmed(customer: Customer | undefined): void {
    this.pendingResult = {
      items: [],
      confirmed: true,
      payment: this.pendingPayment() ?? undefined,
      customer,
    };
    this.step.set('confirmation');
  }

  protected done(): void {
    this.sheetRef.dismiss(this.pendingResult);
  }
}
