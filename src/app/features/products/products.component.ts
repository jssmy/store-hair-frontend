import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import {
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
  Inventory,
  InventoryProduct,
} from './products.data';
import { PaginatedResponse } from '../../core/models/pagination.model';

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
  protected readonly selectedInventoryId = signal<string | null>(null);
  protected readonly isLoadingMore = signal(false);

  // ── Computed ─────────────────────────────────────────────────────
  protected readonly filteredInventories = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return this.inventories()?.filter(inv => {
      const matchesId = inv.id.toLowerCase().includes(query);
      const matchesProduct = inv.products.some(product =>
        product.name.toLowerCase().includes(query),
      );
      return !query || matchesId || matchesProduct;
    });
  });

  protected readonly selectedInventory = computed(() =>
    this.filteredInventories()?.find(inv => inv.id === this.selectedInventoryId()) ?? null,
  );

  constructor() {
    this.loadAll();
  }

  // ── Data loading ─────────────────────────────────────────────────
  private loadAll(): void {
    this.inventoryService.getAll({ page: 1, limit: 8 }).subscribe(
      (resource) => this.resource.set(resource),
    );
  }

  // ── Main search ──────────────────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected selectInventory(inventoryId: string): void {
    this.selectedInventoryId.update(current =>
      current === inventoryId ? null : inventoryId,
    );
  }

  protected statusLabel(status: Inventory['status']): string {
    if (status === 'pending') return 'Pendiente';
    if (status === 'completed') return 'Completado';
    return 'Cancelado';
  }

  protected statusClass(status: Inventory['status']): string {
    if (status === 'pending') return 'product-row__stock--low';
    if (status === 'completed') return 'product-row__stock--ok';
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

    if (this.isLoadingMore()) return;

    const maxTotal = this.resource()?.meta.total ?? 0;
    const totalItems = this.filteredInventories()?.length ?? 0;
    const threshold = 7;

    if (totalItems >= maxTotal) return;

    if (index + threshold >= totalItems) {
      const currentPage = this.resource()?.meta.page ?? 1;
      const nextPage = currentPage + 1;
      this.isLoadingMore.set(true);
      this.inventoryService.getAll({ page: nextPage, limit: 8 }).subscribe(
        (resource) => this.resource.update((prev) => {
          if (!prev) return resource;
          return {
            data: [...prev.data, ...resource.data],
            meta: resource.meta,
          };
        }),
      ).add(() => this.isLoadingMore.set(false));
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

  protected openEditDrawer(inventory: Inventory): void {
    this.bottomSheet
      .open(InventoryDrawerComponent, {
        data: { inventory },
        panelClass: 'stp-inventory-drawer-panel',
      })
      .afterDismissed()
      .subscribe(() => this.loadAll());
  }

  protected createNewBatch(): void {
    this.bottomSheet
      .open(InventoryDrawerComponent, {
        data: { products: [] },
        panelClass: 'stp-inventory-drawer-panel',
      })
      .afterDismissed()
      .subscribe(() => this.loadAll());
  }
}
