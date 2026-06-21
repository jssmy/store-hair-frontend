import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SwipeItemComponent, SwipeOption } from '../../shared/components/swipe-item/swipe-item.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { PurchaseOrderDrawerComponent } from '../../shared/components/purchase-order-drawer/purchase-order-drawer.component';
import { HAIR_TYPE_LABELS, HAIR_COLOR_HEX, HAIR_COLOR_LABELS } from '../products/products.data';
import {
  PO_STATUS_LABELS,
  PurchaseOrderDrawerData,
  PurchaseOrderStatus,
} from './purchase-order.data';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { PurchaseOrderService } from '../../core/services/purchase-order.service';
import { debounceTime, skip } from 'rxjs';
import { PurchaseOrder, PurchaseOrderQueryParams } from '../../core/models/purchase-order.model';
import { CdkVirtualForOf, CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { PaginatedResponse } from '../../core/models/pagination.model';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  selector: 'stp-purchase-order',
  imports: [ButtonComponent, IconComponent, SwipeItemComponent, CdkVirtualScrollViewport, CdkVirtualForOf, ScrollingModule, SearchComponent, SectionHeaderComponent],
  templateUrl: './purchase-order.component.html',
  styleUrl: './purchase-order.component.scss',
})
export class PurchaseOrderComponent implements AfterViewInit, OnDestroy {
  private readonly pageHeader = viewChild<SectionHeaderComponent>('pageHeader');
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  private readonly purchaseOrderService = inject(PurchaseOrderService);
  protected readonly hairColorHex = HAIR_COLOR_HEX;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairTypeLabels = HAIR_TYPE_LABELS;
  protected readonly statusLabels = PO_STATUS_LABELS;

  protected readonly isStuck = signal(false);
  protected readonly loading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly downloadingId = signal<number | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly activeStatus = signal<PurchaseOrderStatus | 'todos'>('todos');
  protected readonly expandedId = signal<number | null>(null);

  // ── Main list state ──────────────────────────────────────────
  protected readonly resource = signal<PaginatedResponse<PurchaseOrder> | null>(null);
  protected readonly orders = computed(() => this.resource()?.data ?? []);

  private stickyObserver?: IntersectionObserver;

  // ── Computed ──────────────────────────────────────────────────
  protected readonly filteredOrders = computed(() => this.orders());

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 || this.activeStatus() !== 'todos',
  );

  protected readonly orderTotal = computed(() => this.resource()?.meta.total ?? 0);

  constructor() {
    this.loadOrders(this. buildQueryParams(1));

    toObservable(computed(() => ({
      search: this.searchQuery().trim(),
    }))).pipe(
      skip(1),
      debounceTime(2000),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadOrders(this.buildQueryParams(1)));

    toObservable(computed(() => ({
      status: this.activeStatus(),
    }))).pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadOrders(this.buildQueryParams(1)));
    


  }

  protected readonly statusFilterOptions: (PurchaseOrderStatus | 'todos')[] = [
    'todos', PurchaseOrderStatus.PENDING, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.CANCELED, PurchaseOrderStatus.COMPLETED,
  ];

  private buildQueryParams(page: number): PurchaseOrderQueryParams {
    const status = (this.activeStatus() === 'todos' ? undefined : this.activeStatus()) as PurchaseOrderStatus | undefined;
    const search = this.searchQuery().trim() || undefined;
    return {
      page,
      limit:10,
      status,
      search
    };
  }

  private loadOrders(query: PurchaseOrderQueryParams): void {

    if (query.page === 1) {
      this.loading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    this.purchaseOrderService.getAll(query).subscribe({
      next: (resource) => {
        if (query.page === 1) {
          this.resource.set(resource);
        } else {
          this.resource.update(prev => {
            if (!prev) return resource;
            return { data: [...prev.data, ...resource.data], meta: resource.meta };
          });
        }
      },
    }).add(() => {
      this.loading.set(false);
      this.isLoadingMore.set(false);
    });
        
  }


  protected onScroll(index: number): void {
    if (this.isLoadingMore() || this.loading()) return;

    const maxTotal = this.resource()?.meta.total ?? 0;
    const loadedItems = this.orders().length;
    const visibleItems = this.filteredOrders().length;
    const threshold = 5;

    if (loadedItems >= maxTotal) return;

    if (index + threshold >= visibleItems) {
      const currentPage = this.resource()?.meta.page ?? 1;
      this.loadOrders(this.buildQueryParams(currentPage + 1));
    }
  }

  protected hairTypeLabel(type: string): string {
    return this.hairTypeLabels[type as keyof typeof this.hairTypeLabels] ?? type;
  }

  protected swipeOptionsFor(order: PurchaseOrder): SwipeOption[] {
    if (order.status === PurchaseOrderStatus.PENDING) {
      return [
        { label: 'Editar', icon: 'pencil', key: 'edit', stpClass: 'bg-primary-light' },
        { label: 'Aprobar', icon: 'check', key: 'approve', stpClass: 'bg-success-light' },
        { label: 'Cancelar', icon: 'x-circle', key: 'cancel', stpClass: 'bg-error-light' },
      ];
    }

    if (order.status === PurchaseOrderStatus.APPROVED) {
      return [
        { label: 'Descargar PDF', icon: 'download-simple', key: 'download', stpClass: 'bg-info-light' },
      ];
    }

    return [];
  }

  // ── Actions ───────────────────────────────────────────────────
  protected clearSearch(): void {
    this.searchQuery.set('');
    this.activeStatus.set('todos');
  }

  protected setStatus(status: PurchaseOrderStatus | 'todos'): void {
    this.activeStatus.set(status);
  }

  protected toggleExpand(id: number): void {
    this.expandedId.update(prev => prev === id ? null : id);
  }

  protected openNewDrawer(): void {
    this.openDrawer(null);
  }

  protected openDrawerForOrder(order: PurchaseOrder): void {
    this.openDrawer(order);
  }

  protected downloadPdf(order: PurchaseOrder): void {
    this.downloadOrderPdf(order);
  }

  protected swipeOptionSelected(order: PurchaseOrder, option: SwipeOption): void {
    if (option.key === 'edit') this.openDrawer(order);
    if (option.key === 'approve') this.updateOrderStatus(order, PurchaseOrderStatus.APPROVED);
    if (option.key === 'cancel') this.updateOrderStatus(order, PurchaseOrderStatus.CANCELED);
    if (option.key === 'download') this.downloadOrderPdf(order);
  }

  private downloadOrderPdf(order: PurchaseOrder): void {
    if (this.downloadingId() !== null) return;
    this.downloadingId.set(order.id);
    this.purchaseOrderService.downloadPdf(order.id).subscribe({
      next: blob => {
        const fileName = `${order.oc}.pdf`;
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
    }).add(() => this.downloadingId.set(null));
  }

  private updateOrderStatus(order: PurchaseOrder, status: PurchaseOrderStatus): void {
    this.purchaseOrderService.updateStatus(order.id, status)
      .subscribe({ next: () => this.loadOrders(this.buildQueryParams(1)) });
  }

  private openDrawer(order: PurchaseOrder | null): void {
    const data: PurchaseOrderDrawerData = { purchaseOrder: order ?? undefined };
    this.bottomSheet
      .open<PurchaseOrderDrawerComponent, PurchaseOrderDrawerData, PurchaseOrder | null>(
        PurchaseOrderDrawerComponent,
        { data, panelClass: 'stp-po-panel' },
      )
      .afterDismissed()
      .subscribe(result => {
        if (!result) return;
        this.loadOrders(this.buildQueryParams(1));
      });
  }

  // ── Helpers ───────────────────────────────────────────────────
  protected totalWeight(order: PurchaseOrder): number {
    return order.details.reduce((s, d) => s + Number(d.weight), 0);
  }

  protected totalPrice(order: PurchaseOrder): number {
    return order.details.reduce((s, d) => s + (Number(d.price) * Number(d.weight)), 0);
  }

  protected totalPriceUSD(order: PurchaseOrder): number | null {
    const rate = order.tc_usd ?? order.exchangeRate;
    if (!rate) return null;
    return this.totalPrice(order) / rate;
  }

  protected statusFilterLabel(s: PurchaseOrderStatus | 'todos'): string {
    return s === 'todos' ? 'Todas' : this.statusLabels[s];
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  protected trackByOrderId(_index: number, order: PurchaseOrder): number {
    return order.id;
  }

  // ── Sticky header ─────────────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.pageHeader()?.elementRef.nativeElement;
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
