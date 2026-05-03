import { AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SwipeItemComponent, SwipeOption } from '../../shared/components/swipe-item/swipe-item.component';
import { PurchaseOrderDrawerComponent } from '../../shared/components/purchase-order-drawer/purchase-order-drawer.component';
import { HAIR_TYPE_LABELS, HAIR_COLOR_HEX, HAIR_COLOR_LABELS } from '../products/products.data';
import {
  PO_STATUS_LABELS,
  PurchaseOrderDrawerData,
  PurchaseOrderStatus,
} from './purchase-order.data';
import { toSignal } from '@angular/core/rxjs-interop';
import { PurchaseOrderService } from '../../core/services/purchase-order.service';
import { map } from 'rxjs';
import { PurchaseOrder } from '../../core/models/purchase-order.model';

@Component({
  selector: 'stp-purchase-order',
  imports: [ButtonComponent, IconComponent, SwipeItemComponent],
  templateUrl: './purchase-order.component.html',
  styleUrl: './purchase-order.component.scss',
})
export class PurchaseOrderComponent implements AfterViewInit, OnDestroy {
  private readonly pageHeader = viewChild<ElementRef>('pageHeader');
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly purchaseOrderService = inject(PurchaseOrderService);

  protected readonly hairColorHex = HAIR_COLOR_HEX;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairTypeLabels = HAIR_TYPE_LABELS;
  protected readonly statusLabels = PO_STATUS_LABELS;

  protected readonly isStuck = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly activeStatus = signal<PurchaseOrderStatus | 'todos'>('todos');
  protected readonly expandedId = signal<number | null>(null);
  protected readonly orders = toSignal(this.purchaseOrderService.getAll({ page: 1, limit: 100 }).pipe(map(res => res.data)), { initialValue: [] });

  private stickyObserver?: IntersectionObserver;

  // ── Computed ──────────────────────────────────────────────────
  protected readonly filteredOrders = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.activeStatus();
    return this.orders().filter(o => {
      const matchesStatus = status === 'todos' || o.status === status;
      const matchesQuery = !q ||
        o.oc.toLowerCase().includes(q)
        // o.supplierName.toLowerCase().includes(q) ||
        // o.registeredBy.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  });

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 || this.activeStatus() !== 'todos',
  );

  protected readonly statusFilterOptions: (PurchaseOrderStatus | 'todos')[] = [
    'todos', PurchaseOrderStatus.PENDING, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.CANCELED, PurchaseOrderStatus.COMPLETED,
  ];


  protected hairTypeLabel(type: string): string {
    return this.hairTypeLabels[type as keyof typeof this.hairTypeLabels] ?? type;
  }

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

  protected setStatus(status: PurchaseOrderStatus | 'todos'): void {
    this.activeStatus.set(status);
  }

  protected toggleExpand(id: number): void {
    this.expandedId.update(prev => prev === id ? null : id);
  }

  protected openNewDrawer(): void {
    this.openDrawer(null);
  }

  protected swipeOptionSelected(order: PurchaseOrder, option: SwipeOption): void {
    if (option.key === 'edit') this.openDrawer(order);
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
        // this.orders.update(prev => {
        //   const idx = prev.findIndex(o => o.id === result.id);
        //   return idx >= 0
        //     ? prev.map(o => o.id === result.id ? result : o)
        //     : [result, ...prev];
        // });
      });
  }

  // ── Helpers ───────────────────────────────────────────────────
  protected totalKilo(order: PurchaseOrder): number {
    return order.details.reduce((s, d) => s + d.weight, 0);
  }

  protected totalPrice(order: PurchaseOrder): number {
    return order.details.reduce((s, d) => s + d.price, 0);
  }

  protected statusFilterLabel(s: PurchaseOrderStatus | 'todos'): string {
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
