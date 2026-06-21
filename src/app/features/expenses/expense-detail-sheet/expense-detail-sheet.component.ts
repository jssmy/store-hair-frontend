import { Component, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Expense, ExpenseCategory, ExpenseStatus } from '../expenses.data';
import { ExpenseService } from '../../../core/services/expense.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

export interface ExpenseDetailSheetData {
  expense: Expense;
}

@Component({
  selector: 'stp-expense-detail-sheet',
  imports: [DecimalPipe, DatePipe, ButtonComponent, IconComponent],
  templateUrl: './expense-detail-sheet.component.html',
  styleUrl: './expense-detail-sheet.component.scss',
})
export class ExpenseDetailSheetComponent {
  private readonly sheetRef   = inject<MatBottomSheetRef<ExpenseDetailSheetComponent>>(MatBottomSheetRef);
  private readonly expenseApi = inject(ExpenseService);

  protected readonly expense    = inject<ExpenseDetailSheetData>(MAT_BOTTOM_SHEET_DATA).expense;
  protected readonly status     = signal<ExpenseStatus>(this.expense.status);
  protected readonly markingPaid = signal(false);
  protected readonly deleting   = signal(false);
  protected readonly hasChanged = signal(false);

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly ExpenseStatus   = ExpenseStatus;

  protected isPaid(): boolean {
    return this.status() === ExpenseStatus.PAID;
  }

  protected close(): void {
    this.sheetRef.dismiss(this.hasChanged() ? { refresh: true } : undefined);
  }

  protected markAsPaid(): void {
    if (this.markingPaid() || this.isPaid()) return;
    this.markingPaid.set(true);
    this.expenseApi.update(this.expense.id, { status: ExpenseStatus.PAID }).subscribe({
      next: () => {
        this.status.set(ExpenseStatus.PAID);
        this.hasChanged.set(true);
      },
    }).add(() => this.markingPaid.set(false));
  }

  protected delete(): void {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.expenseApi.remove(this.expense.id).subscribe({
      next: () => this.sheetRef.dismiss({ refresh: true }),
    }).add(() => this.deleting.set(false));
  }

  protected categoryLabel(cat: ExpenseCategory): string {
    const labels: Record<ExpenseCategory, string> = {
      [ExpenseCategory.RENT]:        'Alquiler',
      [ExpenseCategory.SERVICES]:    'Servicios',
      [ExpenseCategory.STAFF]:       'Personal',
      [ExpenseCategory.SUPPLIES]:    'Suministros',
      [ExpenseCategory.MARKETING]:   'Marketing',
      [ExpenseCategory.TRANSPORT]:   'Transporte',
      [ExpenseCategory.MAINTENANCE]: 'Mantenimiento',
      [ExpenseCategory.OTHER]:       'Otros',
    };
    return labels[cat];
  }

  protected categoryIcon(cat: ExpenseCategory): string {
    const icons: Record<ExpenseCategory, string> = {
      [ExpenseCategory.RENT]:        'house',
      [ExpenseCategory.SERVICES]:    'lightning',
      [ExpenseCategory.STAFF]:       'users',
      [ExpenseCategory.SUPPLIES]:    'package',
      [ExpenseCategory.MARKETING]:   'megaphone',
      [ExpenseCategory.TRANSPORT]:   'truck',
      [ExpenseCategory.MAINTENANCE]: 'wrench',
      [ExpenseCategory.OTHER]:       'dots-three',
    };
    return icons[cat];
  }
}
