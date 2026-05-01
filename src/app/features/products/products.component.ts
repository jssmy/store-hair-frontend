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
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
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
    'todos', 'lisa', 'ondulada', 'rizada', 'cortina', 'extensiones', 'peluca',
  ];
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;

  // ── Main list state ──────────────────────────────────────────────
  protected readonly products = signal<Product[]>([...MOCK_PRODUCTS]);
  protected readonly searchQuery = signal('');
  protected readonly activeCategory = signal<ProductCategory>('todos');

  // ── Computed ─────────────────────────────────────────────────────
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

  // ── Inventory drawer ─────────────────────────────────────────────
  protected openInventoryDrawer(): void {
    const data: InventoryDrawerData = { products: this.products() };
    const ref = this.bottomSheet.open(InventoryDrawerComponent, {
      data,
      panelClass: 'stp-supplier-panel',
    });

    ref.afterDismissed().subscribe((result: InventoryDrawerResult | null | undefined) => {
      if (!result) return;

      this.products.update(prev => {
        const updated = [...prev];
        for (const lp of result.products) {
          const existingIdx = updated.findIndex(
            p => p.name.toLowerCase() === lp.name.toLowerCase() && p.color === lp.color,
          );
          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              stock: updated[existingIdx].stock + lp.quantity,
              supplier: result.supplierName,
            };
          } else {
            updated.push({
              id: updated.length + 1,
              name: lp.name,
              category: lp.category,
              price: lp.price,
              stock: lp.quantity,
              unit: 'unidad',
              supplier: result.supplierName,
              color: lp.color,
              weight: lp.weight,
              length: lp.length,
              images: lp.images,
            });
          }
        }
        return updated;
      });
    });
  }

  // ── Main search ──────────────────────────────────────────────────
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

  // ── Sticky header ────────────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────────
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
