import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ButtonComponent } from '../../button/button.component';
import { IconComponent } from '../../icon/icon.component';
import { CustomerService, Customer } from '../../../../core/services/customer.service';
import { CartItem } from '../../../../features/products/products.data';
import { PaymentData } from '../payment-step/payment-step.component';

type CustomerStepView = 'search' | 'new-form' | 'update-confirm';

@Component({
  selector: 'stp-customer-step',
  imports: [DecimalPipe, MatExpansionModule, ButtonComponent, IconComponent],
  templateUrl: './customer-step.component.html',
  styleUrl: './customer-step.component.scss',
})
export class CustomerStepComponent {
  readonly items = input.required<CartItem[]>();
  readonly payment = input.required<PaymentData>();
  readonly total = input.required<number>();

  readonly back = output<void>();
  readonly confirm = output<Customer | undefined>();

  private readonly customerService = inject(CustomerService);

  protected readonly view = signal<CustomerStepView>('search');
  protected readonly searchQuery = signal('');
  protected readonly selectedCustomer = signal<Customer | undefined>(undefined);

  protected readonly newNames = signal('');
  protected readonly newPhone = signal('');
  protected readonly newDni = signal('');
  protected readonly formErrors = signal<Record<string, string>>({});
  protected readonly phoneCollision = signal<Customer | undefined>(undefined);

  protected readonly searchResults = computed(() => {
    const q = this.searchQuery().trim();
    if (!q) return [];
    return this.customerService.search(q);
  });

  protected readonly whatsappMessage = computed(() => {
    const customer = this.selectedCustomer();
    if (!customer) return '';
    return this.buildMessage(customer);
  });

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.searchQuery.set('');
  }

  protected clearSelection(): void {
    this.selectedCustomer.set(undefined);
    this.searchQuery.set('');
  }

  protected showNewForm(): void {
    this.newNames.set('');
    this.newPhone.set('');
    this.newDni.set('');
    this.formErrors.set({});
    this.view.set('new-form');
  }

  protected cancelNewForm(): void {
    this.view.set('search');
  }

  protected saveNewCustomer(): void {
    const errors: Record<string, string> = {};
    const names = this.newNames().trim();
    const phone = this.newPhone().trim();
    const dni = this.newDni().trim();

    if (!names) errors['names'] = 'El nombre es requerido';
    if (!phone) errors['phone'] = 'El teléfono es requerido';
    else if (!/^\d{9}$/.test(phone)) errors['phone'] = 'Ingresa un teléfono válido de 9 dígitos';
    if (dni && !/^\d{8}$/.test(dni)) errors['dni'] = 'El DNI debe tener 8 dígitos';

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    const existing = this.customerService.findByPhone(phone);
    if (existing) {
      this.phoneCollision.set(existing);
      this.view.set('update-confirm');
      return;
    }

    const customer = this.customerService.add({ names, phone, dni: dni || undefined });
    this.selectedCustomer.set(customer);
    this.view.set('search');
  }

  protected confirmUpdate(): void {
    const collision = this.phoneCollision();
    if (!collision) return;
    const names = this.newNames().trim();
    const dni = this.newDni().trim();
    this.customerService.update(collision.id, { names, dni: dni || undefined });
    const updated = this.customerService.findById(collision.id)!;
    this.selectedCustomer.set(updated);
    this.phoneCollision.set(undefined);
    this.view.set('search');
  }

  protected cancelUpdate(): void {
    this.phoneCollision.set(undefined);
    this.view.set('new-form');
  }

  protected confirmSale(): void {
    const customer = this.selectedCustomer();
    this.confirm.emit(customer);
  }

  private buildMessage(customer: Customer): string {
    const payment = this.payment();
    const items = this.items();
    const total = this.total();

    const itemLines = items
      .map(i => `• ${i.product.name} x${i.quantity} — S/ ${(i.product.price * i.quantity).toFixed(2)}`)
      .join('\n');

    const sep = '─────────────────';
    let paymentBlock: string;

    if (payment.method === 'cash') {
      const parts: string[] = [];
      if (payment.efectivo > 0) parts.push(`Efectivo: S/ ${payment.efectivo.toFixed(2)}`);
      if (payment.digital > 0) parts.push(`Yape: S/ ${payment.digital.toFixed(2)}`);
      const totalPaid = payment.efectivo + payment.digital;
      const change = Math.max(0, totalPaid - total);
      const changeLine = change > 0.001 ? `\n  - Vuelto: S/ ${change.toFixed(2)}` : '';
      paymentBlock = `✅ *Pago al contado*\n  - ${parts.join('\n  - ')}${changeLine}`;
    } else {
      const initLine = payment.initialAmount > 0
        ? `\n  - Abono inicial: S/ ${payment.initialAmount.toFixed(2)}`
        : '';
      const financed = Math.max(0, total - payment.initialAmount);
      const installmentAmt = payment.installments > 0 ? financed / payment.installments : 0;
      const freqMap: Record<string, string> = { semanal: 'semanal', quincenal: 'quincenal', mensual: 'mensual' };
      const cuota = payment.installments === 1 ? 'cuota' : 'cuotas';
      const dateFormatted = new Intl.DateTimeFormat('es-PE', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(new Date(payment.firstPaymentDate + 'T12:00:00'));
      paymentBlock = `💳 *Pago a crédito*${initLine}\n  - Saldo financiado: S/ ${financed.toFixed(2)}\n  - ${payment.installments} ${cuota} ${freqMap[payment.frequency]} de S/ ${installmentAmt.toFixed(2)} c/u\n  - Primera fecha de pago: ${dateFormatted}`;
    }

    return `Hola *${customer.names}*! 👋\n\n📋 *Detalle de tu compra:*\n${itemLines}\n${sep}\n💰 *Total: S/ ${total.toFixed(2)}*\n${paymentBlock}\n\n¡Gracias por tu compra! 🙏`;
  }
}
