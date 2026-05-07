import { AfterViewInit, Component, DestroyRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import {
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
  Inventory,
  InventoryProduct,
  FindAllLoteQuery,
  LoteStatus,
} from './products.data';
import { PaginatedResponse } from '../../core/models/pagination.model';
import { debounceTime, skip } from 'rxjs';

import { InventoryService } from '../../core/services/inventory.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { InventoryDrawerComponent } from '../../shared/components/inventory-drawer/inventory-drawer.component';
import { environment } from '../../../environments/environment';
import { CdkVirtualForOf, CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';


@Component({
  selector: 'stp-products',
  imports: [
    ButtonComponent,
    IconComponent,
    SearchComponent,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    ScrollingModule,
    SectionHeaderComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements AfterViewInit, OnDestroy {

  private readonly inventoryService = inject(InventoryService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  private readonly productHeader = viewChild<SectionHeaderComponent>('productHeader');
  protected readonly isStuck = signal(false);
  private stickyObserver?: IntersectionObserver;

  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;
  protected readonly assets = environment.assets;

  // ── Main list state ──────────────────────────────────────────────

  protected readonly resource = signal<PaginatedResponse<Inventory> | null>(null);
  protected readonly inventories = computed(() => this.resource()?.data ?? []);
  protected readonly searchQuery = signal('');
  protected readonly activeStatus = signal<LoteStatus | 'todos'>('todos');
  protected readonly selectedInventoryId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly isLoadingMore = signal(false);

  // ── Computed ─────────────────────────────────────────────────────
  protected readonly filteredInventories = computed(() => this.inventories());

  protected readonly selectedInventory = computed(() =>
    this.filteredInventories()?.find(inv => inv.id === this.selectedInventoryId()) ?? null,
  );

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 || this.activeStatus() !== 'todos',
  );

  protected readonly inventoryTotal = computed(() => this.resource()?.meta.total ?? 0);

  protected readonly statusFilterOptions: (LoteStatus | 'todos')[] = [
    'todos', LoteStatus.PENDING, LoteStatus.COMPLETED,
  ];

  protected readonly statusFilterLabels: Record<LoteStatus | 'todos', string> = {
    todos: 'Todos',
    [LoteStatus.PENDING]: 'Pendiente',
    [LoteStatus.COMPLETED]: 'Completado',
  };

  constructor() {
    this.loadInventories(this.buildQueryParams(1));

    toObservable(computed(() => ({ search: this.searchQuery().trim() }))).pipe(
      skip(1),
      debounceTime(600),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadInventories(this.buildQueryParams(1)));

    toObservable(computed(() => ({ status: this.activeStatus() }))).pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadInventories(this.buildQueryParams(1)));
  }

  // ── Data loading ─────────────────────────────────────────────────
  private buildQueryParams(page: number): FindAllLoteQuery {
    const status = this.activeStatus() === 'todos' ? undefined : this.activeStatus() as LoteStatus;
    const search = this.searchQuery().trim() || undefined;
    return { page, limit: 8, status, search };
  }

  private loadInventories(query: FindAllLoteQuery): void {
    if (query.page === 1) {
      this.loading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    this.inventoryService.getAll(query).subscribe({
      next: (resource) => {
        if (query.page === 1) {
          this.resource.set(resource);
          this.selectedInventoryId.set(null);
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

  // ── Main search ──────────────────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.activeStatus.set('todos');
  }

  protected setStatus(status: LoteStatus | 'todos'): void {
    this.activeStatus.set(status);
  }

  protected statusFilterLabel(s: LoteStatus | 'todos'): string {
    return this.statusFilterLabels[s];
  }

  protected selectInventory(inventoryId: string): void {
    this.selectedInventoryId.update(current =>
      current === inventoryId ? null : inventoryId,
    );
  }

  protected statusLabel(status: LoteStatus): string {
    if (status === LoteStatus.PENDING) return 'Pendiente';
    if (status === LoteStatus.COMPLETED) return 'Completado';
    return 'Cancelado';
  }

  protected statusClass(status: LoteStatus): string {
    if (status === LoteStatus.PENDING) return 'product-row__stock--low';
    if (status === LoteStatus.COMPLETED) return 'product-row__stock--ok';
    return 'product-row__stock--out';
  }

  protected statusBadgeVariant(status: Inventory['status']): 'success' | 'warning' | 'error' {
    if (status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    return 'error';
  }

  protected inventoryDateLabel(isoDate: string): string {
    return new Date(isoDate).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  protected onScroll(index: number): void {
    if (this.isLoadingMore() || this.loading()) return;

    const maxTotal = this.resource()?.meta.total ?? 0;
    const loadedItems = this.inventories().length;
    const threshold = 5;

    if (loadedItems >= maxTotal) return;

    if (index + threshold >= loadedItems) {
      const currentPage = this.resource()?.meta.page ?? 1;
      this.loadInventories(this.buildQueryParams(currentPage + 1));
    }
  }

  // ── Sticky header ────────────────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.productHeader()?.elementRef.nativeElement;
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

  // ── Helpers ──────────────────────────────────────────────────────
  protected productInitials(product: InventoryProduct): string {
    return product.name.split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
  }

  protected productTotal(price: number, weight: number): string {
    return (price * weight).toFixed(2);
  }

  protected openEditDrawer(inventory: Inventory): void {
    this.bottomSheet
      .open(InventoryDrawerComponent, {
        data: { inventory },
        panelClass: 'stp-inventory-drawer-panel',
      })
      .afterDismissed()
      .subscribe(() => this.loadInventories(this.buildQueryParams(1)));
  }

  protected createNewBatch(): void {
    this.bottomSheet
      .open(InventoryDrawerComponent, {
        data: { products: [] },
        panelClass: 'stp-inventory-drawer-panel',
      })
      .afterDismissed()
      .subscribe(() => this.loadInventories(this.buildQueryParams(1)));
  }
}
