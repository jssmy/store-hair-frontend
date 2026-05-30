import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CartItem } from '../../../features/products/products.data';
import { CartStepComponent } from './cart-step/cart-step.component';
import { PaymentStepComponent } from './payment-step/payment-step.component';
import { CustomerStepComponent } from './customer-step/customer-step.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import type { PaymentData } from './payment-step/payment-step.component';
import type { Customer } from '../../../core/services/customer.service';
import { SaleService } from '../../../core/services/sale.service';

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
  saleId?: number;
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
  private readonly saleService = inject(SaleService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly items = signal<CartItem[]>(inject<CartBottomSheetData>(MAT_BOTTOM_SHEET_DATA).items);
  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.salePrice, 0),
  );
  protected readonly step = signal<'listItems' | 'paymentMethod' | 'customerInformation' | 'confirmation' | 'saleError'>('listItems');
  protected readonly pendingPayment = signal<PaymentData | null>(null);
  protected readonly saving = signal(false);
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
    if (!customer) return;
    const payment = this.pendingPayment()!;
    this.saving.set(true);

    this.saleService.create(this.buildSalePayload(payment, customer.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sale) => {
          this.pendingResult = {
            items: this.items(),
            confirmed: true,
            payment,
            customer,
            saleId: sale.id,
          };
          this.saving.set(false);
          this.step.set('confirmation');
        },
        error: () => {
          this.saving.set(false);
          this.step.set('saleError');
        },
      });
  }

  private buildSalePayload(payment: PaymentData, customerId: number) {
    const details = this.items().map(item => ({
      productId: item.product.id,
      salePrice: item.salePrice,
    }));

    if (payment.method === 'cash') {
      return { paymentMethod: 'cash' as const, customerId, details, cashAmount: payment.efectivo, transferAmount: payment.digital };
    }
    return { paymentMethod: 'credit' as const, customerId, details, cashAmount: payment.creditEfectivo, transferAmount: payment.creditDigital };
  }

  protected retryFromError(): void {
    this.step.set('customerInformation');
  }

  protected done(): void {
    this.sheetRef.dismiss(this.pendingResult);
  }
}
