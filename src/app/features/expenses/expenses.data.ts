export enum ExpenseCategory {
  RENT        = 'rent',
  SERVICES    = 'services',
  STAFF       = 'staff',
  SUPPLIES    = 'supplies',
  MARKETING   = 'marketing',
  TRANSPORT   = 'transport',
  MAINTENANCE = 'maintenance',
  OTHER       = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  PAID    = 'paid',
}

export interface Expense {
  id: number;
  description: string;
  amount: string | number;
  category: ExpenseCategory;
  status: ExpenseStatus;
  notes?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
