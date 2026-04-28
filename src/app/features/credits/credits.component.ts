import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { TabsComponent } from '../../shared/components/tabs/tabs.component';
import type { TabItem } from '../../shared/components/tabs/tabs.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  CreditDrawerComponent,
  CreditDrawerResult,
} from '../../shared/components/credit-drawer/credit-drawer.component';
import {
  CreditDetailDrawerComponent,
  CreditDetailData,
  CreditDetailResult,
} from '../../shared/components/credit-detail-drawer/credit-detail-drawer.component';
import {
  Credit,
  CreditStats,
  CreditStatus,
  FREQUENCY_LABELS,
  MOCK_CREDITS,
  computeCreditStats,
} from './credits.data';

type CreditFilter = 'todos' | CreditStatus;
type ViewMode = 'credits' | 'clients';

export interface CustomerGroup {
  customerName:      string;
  customerPhone:     string;
  customerDni?:      string;
  credits:           Credit[];
  alertCount:        number;
  activeCount:       number;
  overdueCount:      number;
  completedCount:    number;
  totalAmount:       number;
  totalPaid:         number;
  nextPaymentDate:   Date | null;
  nextPaymentAmount: number;
}


@Component({
  selector: 'stp-credits',
  imports: [DecimalPipe, LowerCasePipe, ButtonComponent, IconComponent, AlertComponent, BadgeComponent, TabsComponent, SearchComponent, EmptyStateComponent],
  templateUrl: './credits.component.html',
  styleUrl: './credits.component.scss',
})
export class CreditsComponent implements AfterViewInit, OnDestroy {
  private readonly creditsHeader = viewChild<ElementRef>('creditsHeader');
  private readonly bottomSheet   = inject(MatBottomSheet);
  protected readonly isStuck     = signal(false);
  private stickyObserver?: IntersectionObserver;

  protected readonly credits         = signal<Credit[]>([...MOCK_CREDITS]);
  protected readonly searchQuery     = signal('');
  protected readonly activeFilter    = signal<CreditFilter>('todos');
  protected readonly viewMode        = signal<ViewMode>('credits');
  protected readonly frequencyLabels = FREQUENCY_LABELS;

  protected readonly VIEW_MODES: TabItem[] = [
    { value: 'credits', label: 'Por crédito' },
    { value: 'clients', label: 'Por cliente' },
  ];

  protected readonly FILTERS: { value: CreditFilter; label: string }[] = [
    { value: 'todos',     label: 'Todos'       },
    { value: 'active',    label: 'Activos'     },
    { value: 'overdue',   label: 'Vencidos'    },
    { value: 'completed', label: 'Completados' },
  ];

  // ── Customer groups (Por cliente view) ───────────────────────────

  protected readonly customerGroups = computed((): CustomerGroup[] => {
    const map = new Map<string, Credit[]>();
    for (const c of this.credits()) {
      const key = c.customerPhone;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }

    const groups: CustomerGroup[] = [];
    for (const [, creds] of map) {
      const first = creds[0];
      let alertCount = 0, activeCount = 0, overdueCount = 0, completedCount = 0;
      let totalAmount = 0, totalPaid = 0;
      let nextPaymentDate: Date | null = null;
      let nextPaymentAmount = 0;

      for (const c of creds) {
        const s = computeCreditStats(c);
        if (s.hasAlert)                    alertCount++;
        if (c.status === 'active')         activeCount++;
        else if (c.status === 'overdue')   overdueCount++;
        else if (c.status === 'completed') completedCount++;
        totalAmount += c.total;
        totalPaid   += s.totalPaid;
        if (s.nextPaymentDate && (!nextPaymentDate || s.nextPaymentDate < nextPaymentDate)) {
          nextPaymentDate   = s.nextPaymentDate;
          nextPaymentAmount = s.installmentAmount;
        }
      }

      groups.push({
        customerName:      first.customerName,
        customerPhone:     first.customerPhone,
        customerDni:       first.customerDni,
        credits:           creds,
        alertCount,
        activeCount,
        overdueCount,
        completedCount,
        totalAmount,
        totalPaid,
        nextPaymentDate,
        nextPaymentAmount,
      });
    }
    return groups;
  });

  protected readonly clientAlertCount = computed(() =>
    this.customerGroups().filter(g => g.alertCount > 0).length,
  );

  protected readonly activeCustomerCount = computed(() =>
    this.customerGroups().filter(g => g.activeCount + g.overdueCount > 0).length,
  );

  protected readonly filteredCustomers = computed(() => {
    const query  = this.searchQuery().trim().toLowerCase();
    const filter = this.activeFilter();
    return this.customerGroups().filter(g => {
      const matchesQuery = !query ||
        g.customerName.toLowerCase().includes(query) ||
        g.customerPhone.includes(query) ||
        (g.customerDni ?? '').includes(query);

      let matchesFilter = true;
      if (filter === 'active')    matchesFilter = g.activeCount > 0;
      if (filter === 'overdue')   matchesFilter = g.overdueCount > 0;
      if (filter === 'completed') matchesFilter = g.completedCount > 0;

      return matchesQuery && matchesFilter;
    });
  });

  // ── Flat credits (Por crédito view) ──────────────────────────────

  protected readonly creditAlertCount = computed(() =>
    this.credits().filter(c => computeCreditStats(c).hasAlert).length,
  );

  protected readonly activeCreditsCount = computed(() =>
    this.credits().filter(c => c.status === 'active' || c.status === 'overdue').length,
  );

  protected readonly filteredCredits = computed(() => {
    const query  = this.searchQuery().trim().toLowerCase();
    const filter = this.activeFilter();
    return this.credits().filter(c => {
      const matchesQuery = !query ||
        c.customerName.toLowerCase().includes(query) ||
        c.customerPhone.includes(query) ||
        (c.customerDni ?? '').includes(query);
      const matchesFilter = filter === 'todos' || c.status === filter;
      return matchesQuery && matchesFilter;
    });
  });

  // ── Derived (view-agnostic) ───────────────────────────────────────

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 || this.activeFilter() !== 'todos',
  );

  protected readonly displayAlertCount = computed(() =>
    this.viewMode() === 'credits' ? this.creditAlertCount() : this.clientAlertCount(),
  );

  protected readonly alertBannerTitle = computed(() => {
    const count  = this.displayAlertCount();
    const entity = this.viewMode() === 'credits' ? 'crédito' : 'cliente';
    const suffix = count !== 1 ? `s requieren` : ` requiere`;
    return `${count} ${entity}${suffix} atención`;
  });

  // ── Helpers ──────────────────────────────────────────────────────

  protected paidPercentage(g: CustomerGroup): number {
    return g.totalAmount > 0 ? g.totalPaid / g.totalAmount : 0;
  }

  protected creditStats(c: Credit): CreditStats {
    return computeCreditStats(c);
  }

  protected customerInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(date);
  }

  protected dominantStatus(g: CustomerGroup): CreditStatus {
    if (g.overdueCount > 0) return 'overdue';
    if (g.activeCount > 0)  return 'active';
    return 'completed';
  }

  protected creditId(credit: Credit): string {
    return credit.id.toString().padStart(4, '0');
  }

  protected statusLabel(status: CreditStatus): string {
    return status === 'active' ? 'Activo' : status === 'overdue' ? 'Vencido' : 'Completado';
  }

  // ── Actions ──────────────────────────────────────────────────────

  protected setViewMode(mode: string): void {
    this.viewMode.set(mode as ViewMode);
    this.activeFilter.set('todos');
    this.searchQuery.set('');
  }

  protected openDetailDrawer(group: CustomerGroup): void {
    this.openCreditsDrawer(group.customerName, group.customerPhone, group.customerDni, group.credits);
  }

  protected openSingleCreditDrawer(credit: Credit): void {
    this.openCreditsDrawer(credit.customerName, credit.customerPhone, credit.customerDni, [credit]);
  }

  private openCreditsDrawer(
    customerName: string,
    customerPhone: string,
    customerDni: string | undefined,
    credits: Credit[],
  ): void {
    const data: CreditDetailData = { customerName, customerPhone, customerDni, credits };
    this.bottomSheet
      .open<CreditDetailDrawerComponent, CreditDetailData, CreditDetailResult | null>(
        CreditDetailDrawerComponent,
        { data, panelClass: 'stp-credit-panel' },
      )
      .afterDismissed()
      .subscribe(result => {
        if (!result) return;
        this.credits.update(prev =>
          prev.map(c => result.updatedCredits.find((u: Credit) => u.id === c.id) ?? c),
        );
      });
  }

  protected openNewDrawer(): void {
    this.bottomSheet
      .open<CreditDrawerComponent, void, CreditDrawerResult | null>(
        CreditDrawerComponent,
        { panelClass: 'stp-credit-panel' },
      )
      .afterDismissed()
      .subscribe(result => {
        if (!result) return;
        this.credits.update(prev => [
          {
            id: Math.max(...prev.map(c => c.id)) + 1,
            paidInstallments: 0,
            createdAt: new Date().toISOString().slice(0, 10),
            status: 'active' as CreditStatus,
            items: [],
            ...result,
          },
          ...prev,
        ]);
      });
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.activeFilter.set('todos');
  }

  protected setFilter(filter: CreditFilter): void {
    this.activeFilter.set(filter);
  }

  ngAfterViewInit(): void {
    const el = this.creditsHeader()?.nativeElement;
    if (!el) return;
    this.stickyObserver = new IntersectionObserver(
      ([entry]) => this.isStuck.set(!entry.isIntersecting),
      { threshold: 0 },
    );
    this.stickyObserver.observe(el);
  }

  ngOnDestroy(): void {
    this.stickyObserver?.disconnect();
  }
}
