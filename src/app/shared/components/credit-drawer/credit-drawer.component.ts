import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import { Credit, FREQUENCY_LABELS, PaymentFrequency } from '../../../features/credits/credits.data';

export interface CreditDrawerData {
  credit?: Credit | null;
}

export interface CreditDrawerResult {
  customerName: string;
  customerPhone: string;
  total: number;
  initialAmount: number;
  creditEfectivo: number;
  creditDigital: number;
  installments: number;
  frequency: PaymentFrequency;
  firstPaymentDate: string;
}

interface CreditForm {
  customerName: string;
  customerPhone: string;
}

function computeFirstPaymentDate(frequency: PaymentFrequency): string {
  const d = new Date();
  if (frequency === 'semanal') d.setDate(d.getDate() + 7);
  else if (frequency === 'quincenal') d.setDate(d.getDate() + 15);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

const FREQUENCIES: { value: PaymentFrequency; label: string }[] = [
  { value: 'semanal',   label: FREQUENCY_LABELS.semanal   },
  { value: 'quincenal', label: FREQUENCY_LABELS.quincenal },
  { value: 'mensual',   label: FREQUENCY_LABELS.mensual   },
];

@Component({
  selector: 'stp-credit-drawer',
  imports: [DecimalPipe, ButtonComponent, IconComponent, InputComponent],
  templateUrl: './credit-drawer.component.html',
  styleUrl: './credit-drawer.component.scss',
})
export class CreditDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<CreditDrawerComponent, CreditDrawerResult | null>>(MatBottomSheetRef);

  private readonly data = inject<CreditDrawerData>(MAT_BOTTOM_SHEET_DATA, { optional: true });

  protected readonly editing: Credit | null = this.data?.credit ?? null;

  protected readonly INSTALLMENT_OPTIONS = INSTALLMENT_OPTIONS;
  protected readonly FREQUENCIES = FREQUENCIES;

  protected readonly form = signal<CreditForm>({
    customerName:  this.editing?.customerName  ?? '',
    customerPhone: this.editing?.customerPhone ?? '',
  });

  protected readonly total          = signal<number>(this.editing?.total ?? 0);
  protected readonly creditEfectivo = signal<number>(this.editing?.creditEfectivo ?? 0);
  protected readonly creditDigital  = signal<number>(this.editing?.creditDigital  ?? 0);
  protected readonly installments   = signal<number>(this.editing?.installments   ?? 1);
  protected readonly frequency      = signal<PaymentFrequency>(this.editing?.frequency ?? 'mensual');

  protected readonly initialAmount = computed(() =>
    Math.min(this.creditEfectivo() + this.creditDigital(), this.total()),
  );

  protected readonly financed = computed(() =>
    Math.max(0, this.total() - this.initialAmount()),
  );

  protected readonly installmentAmount = computed(() => {
    const n = this.installments();
    return n > 0 ? this.financed() / n : 0;
  });

  protected readonly firstPaymentDateLabel = computed(() => {
    const label = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date(computeFirstPaymentDate(this.frequency()) + 'T00:00:00'));
    return label[0].toUpperCase() + label.slice(1);
  });

  protected readonly submitting = signal(false);
  protected readonly success    = signal(false);

  protected readonly canSubmit = computed(() => {
    const f = this.form();
    return !!(f.customerName.trim() && f.customerPhone.trim() && this.total() > 0);
  });

  protected patchForm(patch: Partial<CreditForm>): void {
    this.form.update(prev => ({ ...prev, ...patch }));
  }

  protected onTotalInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.total.set(isNaN(val) ? 0 : Math.max(0, val));
  }

  protected onEfectivoInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    const cap = this.total() - this.creditDigital();
    this.creditEfectivo.set(isNaN(val) ? 0 : Math.max(0, Math.min(val, cap)));
  }

  protected onDigitalInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    const cap = this.total() - this.creditEfectivo();
    this.creditDigital.set(isNaN(val) ? 0 : Math.max(0, Math.min(val, cap)));
  }

  protected close(): void {
    this.sheetRef.dismiss(null);
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    setTimeout(() => {
      const f = this.form();
      this.submitting.set(false);
      this.success.set(true);

      const result: CreditDrawerResult = {
        customerName:  f.customerName.trim(),
        customerPhone: f.customerPhone.trim(),
        total:         this.total(),
        initialAmount: this.initialAmount(),
        creditEfectivo: this.creditEfectivo(),
        creditDigital:  this.creditDigital(),
        installments:   this.installments(),
        frequency:      this.frequency(),
        firstPaymentDate: computeFirstPaymentDate(this.frequency()),
      };

      setTimeout(() => this.sheetRef.dismiss(result), 1200);
    }, 600);
  }
}
