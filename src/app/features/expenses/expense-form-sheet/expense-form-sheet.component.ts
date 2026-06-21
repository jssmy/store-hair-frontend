import { Component, inject, signal } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ExpenseService, CreateExpensePayload } from '../../../core/services/expense.service';
import { ExpenseCategory, ExpenseStatus } from '../expenses.data';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';
import { StpNumericDirective } from '../../../shared/directives/numeric/numeric.directive';

@Component({
  selector: 'stp-expense-form-sheet',
  imports: [ButtonComponent, IconComponent, InputComponent, SelectComponent, StpNumericDirective],
  templateUrl: './expense-form-sheet.component.html',
  styleUrl: './expense-form-sheet.component.scss',
})
export class ExpenseFormSheetComponent {
  private readonly sheetRef   = inject<MatBottomSheetRef<ExpenseFormSheetComponent>>(MatBottomSheetRef);
  private readonly expenseApi = inject(ExpenseService);

  protected readonly description = signal('');
  protected readonly amount      = signal('');
  protected readonly category    = signal<string>(ExpenseCategory.OTHER);
  protected readonly status      = signal<string>(ExpenseStatus.PENDING);
  protected readonly notes       = signal('');
  protected readonly submitting  = signal(false);
  protected readonly submitted   = signal(false);

  protected readonly categoryOptions: SelectOption[] = [
    { value: ExpenseCategory.RENT,        label: 'Alquiler'      },
    { value: ExpenseCategory.SERVICES,    label: 'Servicios'     },
    { value: ExpenseCategory.STAFF,       label: 'Personal'      },
    { value: ExpenseCategory.SUPPLIES,    label: 'Suministros'   },
    { value: ExpenseCategory.MARKETING,   label: 'Marketing'     },
    { value: ExpenseCategory.TRANSPORT,   label: 'Transporte'    },
    { value: ExpenseCategory.MAINTENANCE, label: 'Mantenimiento' },
    { value: ExpenseCategory.OTHER,       label: 'Otros'         },
  ];

  protected readonly statusOptions: SelectOption[] = [
    { value: ExpenseStatus.PENDING, label: 'Pendiente' },
    { value: ExpenseStatus.PAID,    label: 'Pagado'    },
  ];

  protected get isValid(): boolean {
    return this.description().trim().length > 0 && Number(this.amount()) > 0;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (!this.isValid || this.submitting()) return;
    this.submitting.set(true);

    const payload: CreateExpensePayload = {
      description: this.description().trim(),
      amount:      Number(this.amount()),
      category:    this.category() as ExpenseCategory,
      status:      this.status() as ExpenseStatus,
      notes:       this.notes().trim() || undefined,
    };

    this.expenseApi.create(payload).subscribe({
      next: () => this.sheetRef.dismiss({ created: true }),
    }).add(() => this.submitting.set(false));
  }

  protected close(): void {
    this.sheetRef.dismiss();
  }
}
