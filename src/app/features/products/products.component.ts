import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  InventoryDrawerComponent,
  InventoryDrawerData,
  InventoryDrawerResult,
} from '../../shared/components/inventory-drawer/inventory-drawer.component';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  MOCK_PRODUCTS,
  Product,
  ProductCategory,
} from './products.data';

@Component({
  selector: 'stp-products',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements AfterViewInit, OnDestroy {
  private readonly productHeader = viewChild<ElementRef>('productHeader');
  private readonly bottomSheet = inject(MatBottomSheet);
  protected readonly isStuck = signal(false);
  private stickyObserver?: IntersectionObserver;

  protected readonly categories: ProductCategory[] = [
    'todos', 'abarrotes', 'bebidas', 'lacteos',
    'snacks', 'limpieza', 'higiene', 'panaderia', 'carnes',
  ];
  protected readonly categoryLabels = CATEGORY_LABELS;

  // ── Main list state ──────────────────────────────────────────
  protected readonly products = signal<Product[]>([...MOCK_PRODUCTS]);
  protected readonly searchQuery = signal('');
  protected readonly activeCategory = signal<ProductCategory>('todos');

  // ── Computed ─────────────────────────────────────────────────
  protected readonly filteredProducts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.activeCategory();
    return this.products().filter(p => {
      const matchesCategory = category === 'todos' || p.category === category;
      const matchesQuery = !query || p.name.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  protected readonly isFiltered = computed(() =>
    this.searchQuery().trim().length > 0 || this.activeCategory() !== 'todos',
  );

  // ── Inventory drawer ─────────────────────────────────────────
  protected openInventoryDrawer(prefilledName = ''): void {
    const data: InventoryDrawerData = { products: this.products(), prefilledName };
    const ref = this.bottomSheet.open(InventoryDrawerComponent, { data });

    ref.afterDismissed().subscribe((result: InventoryDrawerResult | null | undefined) => {
      if (!result) return;

      if (result.type === 'update') {
        this.products.update(prev =>
          prev.map(p => p.id === result.productId
            ? { ...p, stock: p.stock + result.stockAdd, supplier: result.supplier }
            : p,
          ),
        );
      } else {
        this.products.update(prev => [
          ...prev,
          {
            id: prev.length + 1,
            name: result.name,
            category: result.category,
            price: result.price,
            stock: result.stockAdd,
            unit: result.unit,
            supplier: result.supplier,
          },
        ]);
      }
    });
  }

  // ── Main search ──────────────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.activeCategory.set('todos');
  }

  protected setCategory(category: ProductCategory): void {
    this.activeCategory.set(category);
  }

  // ── Sticky header ────────────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.productHeader()?.nativeElement;
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
  protected stockStatus(stock: number): 'ok' | 'low' | 'out' {
    if (stock === 0) return 'out';
    if (stock <= 5) return 'low';
    return 'ok';
  }

  protected categoryIcon(category: ProductCategory): string {
    return CATEGORY_ICONS[category];
  }

  protected productInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
