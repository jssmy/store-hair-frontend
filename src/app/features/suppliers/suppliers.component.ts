import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import {
  SupplierDrawerComponent,
  SupplierDrawerData,
} from '../../shared/components/supplier-drawer/supplier-drawer.component';
import {
  Supplier,
} from './suppliers.data';
import { SwipeItemComponent, SwipeOption } from '../../shared/components/swipe-item/swipe-item.component';
import { SupplierApiService } from './supplier-api.service';
import { CdkVirtualForOf, CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { PaginatedMeta, PaginatedResponse } from '../../core/models/pagination.model';

@Component({
  selector: 'stp-suppliers',
  imports: [
    ButtonComponent,
    IconComponent,
    SearchComponent,
    SwipeItemComponent,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    ScrollingModule,
  ],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
})
export class SuppliersComponent implements AfterViewInit, OnDestroy {
  private readonly suppliersHeader = viewChild<ElementRef>('suppliersHeader');
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly supplierApi = inject(SupplierApiService);

  protected readonly isStuck = signal(false);
  protected readonly loading = signal(false);
  protected readonly isLoadingMore = signal(false);

  private stickyObserver?: IntersectionObserver;


  protected readonly swipeOptions = (state: boolean): SwipeOption[] => {
    if (state) {
      return [
        { label: 'Desactivar', icon: 'x', key: 'toggle', stpClass: 'bg-warning-light' },
        { label: 'Editar', icon: 'pencil', key: 'edit', stpClass: 'bg-primary-light' },
      ];
    }
    return [
      { label: 'Activar', icon: 'check', key: 'toggle', stpClass: 'bg-success-light' },
    ];
  };

  // ── Main list state ──────────────────────────────────────────
  protected readonly resource = signal<PaginatedResponse<Supplier> | null>(null);
  protected readonly suppliers = computed(() => this.resource()?.data ?? []);
  protected readonly searchQuery = signal('');

  constructor() {
    this.loadSuppliers(1, false);
  }

  private loadSuppliers(page: number, append: boolean): void {
    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.loading.set(true);
    }

    this.supplierApi.getAll({ page, limit: 10 }).subscribe({
      next: resource => {
        if (append) {
          this.resource.update(prev => {
            if (!prev) {
              return {
                data: resource.data,
                meta: resource.meta,
              };
            }
            return {
              data: [...prev.data, ...resource.data],
              meta: resource.meta,
            };
          });
        } else {
          this.resource.set({
            data: resource.data,
            meta: resource.meta,
          });
        }
      },
      error: () => {
        if (!append) {
          this.resource.set({
            data: [],
            meta: PaginatedMeta.empty(10),
          });
        }
      },
    }).add(() => {
      this.loading.set(false);
      this.isLoadingMore.set(false);
    });
  }

  // ── Computed ─────────────────────────────────────────────────
  protected readonly filteredSuppliers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return this.suppliers().filter(s => {
      const matchesQuery = !query ||
        s.name.toLowerCase().includes(query) ||
        s.dni.includes(query) ||
        s.phone.includes(query);
      return matchesQuery;
    });
  });

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0,
  );

  protected readonly activeCount = computed(() =>
    this.suppliers().filter(s => s.active).length,
  );

  protected onScroll(index: number): void {
    if (this.isLoadingMore() || this.loading()) return;

    const maxTotal = this.resource()?.meta.total ?? 0;
    const totalItems = this.filteredSuppliers().length;
    const threshold = 7;

    if (totalItems >= maxTotal) return;

    if (index + threshold >= totalItems) {
      const currentPage = this.resource()?.meta.page ?? 1;
      const nextPage = currentPage + 1;
      this.loadSuppliers(nextPage, true);
    }
  }

  // ── Drawer ────────────────────────────────────────────────────
  protected openNewDrawer(): void {
    this.openDrawer(null);
  }

  protected openEditDrawer(supplier: Supplier): void {
    this.openDrawer(supplier);
  }

  private openDrawer(supplier: Supplier | null): void {
    const data: SupplierDrawerData = { supplier };

    this.bottomSheet
      .open<SupplierDrawerComponent, SupplierDrawerData, Supplier | null>(
        SupplierDrawerComponent,
        { data, panelClass: 'stp-supplier-panel' },
      )
      .afterDismissed()
      .subscribe(result => {
        if (!result) return;
        this.loadSuppliers(1, false);
      });
  }

  // ── Toggle active ─────────────────────────────────────────────
  protected toggleActive(supplier: Supplier): void {
    if (supplier.active) {
      this.supplierApi.remove(supplier.id).subscribe({
        next: () => this.resource.update(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data.map(s => s.id === supplier.id ? { ...s, active: false } : s),
          };
        }),
      });
    } else {
      this.supplierApi.update(supplier.id, { active: true }).subscribe({
        next: () => this.resource.update(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data.map(s => s.id === supplier.id ? { ...s, active: true } : s),
          };
        }),
      });
    }
  }

  // ── Main search ──────────────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  // ── Sticky header ────────────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.suppliersHeader()?.nativeElement;
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

  // ── Helpers ──────────────────────────────────────────────────
  protected supplierInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  protected trackBySupplierId(_index: number, supplier: Supplier): number {
    return supplier.id;
  }


  swipeOptionSelected(supplier: Supplier, option: SwipeOption): void {
    switch (option.key) {
      case 'toggle':
        this.toggleActive(supplier);
        break;
      case 'edit':
        this.openEditDrawer(supplier);
        break;
    }
  }

}
