import { AfterViewInit, Component, DestroyRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { combineLatest, debounceTime, skip } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { TabItem, TabsComponent } from '../../shared/components/tabs/tabs.component';
import {
  SupplierDrawerComponent,
  SupplierDrawerData,
} from '../../shared/components/supplier-drawer/supplier-drawer.component';
import {
  Supplier,
  SupplierType,
} from './suppliers.data';
import { SwipeItemComponent, SwipeOption } from '../../shared/components/swipe-item/swipe-item.component';
import { SupplierApiService, SupplierQueryParams } from './supplier-api.service';
import { CdkVirtualForOf, CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { PaginatedMeta, PaginatedResponse } from '../../core/models/pagination.model';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  selector: 'stp-suppliers',
  imports: [
    ButtonComponent,
    IconComponent,
    SearchComponent,
    TabsComponent,
    SwipeItemComponent,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    ScrollingModule,
    SectionHeaderComponent,
  ],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
})
export class SuppliersComponent implements AfterViewInit, OnDestroy {
  private readonly suppliersHeader = viewChild<SectionHeaderComponent>('suppliersHeader');
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly supplierApi = inject(SupplierApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isStuck = signal(false);
  protected readonly loading = signal(false);
  protected readonly isLoadingMore = signal(false);

  protected readonly statusFilter = signal<string>('all');
  protected readonly typeFilter = signal<string>('all');

  protected readonly statusTabs: TabItem[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  protected readonly typeTabs: TabItem[] = [
    { value: 'all', label: 'Todos' },
    { value: SupplierType.NATURAL, label: 'Persona natural' },
    { value: SupplierType.JURIDICA, label: 'Persona jurídica' },
  ];

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
    this.loadSuppliers(this.buildQueryParams(1));

    combineLatest([
      toObservable(this.statusFilter),
      toObservable(this.typeFilter),
    ]).pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadSuppliers(this.buildQueryParams(1)));

    toObservable(computed(() => ({
      search: this.searchQuery().trim(),
    }))).pipe(
      skip(1),
      debounceTime(2000),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadSuppliers(this.buildQueryParams(1)));
  }

  private buildQueryParams(page: number): SupplierQueryParams {
    const statusValue = {
      active: true,
      inactive: false,
    };

    const active = statusValue[this.statusFilter() as keyof typeof statusValue] as boolean | undefined;
    const type = this.typeFilter() === 'all' ? undefined : this.typeFilter() as SupplierType | undefined;
    const search = this.searchQuery().trim() || undefined;

    return {
      page,
      limit: 10,
      search,
      active,
      type,

    };
  }

  private loadSuppliers(query: SupplierQueryParams): void {

    if (query.page > 1) {
      this.isLoadingMore.set(true);
    } else {
      this.loading.set(true);
    }

    this.supplierApi.getAll(query).subscribe({
      next: resource => {
        if (query.page > 1) {
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
    }).add(() => {
      this.loading.set(false);
      this.isLoadingMore.set(false);
    });
  }

  // ── Computed ─────────────────────────────────────────────────
  protected readonly filteredSuppliers = computed(() => this.suppliers());

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 ||
    this.statusFilter() !== 'all' ||
    this.typeFilter() !== 'all',
  );

  protected onScroll(index: number): void {
    if (this.isLoadingMore() || this.loading()) return;

    const maxTotal = this.resource()?.meta.total ?? 0;
    const totalItems = this.suppliers().length;
    const threshold = 7;

    if (totalItems >= maxTotal) return;

    if (index + threshold >= totalItems) {
      const currentPage = this.resource()?.meta.page ?? 1;
      const nextPage = currentPage + 1;
      this.loadSuppliers(this.buildQueryParams(nextPage));
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
        this.loadSuppliers(this.buildQueryParams(1));
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
    const el = this.suppliersHeader()?.elementRef.nativeElement;
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
  protected supplierDisplayName(supplier: Supplier): string {
    return supplier.type === SupplierType.NATURAL
      ? (supplier.fullName ?? '')
      : (supplier.businessName ?? '');
  }

  protected supplierInitials(supplier: Supplier): string {
    return this.supplierDisplayName(supplier)
      .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
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
