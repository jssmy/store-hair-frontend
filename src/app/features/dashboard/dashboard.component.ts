import { Component } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface Transaction {
  name: string;
  date: string;
  status: 'Completed' | 'Pending';
  id: string;
  emoji: string;
}

interface RevenueBar {
  incomeX: number;
  expensesX: number;
  incomeY: number;
  expensesY: number;
  incomeH: number;
  expensesH: number;
  month: string;
}

interface SalesItem {
  label: string;
  count: number;
  pct: number;
}

@Component({
  selector: 'stp-dashboard',
  imports: [IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected readonly transactions: Transaction[] = [
    { name: 'Premium T-Shirt',      date: 'Jul 12th 2024', status: 'Completed', id: '0JWEJS7ISNC', emoji: '👕' },
    { name: 'Playstation 5',         date: 'Jul 12th 2024', status: 'Pending',   id: '0JWEJS7ISNC', emoji: '🎮' },
    { name: 'Hoodie Gombrong',       date: 'Jul 12th 2024', status: 'Pending',   id: '0JWEJS7ISNC', emoji: '🧥' },
    { name: 'iPhone 15 Pro Max',     date: 'Jul 12th 2024', status: 'Completed', id: '0JWEJS7ISNC', emoji: '📱' },
    { name: 'Lotse',                 date: 'Jul 12th 2024', status: 'Completed', id: '0JWEJS7ISNC', emoji: '🫖' },
    { name: 'Starbucks',             date: 'Jul 12th 2024', status: 'Completed', id: '0JWEJS7ISNC', emoji: '☕' },
    { name: 'Tinek Detstar T-Shirt', date: 'Jul 12th 2024', status: 'Completed', id: '0JWEJS7ISNC', emoji: '👕' },
  ];

  protected readonly salesItems: SalesItem[] = [
    { label: 'Product Launched', count: 233, pct: 58 },
    { label: 'Ongoing Product',  count: 130, pct: 32 },
    { label: 'Product Sold',     count: 482, pct: 96 },
  ];

  private readonly revenueRaw = [
    { month: 'Jan', income: 62, expenses: 42 },
    { month: 'Feb', income: 48, expenses: 68 },
    { month: 'Mar', income: 80, expenses: 52 },
    { month: 'Apr', income: 55, expenses: 38 },
    { month: 'May', income: 90, expenses: 62 },
    { month: 'Jun', income: 72, expenses: 48 },
    { month: 'Jul', income: 100, expenses: 56 },
    { month: 'Aug', income: 85, expenses: 60 },
  ];

  protected readonly revenueBarData: RevenueBar[] = this.revenueRaw.map((item, i) => {
    const maxH = 80;
    const incomeH = (item.income / 100) * maxH;
    const expensesH = (item.expenses / 100) * maxH;
    return {
      incomeX: i * 37 + 3,
      expensesX: i * 37 + 17,
      incomeY: maxH - incomeH,
      expensesY: maxH - expensesH,
      incomeH,
      expensesH,
      month: item.month,
    };
  });
}
