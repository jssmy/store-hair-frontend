import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DecimalPipe, DatePipe, SlicePipe } from '@angular/common';
import { debounceTime, skip } from 'rxjs';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ShimmerComponent } from '../../shared/components/shimmer/shimmer.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { ExpenseService, ExpenseQueryParams } from '../../core/services/expense.service';
import { Expense, ExpenseCategory, ExpenseStatus } from './expenses.data';
import { PaginatedResponse } from '../../core/models/pagination.model';
import { ExpenseDetailSheetComponent } from './expense-detail-sheet/expense-detail-sheet.component';
import { ExpenseFormSheetComponent } from './expense-form-sheet/expense-form-sheet.component';

@Component({
  selector: 'stp-expenses',
  imports: [
    SectionHeaderComponent,
    IconComponent,
    ShimmerComponent,
    EmptyStateComponent,
    SearchComponent,
    DecimalPipe,
    DatePipe,
    SlicePipe,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent implements AfterViewInit, OnDestroy {
  private readonly expensesHeader = viewChild<SectionHeaderComponent>('expensesHeader');
  private readonly expenseApi     = inject(ExpenseService);
  private readonly destroyRef     = inject(DestroyRef);
  private readonly bottomSheet    = inject(MatBottomSheet);

  protected readonly isStuck        = signal(false);
  protected readonly loading        = signal(false);
  protected readonly isLoadingMore  = signal(false);

  protected readonly categoryFilter = signal<'all' | ExpenseCategory>('all');
  protected readonly statusFilter   = signal<'all' | ExpenseStatus>('all');
  protected readonly searchQuery    = signal('');
  protected readonly categories     = Object.values(ExpenseCategory);

  private stickyObserver?: IntersectionObserver;

  protected readonly resource   = signal<PaginatedResponse<Expense> | null>(null);
  protected readonly expenses   = computed(() => this.resource()?.data ?? []);
  protected readonly allLoaded  = computed(() => {
    const meta = this.resource()?.meta;
    return meta ? this.expenses().length >= meta.total : false;
  });
  protected readonly isFiltered = computed(() =>
    this.categoryFilter() !== 'all' || this.statusFilter() !== 'all' || this.searchQuery().trim().length > 0,
  );
  protected readonly totalAmount = computed(() =>
    this.expenses().reduce((s, e) => s + Number(e.amount ?? 0), 0),
  );

  constructor() {
    this.loadExpenses(this.buildQueryParams(1));

    toObservable(this.categoryFilter).pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadExpenses(this.buildQueryParams(1)));

    toObservable(this.statusFilter).pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadExpenses(this.buildQueryParams(1)));

    toObservable(this.searchQuery).pipe(skip(1), debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadExpenses(this.buildQueryParams(1)));
  }

  private buildQueryParams(page: number): ExpenseQueryParams {
    const cat    = this.categoryFilter();
    const status = this.statusFilter();
    const search = this.searchQuery().trim() || undefined;
    return {
      page,
      limit: 15,
      category: cat    === 'all' ? undefined : cat,
      status:   status === 'all' ? undefined : status,
      search,
    };
  }

  private loadExpenses(query: ExpenseQueryParams): void {
    if (query.page > 1) {
      this.isLoadingMore.set(true);
    } else {
      this.loading.set(true);
    }

    this.expenseApi.getAll(query).subscribe({
      next: (response: PaginatedResponse<Expense>) => {
        if (query.page > 1) {
          this.resource.update(prev => {
            if (!prev) return response;
            return { data: [...prev.data, ...response.data], meta: response.meta };
          });
        } else {
          this.resource.set(response);
        }
      },
    }).add(() => {
      this.loading.set(false);
      this.isLoadingMore.set(false);
    });
  }

  protected onContainerScroll(event: Event): void {
    if (this.isLoadingMore() || this.loading() || this.allLoaded()) return;
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      const nextPage = (this.resource()?.meta.page ?? 1) + 1;
      this.loadExpenses(this.buildQueryParams(nextPage));
    }
  }

  protected openDetail(expense: Expense): void {
    this.bottomSheet.open(ExpenseDetailSheetComponent, {
      data: { expense },
      panelClass: 'stp-expense-detail-panel',
    }).afterDismissed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result?.refresh) this.loadExpenses(this.buildQueryParams(1));
    });
  }

  protected openCreateForm(): void {
    this.bottomSheet.open(ExpenseFormSheetComponent, {
      panelClass: 'stp-expense-form-panel',
    }).afterDismissed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result?.created) this.loadExpenses(this.buildQueryParams(1));
    });
  }

  protected onSearchInput(value: string): void { this.searchQuery.set(value); }
  protected clearSearch(): void               { this.searchQuery.set(''); }
  protected setCategoryFilter(v: 'all' | ExpenseCategory): void { this.categoryFilter.set(v); }
  protected setStatusFilter(v: 'all' | ExpenseStatus): void     { this.statusFilter.set(v); }

  ngAfterViewInit(): void {
    const el = this.expensesHeader()?.elementRef.nativeElement;
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

  protected statusLabel(status: ExpenseStatus): string {
    return status === ExpenseStatus.PAID ? 'Pagado' : 'Pendiente';
  }

  protected isPaid(expense: Expense): boolean {
    return expense.status === ExpenseStatus.PAID;
  }

  protected trackByExpenseId(_: number, expense: Expense): number { return expense.id; }

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly ExpenseStatus   = ExpenseStatus;
}
