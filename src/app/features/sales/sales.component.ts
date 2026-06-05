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
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ShimmerComponent } from '../../shared/components/shimmer/shimmer.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SaleService, SaleQueryParams } from '../../core/services/sale.service';
import { Sale, SalePaymentMethod } from './sales.data';
import { PaginatedResponse } from '../../core/models/pagination.model';

@Component({
  selector: 'stp-sales',
  imports: [
    SectionHeaderComponent,
    IconComponent,
    ShimmerComponent,
    EmptyStateComponent,
    SearchComponent,
    ButtonComponent,
    DecimalPipe,
    DatePipe,
    SlicePipe,
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements AfterViewInit, OnDestroy {
  private readonly salesHeader = viewChild<SectionHeaderComponent>('salesHeader');
  private readonly saleApi     = inject(SaleService);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly isStuck       = signal(false);
  protected readonly loading       = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly downloadingId = signal<number | null>(null);
  protected readonly expandedSaleId = signal<number | null>(null);

  protected readonly paymentFilter  = signal<'all' | SalePaymentMethod>('all');
  protected readonly searchQuery    = signal('');
  protected readonly paymentMethods = Object.values(SalePaymentMethod);

  private stickyObserver?: IntersectionObserver;

  // ── State ────────────────────────────────────────────────────
  protected readonly resource = signal<PaginatedResponse<Sale> | null>(null);
  protected readonly sales    = computed(() => this.resource()?.data ?? []);

  // ── Summary computed ─────────────────────────────────────────
  protected readonly totalCash     = computed(() =>
    this.sales().reduce((s, sale) => s + Number(sale.cashAmount ?? 0), 0),
  );
  protected readonly totalTransfer = computed(() =>
    this.sales().reduce((s, sale) => s + Number(sale.transferAmount ?? 0), 0),
  );
  protected readonly totalAmount   = computed(() => this.totalCash() + this.totalTransfer());
  protected readonly allLoaded     = computed(() => {
    const meta = this.resource()?.meta;
    return meta ? this.sales().length >= meta.total : false;
  });
  protected readonly isFiltered    = computed(() =>
    this.paymentFilter() !== 'all' || this.searchQuery().trim().length > 0,
  );

  constructor() {
    this.loadSales(this.buildQueryParams(1));

    toObservable(this.paymentFilter).pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.expandedSaleId.set(null);
      this.loadSales(this.buildQueryParams(1));
    });

    toObservable(this.searchQuery).pipe(
      skip(1),
      debounceTime(400),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.expandedSaleId.set(null);
      this.loadSales(this.buildQueryParams(1));
    });
  }

  private buildQueryParams(page: number): SaleQueryParams {
    const pm     = this.paymentFilter();
    const search = this.searchQuery().trim() || undefined;
    return {
      page,
      limit: 15,
      paymentMethod: pm === 'all' ? undefined : pm,
      search,
    };
  }

  private loadSales(query: SaleQueryParams): void {
    if (query.page > 1) {
      this.isLoadingMore.set(true);
    } else {
      this.loading.set(true);
    }

    this.saleApi.getAll(query).subscribe({
      next: (response: PaginatedResponse<Sale>) => {
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

  // ── Container scroll → load more ─────────────────────────────
  protected onContainerScroll(event: Event): void {
    if (this.isLoadingMore() || this.loading() || this.allLoaded()) return;

    const el = event.target as HTMLElement;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceFromBottom < 200) {
      const nextPage = (this.resource()?.meta.page ?? 1) + 1;
      this.loadSales(this.buildQueryParams(nextPage));
    }
  }

  // ── Expand / collapse ─────────────────────────────────────────
  protected toggleSale(id: number): void {
    this.expandedSaleId.update(current => current === id ? null : id);
  }

  protected isExpanded(id: number): boolean {
    return this.expandedSaleId() === id;
  }

  // ── Search ────────────────────────────────────────────────────
  protected onSearchInput(value: string): void { this.searchQuery.set(value); }
  protected clearSearch(): void               { this.searchQuery.set(''); }

  // ── Filter ────────────────────────────────────────────────────
  protected setPaymentFilter(value: 'all' | SalePaymentMethod): void {
    this.paymentFilter.set(value);
  }

  // ── Sticky header ─────────────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.salesHeader()?.elementRef.nativeElement;
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

  // ── Helpers ───────────────────────────────────────────────────
  protected saleTotal(sale: Sale): number {
    return Number(sale.cashAmount ?? 0) + Number(sale.transferAmount ?? 0);
  }

  protected paymentPercent(sale: Sale): number {
    const total = Number(sale.totalAmount ?? 0);
    if (total <= 0) return 100;
    return Math.min(100, (this.saleTotal(sale) / total) * 100);
  }

  protected isPaidFull(sale: Sale): boolean {
    return this.paymentPercent(sale) >= 99.9;
  }

  protected customerName(sale: Sale): string {
    if (sale.customer?.fullName)     return sale.customer.fullName;
    if (sale.customer?.businessName) return sale.customer.businessName;
    return 'Cliente general';
  }

  protected paymentLabel(method: SalePaymentMethod): string {
    const labels: Record<SalePaymentMethod, string> = {
      [SalePaymentMethod.CASH]:   'Al contado',
      [SalePaymentMethod.CREDIT]: 'A crédito',
    };
    return labels[method];
  }

  protected paymentIcon(method: SalePaymentMethod): string {
    return method === SalePaymentMethod.CASH ? 'money' : 'arrows-left-right';
  }

  protected firstProductName(sale: Sale): string {
    const first = sale.details[0];
    return first ? first.product.name : '';
  }

  protected trackBySaleId(_: number, sale: Sale): number { return sale.id; }

  protected downloadReceipt(sale: Sale, event: Event): void {
    event.stopPropagation();
    if (this.downloadingId() === sale.id) return;

    this.downloadingId.set(sale.id);
    this.saleApi.downloadPdf(sale.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `boleta-${sale.vt}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }).add(() => this.downloadingId.set(null));
  }

  protected readonly SalePaymentMethod = SalePaymentMethod;
}
