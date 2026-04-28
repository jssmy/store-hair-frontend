import { Component, input, output } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ButtonComponent } from '../../button/button.component';
import { IconComponent } from '../../icon/icon.component';
import {
  Credit,
  CreditStats,
  CreditStatus,
  FREQUENCY_LABELS,
  InstallmentRow,
} from '../../../../features/credits/credits.data';

@Component({
  selector: 'stp-credit-detail-step',
  imports: [DecimalPipe, LowerCasePipe, MatExpansionModule, ButtonComponent, IconComponent],
  templateUrl: './detail-step.component.html',
  styleUrl: './detail-step.component.scss',
})
export class CreditDetailStepComponent {
  readonly credit           = input.required<Credit>();
  readonly stats            = input.required<CreditStats>();
  readonly installmentRows  = input.required<InstallmentRow[]>();
  readonly paymentSuccessId = input<number | null>(null);
  readonly startPayment     = output<number>();

  protected readonly frequencyLabels = FREQUENCY_LABELS;

  protected canRegisterPayment(): boolean {
    const c = this.credit();
    return c.status !== 'completed' && (c.installments - c.paidInstallments) > 0;
  }

  protected creditId(c: Credit): string {
    return c.id.toString().padStart(4, '0');
  }

  protected statusLabel(status: CreditStatus): string {
    return status === 'active' ? 'Activo' : status === 'overdue' ? 'Vencido' : 'Completado';
  }

  protected createdAtDate(c: Credit): Date {
    return new Date(c.createdAt + 'T00:00:00');
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(date);
  }

  protected formatFullDate(date: Date): string {
    const label = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(date);
    return label[0].toUpperCase() + label.slice(1);
  }
}
