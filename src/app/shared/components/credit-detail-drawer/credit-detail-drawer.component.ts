import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { AlertComponent } from '../alert/alert.component';
import { InputComponent } from '../input/input.component';
import {
  Credit,
  CreditStats,
  CreditStatus,
  computeCreditStats,
  computeInstallmentRows,
} from '../../../features/credits/credits.data';
import { CreditListStepComponent } from './list-step/list-step.component';
import { CreditDetailStepComponent } from './detail-step/detail-step.component';

export interface CreditDetailData {
  customerName:  string;
  customerPhone: string;
  customerDni?:  string;
  credits:       Credit[];
}

export interface CreditDetailResult {
  customerPhone:  string;
  updatedCredits: Credit[];
}

@Component({
  selector: 'stp-credit-detail-drawer',
  imports: [DecimalPipe, ButtonComponent, IconComponent, AlertComponent, InputComponent, CreditListStepComponent, CreditDetailStepComponent],
  templateUrl: './credit-detail-drawer.component.html',
  styleUrl: './credit-detail-drawer.component.scss',
})
export class CreditDetailDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<CreditDetailDrawerComponent, CreditDetailResult | null>>(MatBottomSheetRef);

  private readonly data = inject<CreditDetailData>(MAT_BOTTOM_SHEET_DATA);

  protected readonly customerName  = this.data.customerName;
  protected readonly customerPhone = this.data.customerPhone;
  protected readonly customerDni   = this.data.customerDni;

  protected readonly credits = signal<Credit[]>(this.data.credits.map(c => ({ ...c })));
  protected readonly today = new Date();

  protected readonly selectedCreditId = signal<number | null>(
    this.data.credits.length === 1 ? this.data.credits[0].id : null,
  );

  // protected readonly currentStep = computed<'list' | 'detail' | 'confirm'>(() =>
  //   this.selectedCreditId() !== null ? 'detail' : 'list',
  // );

  protected readonly currentStep = linkedSignal<'list' | 'detail' | 'confirm' | 'success'>(() =>
    this.selectedCreditId() !== null ? 'detail' : 'list',
  );

  protected readonly successPaidInstallment = signal<number>(0);
  protected readonly successCreditId        = signal<string>('');
  protected readonly successAmount          = signal<number>(0);
  protected readonly successEfectivo        = signal<number>(0);
  protected readonly successDigital         = signal<number>(0);

  protected readonly selectedCredit = computed(() => {
    const id = this.selectedCreditId();
    return id !== null ? (this.credits().find(c => c.id === id) ?? null) : null;
  });

  protected readonly selectedStats = computed(() => {
    const c = this.selectedCredit();
    return c ? computeCreditStats(c) : null;
  });

  protected readonly selectedInstallmentRows = computed(() => {
    const c = this.selectedCredit();
    return c ? computeInstallmentRows(c, this.today) : [];
  });

  protected readonly statsMap = computed(() => {
    const map = new Map<number, CreditStats>();
    for (const c of this.credits()) {
      map.set(c.id, computeCreditStats(c));
    }
    return map;
  });

  protected readonly totalAlertCount = computed(() =>
    this.credits().filter(c => this.statsMap().get(c.id)?.hasAlert).length,
  );

  protected readonly confirmingCreditId        = signal<number | null>(null);
  protected readonly paymentSuccessId          = signal<number | null>(null);
  protected readonly pendingPaymentAmount      = signal<number | null>(null);
  protected readonly confirmingInstallmentAmt  = signal<number>(0);
  protected readonly paymentEfectivoStr        = signal<string>('');
  protected readonly paymentDigitalStr         = signal<string>('');

  protected readonly paymentEfectivoAmount = computed<number>(() => {
    const v = parseFloat(this.paymentEfectivoStr());
    return isNaN(v) || v < 0 ? 0 : v;
  });

  protected readonly paymentDigitalAmount = computed<number>(() => {
    const v = parseFloat(this.paymentDigitalStr());
    return isNaN(v) || v < 0 ? 0 : v;
  });

  protected readonly totalPaymentAmount = computed(() =>
    this.paymentEfectivoAmount() + this.paymentDigitalAmount()
  );

  protected readonly paymentExceedsLimit = computed(() =>
    this.totalPaymentAmount() > this.confirmingInstallmentAmt() + 0.001
  );

  protected readonly isPaymentSplitValid = computed(() =>
    this.totalPaymentAmount() > 0 && !this.paymentExceedsLimit()
  );

  protected stats(credit: Credit): CreditStats {
    return this.statsMap().get(credit.id)!;
  }

  protected customerInitials(): string {
    return this.customerName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  protected dominantStatus(): CreditStatus {
    const creds = this.credits();
    if (creds.some(c => c.status === 'overdue'))  return 'overdue';
    if (creds.some(c => c.status === 'active'))   return 'active';
    return 'completed';
  }

  protected formatFullDate(date: Date): string {
    const label = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(date);
    return label[0].toUpperCase() + label.slice(1);
  }

  protected creditId(credit: Credit): string {
    return credit.id.toString().padStart(4, '0');
  }

  protected selectCredit(id: number): void {
    this.selectedCreditId.set(id);
  }

  protected goBack(): void {
    this.selectedCreditId.set(null);
  }

  protected startPayment(creditId: number): void {
    const credit = this.credits().find(c => c.id === creditId);
    if (!credit) return;
    const defaultAmount = computeCreditStats(credit).installmentAmount;
    this.confirmingInstallmentAmt.set(defaultAmount);
    this.paymentEfectivoStr.set(defaultAmount.toFixed(2));
    this.paymentDigitalStr.set('0.00');
    this.pendingPaymentAmount.set(null);
    this.confirmingCreditId.set(creditId);
    this.currentStep.set('confirm');
  }

  protected proceedToConfirm(): void {
    if (!this.isPaymentSplitValid()) return;
    this.pendingPaymentAmount.set(this.totalPaymentAmount());
  }

  protected backToInput(): void {
    this.pendingPaymentAmount.set(null);
  }

  protected cancelPayment(): void {
    this.currentStep.set('detail');
    this.confirmingCreditId.set(null);
    this.pendingPaymentAmount.set(null);
  }

  protected confirmPayment(): void {
    const id = this.confirmingCreditId();
    if (id === null) return;

    let paidInstallmentNumber = 0;
    this.credits.update(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newPaid    = c.paidInstallments + 1;
      paidInstallmentNumber = newPaid;
      const isComplete = newPaid >= c.installments;
      return {
        ...c,
        paidInstallments: newPaid,
        status: isComplete ? 'completed' : c.status === 'overdue' ? 'active' : c.status,
      } as Credit;
    }));

    this.successPaidInstallment.set(paidInstallmentNumber);
    this.successCreditId.set(id.toString().padStart(4, '0'));
    this.successAmount.set(this.pendingPaymentAmount() ?? 0);
    this.successEfectivo.set(this.paymentEfectivoAmount());
    this.successDigital.set(this.paymentDigitalAmount());
    this.confirmingCreditId.set(null);
    this.pendingPaymentAmount.set(null);
    this.currentStep.set('success');
  }

  protected confirmingCredit(): Credit | null {
    const id = this.confirmingCreditId();
    return id !== null ? (this.credits().find(c => c.id === id) ?? null) : null;
  }

  protected close(): void {
    this.sheetRef.dismiss({
      customerPhone:  this.customerPhone,
      updatedCredits: this.credits(),
    });
  }
}
