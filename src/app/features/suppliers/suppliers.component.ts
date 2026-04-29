import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  SupplierDrawerComponent,
  SupplierDrawerData,
} from '../../shared/components/supplier-drawer/supplier-drawer.component';
import {
  SUPPLIER_CATEGORY_ICONS,
  SUPPLIER_CATEGORY_LABELS,
  Supplier,
  SupplierCategory,
} from './suppliers.data';
import { SwipeItemComponent, SwipeOption } from '../../shared/components/swipe-item/swipe-item.component';
import { SupplierApiService } from './supplier-api.service';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'stp-suppliers',
  imports: [ButtonComponent, IconComponent, SwipeItemComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
})
export class SuppliersComponent implements AfterViewInit, OnDestroy {
  private readonly suppliersHeader = viewChild<ElementRef>('suppliersHeader');
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly supplierApi = inject(SupplierApiService);

  protected readonly isStuck = signal(false);
  protected readonly loading = signal(false);

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
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly activeCategory = signal<SupplierCategory>('todos');

  constructor() {
    this.loadSuppliers();
  }

  private loadSuppliers(): void {
    this.loading.set(true);
    this.supplierApi.getAll().subscribe({
      next: items => {
        this.suppliers.set(items.map(i => this.supplierApi.toSupplier(i)));
        this.loading.set(false);
        
      },
      error: () => {
        this.loading.set(false);
        
      },
    });
  }

  // ── Computed ─────────────────────────────────────────────────
  protected readonly filteredSuppliers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.activeCategory();
    return this.suppliers().filter(s => {
      const matchesCategory = category === 'todos' || s.category === category;
      const matchesQuery = !query ||
        s.name.toLowerCase().includes(query) ||
        s.ruc.includes(query) ||
        s.phone.includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 || this.activeCategory() !== 'todos',
  );

  protected readonly activeCount = computed(() =>
    this.suppliers().filter(s => s.active).length,
  );

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
        this.loadSuppliers();
      });
  }

  // ── Toggle active ─────────────────────────────────────────────
  protected toggleActive(supplier: Supplier): void {
    if (supplier.active) {
      this.supplierApi.remove(supplier.id).subscribe({
        next: () => this.suppliers.update(prev =>
          prev.map(s => s.id === supplier.id ? { ...s, active: false } : s),
        ),
      });
    } else {
      this.supplierApi.update(supplier.id, { active: true }).subscribe({
        next: () => this.suppliers.update(prev =>
          prev.map(s => s.id === supplier.id ? { ...s, active: true } : s),
        ),
      });
    }
  }

  // ── Main search ──────────────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.activeCategory.set('todos');
  }

  protected setCategory(category: SupplierCategory): void {
    this.activeCategory.set(category);
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
  protected categoryIcon(category: SupplierCategory): string {
    return SUPPLIER_CATEGORY_ICONS[category];
  }

  protected supplierInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
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
