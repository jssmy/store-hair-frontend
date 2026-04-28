import { Component, input, output } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import {
  Credit,
  CreditStats,
  CreditStatus,
  FREQUENCY_LABELS,
  computeCreditStats,
} from '../../../../features/credits/credits.data';

@Component({
  selector: 'stp-credit-list-step',
  imports: [DecimalPipe, LowerCasePipe, IconComponent],
  templateUrl: './list-step.component.html',
  styleUrl: './list-step.component.scss',
})
export class CreditListStepComponent {
  readonly credits  = input.required<Credit[]>();
  readonly selected = output<number>();

  protected readonly frequencyLabels = FREQUENCY_LABELS;

  protected stats(c: Credit): CreditStats {
    return computeCreditStats(c);
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
}
