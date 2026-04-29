import { Component, computed, inject, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AuthUserService } from '../../core/services/auth-user.service';
import { from, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export type ActivityFilter = 'todos' | 'ventas' | 'productos' | 'caja';

export interface ActivityItem {
  id: number;
  category: Exclude<ActivityFilter, 'todos'>;
  user: string;
  action: string;
  detail: string;
  amount?: string;
  time: Date;
}

const FILTER_LABELS: Record<ActivityFilter, string> = {
  todos: 'Todos',
  ventas: 'Ventas',
  productos: 'Productos',
  caja: 'Caja',
};

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    category: 'productos',
    user: 'Milagros',
    action: 'registró nuevo producto',
    detail: '"Leche Gloria"',
    time: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 2,
    category: 'productos',
    user: 'Milagros',
    action: 'actualizó la imagen de',
    detail: 'Cheetos',
    time: new Date(Date.now() - 22 * 60 * 1000),
  },
  {
    id: 3,
    category: 'ventas',
    user: 'Milagros',
    action: 'vendió',
    detail: 'Arroz 5kg',
    amount: 'S/ 20.00',
    time: new Date(Date.now() - 48 * 60 * 1000),
  },
  {
    id: 4,
    category: 'caja',
    user: 'Sistema',
    action: 'apertura de caja con fondo de',
    detail: 'apertura del día',
    amount: 'S/ 200.00',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 5,
    category: 'ventas',
    user: 'Joset',
    action: 'vendió',
    detail: 'Coca Cola 1.5L x2',
    amount: 'S/ 9.00',
    time: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 6,
    category: 'caja',
    user: 'Joset',
    action: 'registró egreso de caja',
    detail: 'Compra de útiles de limpieza',
    amount: '- S/ 35.00',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 7,
    category: 'productos',
    user: 'Milagros',
    action: 'actualizó el precio de',
    detail: 'Aceite Primor 1L',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 8,
    category: 'ventas',
    user: 'Milagros',
    action: 'vendió',
    detail: 'Fideos Don Vittorio 500g x3',
    amount: 'S/ 12.00',
    time: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
];

@Component({
  selector: 'stp-notices',
  imports: [LowerCasePipe, ButtonComponent, IconComponent],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss',
})
export class NoticesComponent {
  private readonly authUser = inject(AuthUserService);

  protected readonly user = toSignal(from(this.authUser.user()));
  protected readonly currentUserName = computed(() => this.user()?.name?.split(' ')[0] || '');
  protected readonly currentYear = new Date().getFullYear();


  protected readonly filters: ActivityFilter[] = ['todos', 'ventas', 'productos', 'caja'];
  protected readonly filterLabels = FILTER_LABELS;

  protected readonly activeFilter = signal<ActivityFilter>('todos');

  protected readonly filteredActivities = computed<ActivityItem[]>(() => {
    const f = this.activeFilter();
    return f === 'todos'
      ? MOCK_ACTIVITIES
      : MOCK_ACTIVITIES.filter(a => a.category === f);
  });

  protected setFilter(filter: ActivityFilter): void {
    this.activeFilter.set(filter);
  }

  protected userInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  protected relativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    return `hace ${diffD} día${diffD > 1 ? 's' : ''}`;
  }
}
