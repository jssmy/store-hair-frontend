import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SwipeItemComponent, SwipeOption } from '../../shared/components/swipe-item/swipe-item.component';
import { PurchaseOrderDrawerComponent } from '../../shared/components/purchase-order-drawer/purchase-order-drawer.component';
import { CATEGORY_LABELS, HAIR_COLOR_HEX, HAIR_COLOR_LABELS } from '../products/products.data';
import {
  MOCK_PURCHASE_ORDERS_FULL,
  PO_STATUS_LABELS,
  POStatus,
  PurchaseOrderDrawerData,
  PurchaseOrderFull,
} from './purchase-order.data';

@Component({
  selector: 'stp-purchase-order',
  imports: [ButtonComponent, IconComponent, SwipeItemComponent],
  templateUrl: './purchase-order.component.html',
  styleUrl: './purchase-order.component.scss',
})
export class PurchaseOrderComponent implements AfterViewInit, OnDestroy {
  private readonly pageHeader = viewChild<ElementRef>('pageHeader');
  private readonly bottomSheet = inject(MatBottomSheet);

  protected readonly hairColorHex = HAIR_COLOR_HEX;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly statusLabels = PO_STATUS_LABELS;

  protected readonly isStuck = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly activeStatus = signal<POStatus | 'todos'>('todos');
  protected readonly expandedId = signal<string | null>(null);
  protected readonly orders = signal<PurchaseOrderFull[]>([...MOCK_PURCHASE_ORDERS_FULL]);

  private stickyObserver?: IntersectionObserver;

  // ── Computed ──────────────────────────────────────────────────
  protected readonly filteredOrders = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.activeStatus();
    return this.orders().filter(o => {
      const matchesStatus = status === 'todos' || o.status === status;
      const matchesQuery = !q ||
        o.number.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.registeredBy.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  });

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 || this.activeStatus() !== 'todos',
  );

  protected readonly statusFilterOptions: (POStatus | 'todos')[] = [
    'todos', 'pendiente', 'recibida', 'cancelada',
  ];

  protected readonly swipeOptions: SwipeOption[] = [
    { label: 'Editar', icon: 'pencil', key: 'edit', stpClass: 'bg-primary-light' },
  ];

  // ── Actions ───────────────────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.activeStatus.set('todos');
  }

  protected setStatus(status: POStatus | 'todos'): void {
    this.activeStatus.set(status);
  }

  protected toggleExpand(id: string): void {
    this.expandedId.update(prev => prev === id ? null : id);
  }

  protected openNewDrawer(): void {
    this.openDrawer(null);
  }

  protected swipeOptionSelected(order: PurchaseOrderFull, option: SwipeOption): void {
    if (option.key === 'edit') this.openDrawer(order);
  }

  private openDrawer(order: PurchaseOrderFull | null): void {
    const data: PurchaseOrderDrawerData = { purchaseOrder: order ?? undefined };
    this.bottomSheet
      .open<PurchaseOrderDrawerComponent, PurchaseOrderDrawerData, PurchaseOrderFull | null>(
        PurchaseOrderDrawerComponent,
        { data, panelClass: 'stp-po-panel' },
      )
      .afterDismissed()
      .subscribe(result => {
        if (!result) return;
        this.orders.update(prev => {
          const idx = prev.findIndex(o => o.id === result.id);
          return idx >= 0
            ? prev.map(o => o.id === result.id ? result : o)
            : [result, ...prev];
        });
      });
  }

  // ── Helpers ───────────────────────────────────────────────────
  protected totalKilo(order: PurchaseOrderFull): number {
    return order.details.reduce((s, d) => s + d.kilo, 0);
  }

  protected totalPrice(order: PurchaseOrderFull): number {
    return order.details.reduce((s, d) => s + d.totalPrice, 0);
  }

  protected statusFilterLabel(s: POStatus | 'todos'): string {
    return s === 'todos' ? 'Todas' : this.statusLabels[s];
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  // ── Sticky header ─────────────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.pageHeader()?.nativeElement;
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
