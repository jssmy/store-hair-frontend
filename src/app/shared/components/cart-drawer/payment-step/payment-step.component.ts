import { Component, computed, input, output, signal } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { DecimalPipe } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { AlertComponent } from '../../alert/alert.component';

export type PaymentMethod = 'cash' | 'credit';

export interface CashPaymentData {
  method: 'cash';
  efectivo: number;
  digital: number;
}

export interface CreditPaymentData {
  method: 'credit';
  initialAmount: number;
  creditEfectivo: number;
  creditDigital: number;
}

export type PaymentData = CashPaymentData | CreditPaymentData;

@Component({
  selector: 'stp-payment-step',
  imports: [DecimalPipe, ButtonComponent, IconComponent, AlertComponent],
  templateUrl: './payment-step.component.html',
  styleUrl: './payment-step.component.scss',
})
export class PaymentStepComponent {
  readonly total = input.required<number>();

  readonly back = output<void>();
  readonly confirm = output<PaymentData>();

  protected readonly paymentMethod = signal<PaymentMethod | null>(null);

  protected readonly efectivo = signal<number>(0);
  protected readonly digital = signal<number>(0);
  protected readonly totalPaid = computed(() => this.efectivo() + this.digital());
  protected readonly change = computed(() => Math.max(0, this.totalPaid() - this.total()));
  protected readonly remaining = computed(() => Math.max(0, this.total() - this.totalPaid()));
  protected readonly progressPercent = computed(() =>
    this.total() > 0 ? Math.min(100, (this.totalPaid() / this.total()) * 100) : 0,
  );

  protected readonly creditEfectivo = signal<number>(0);
  protected readonly creditDigital = signal<number>(0);
  protected readonly initialAmount = computed(() =>
    Math.min(this.creditEfectivo() + this.creditDigital(), this.total())
  );
  protected readonly financed = computed(() => Math.max(0, this.total() - this.initialAmount()));

  protected readonly canConfirm = computed(() => {
    const method = this.paymentMethod();
    if (!method) return false;
    if (method === 'cash') return this.totalPaid() >= this.total() - 0.001;
    return true;
  });

  protected selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
    if (method === 'cash' && this.efectivo() === 0 && this.digital() === 0) {
      this.efectivo.set(this.total());
    }
  }

  protected onEfectivoInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.efectivo.set(isNaN(val) ? 0 : Math.max(0, val));
  }

  protected onDigitalInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.digital.set(isNaN(val) ? 0 : Math.max(0, val));
  }

  protected onCreditEfectivoInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.creditEfectivo.set(isNaN(val) ? 0 : Math.max(0, Math.min(val, this.total() - this.creditDigital())));
  }

  protected onCreditDigitalInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.creditDigital.set(isNaN(val) ? 0 : Math.max(0, Math.min(val, this.total() - this.creditEfectivo())));
  }

  protected confirmPayment(): void {
    const method = this.paymentMethod();
    if (!method || !this.canConfirm()) return;

    const payment: PaymentData = method === 'cash'
      ? { method: 'cash', efectivo: this.efectivo(), digital: this.digital() }
      : { method: 'credit', initialAmount: this.initialAmount(), creditEfectivo: this.creditEfectivo(), creditDigital: this.creditDigital() };

    this.confirm.emit(payment);
  }
}
