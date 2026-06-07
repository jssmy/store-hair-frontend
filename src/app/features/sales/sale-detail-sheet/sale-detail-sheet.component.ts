import { Component, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Sale, SalePayment, SalePaymentMethod, SalePaymentType } from '../sales.data';
import { SaleService } from '../../../core/services/sale.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InputNumericComponent } from '../../../shared/components/input-numeric/input-numeric.component';

export interface SaleDetailSheetData {
  sale: Sale;
}

@Component({
  selector: 'stp-sale-detail-sheet',
  imports: [DecimalPipe, DatePipe, ButtonComponent, IconComponent, InputNumericComponent],
  templateUrl: './sale-detail-sheet.component.html',
  styleUrl: './sale-detail-sheet.component.scss',
})
export class SaleDetailSheetComponent {
  private readonly sheetRef = inject<MatBottomSheetRef<SaleDetailSheetComponent>>(MatBottomSheetRef);
  private readonly saleApi  = inject(SaleService);

  protected readonly sale          = inject<SaleDetailSheetData>(MAT_BOTTOM_SHEET_DATA).sale;
  protected readonly payments      = signal<SalePayment[]>(this.sale.payments ?? []);
  protected readonly downloadingId = signal<number | null>(null);

  // ── Register payment form ─────────────────────────────────────
  protected readonly showPaymentForm   = signal(false);
  protected readonly paymentAmount     = signal(0);
  protected readonly paymentType       = signal<SalePaymentType>(SalePaymentType.CASH);
  protected readonly submittingPayment = signal(false);

  protected readonly SalePaymentMethod = SalePaymentMethod;
  protected readonly SalePaymentType   = SalePaymentType;

  protected close(): void {
    this.sheetRef.dismiss();
  }

  protected saleTotal(): number {
    return this.payments().reduce((s, p) => s + Number(p.amount), 0);
  }

  protected paymentPercent(): number {
    const total = Number(this.sale.totalAmount ?? 0);
    if (total <= 0) return 100;
    return Math.min(100, (this.saleTotal() / total) * 100);
  }

  protected isPaidFull(): boolean {
    return this.paymentPercent() >= 99.9;
  }

  protected customerName(): string {
    return this.sale.customer?.names ?? 'Cliente general';
  }

  protected paymentTypeLabel(type: SalePaymentType): string {
    return type === SalePaymentType.CASH ? 'Efectivo' : 'Transferencia';
  }

  protected paymentTypeIcon(type: SalePaymentType): string {
    return type === SalePaymentType.CASH ? 'money' : 'device-mobile';
  }

  protected paymentLabel(): string {
    return this.sale.paymentMethod === SalePaymentMethod.CASH ? 'Al contado' : 'A crédito';
  }

  protected togglePaymentForm(): void {
    this.showPaymentForm.update(v => !v);
    if (!this.showPaymentForm()) this.paymentAmount.set(0);
  }

  protected submitPayment(): void {
    const amount  = this.paymentAmount();
    const pending = +this.sale.totalAmount - this.saleTotal();
    if (amount <= 0 || amount > pending || this.submittingPayment()) return;
    this.submittingPayment.set(true);
    this.saleApi.registerPayment(this.sale.id, {
      amount,
      type: this.paymentType() as 'cash' | 'transfer',
    }).subscribe({
      next: () => {
        const newPayment: SalePayment = {
          id: Date.now(),
          amount,
          type: this.paymentType(),
          imageUrl: null,
          createdAt: new Date().toISOString(),
        };
        this.payments.update(prev => [...prev, newPayment]);
        this.paymentAmount.set(0);
        this.showPaymentForm.set(false);
      },
    }).add(() => this.submittingPayment.set(false));
  }

  protected downloadReceipt(): void {
    if (this.downloadingId() === this.sale.id) return;
    this.downloadingId.set(this.sale.id);
    this.saleApi.downloadPdf(this.sale.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `boleta-${this.sale.vt}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }).add(() => this.downloadingId.set(null));
  }
}
