import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { combineLatest, debounceTime, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CdkVirtualForOf, CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SaleProductCardComponent } from '../../shared/components/sale-product-card/sale-product-card.component';
import { CartDrawerComponent, CartBottomSheetData, CartDismissResult } from '../../shared/components/cart-drawer/cart-drawer.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ShimmerComponent } from '../../shared/components/shimmer/shimmer.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ProductService, ProductQuery } from '../../core/services/product.service';
import { PaginatedResponse } from '../../core/models/pagination.model';
import {
  CartItem,
  Product,
  HairType,
  HairColor,
  HAIR_TYPE_ICONS,
  HAIR_TYPE_LABELS,
  HAIR_TYPE_OPTIONS,
  HAIR_COLOR_LABELS,
  HAIR_COLORS,
  HAIR_COLOR_HEX,
} from '../products/products.data';

type FilterHairType = HairType | 'all';
type FilterColor    = HairColor | 'all';

@Component({
  selector: 'stp-sale',
  imports: [
    DecimalPipe,
    ButtonComponent,
    SaleProductCardComponent,
    ShimmerComponent,
    IconComponent,
    SectionHeaderComponent,
    AlertComponent,
    EmptyStateComponent,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    ScrollingModule,
  ],
  templateUrl: './sale.component.html',
  styleUrl: './sale.component.scss',
})
export class SaleComponent implements AfterViewInit, OnDestroy {
  private readonly bottomSheet    = inject(MatBottomSheet);
  private readonly productService = inject(ProductService);
  private readonly destroyRef     = inject(DestroyRef);
  private readonly saleHeader     = viewChild<SectionHeaderComponent>('saleHeader');
  private stickyObserver?: IntersectionObserver;

  // ── UI state ─────────────────────────────────────────────
  protected readonly isStuck       = signal(false);
  protected readonly loading       = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly hasError      = signal(false);

  // ── Filter state ─────────────────────────────────────────
  protected readonly hairTypes       = ['all', ...HAIR_TYPE_OPTIONS] as FilterHairType[];
  protected readonly hairTypeLabels  = { all: 'Todos', ...HAIR_TYPE_LABELS };
  protected readonly hairTypeIcons   = { all: '🔀', ...HAIR_TYPE_ICONS };
  protected readonly colors          = ['all', ...HAIR_COLORS] as FilterColor[];
  protected readonly colorLabels     = { all: 'Todos', ...HAIR_COLOR_LABELS } as Record<FilterColor, string>;
  protected readonly colorHex        = HAIR_COLOR_HEX;

  protected readonly searchQuery    = signal('');
  protected readonly activeHairType = signal<FilterHairType>('all');
  protected readonly activeColor    = signal<FilterColor>('all');

  // ── Products ──────────────────────────────────────────────
  protected readonly resource   = signal<PaginatedResponse<Product> | null>(null);
  protected readonly products   = computed(() => this.resource()?.data ?? []);
  protected readonly totalCount = computed(() => this.resource()?.meta.total ?? 0);

  // ── Cart ─────────────────────────────────────────────────
  protected readonly cartItems = signal<CartItem[]>([]);

  // ── Cart derived ─────────────────────────────────────────
  protected readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.salePrice * (item.product.weight ?? 0), 0),
  );
  protected readonly cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  // ── Shimmer placeholder array ─────────────────────────────
  protected readonly placeholders = Array(6).fill(null);

  constructor() {
    // Carga inicial
    this.loadProducts(this.buildQueryParams(1));

    // Cambios de filtro (tipo + color) → recarga inmediata con debounceTime(0) para batch
    combineLatest([
      toObservable(this.activeHairType),
      toObservable(this.activeColor),
    ]).pipe(
      skip(1),
      debounceTime(0),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadProducts(this.buildQueryParams(1)));

    // Búsqueda → recarga con debounce
    toObservable(computed(() => ({ search: this.searchQuery().trim() }))).pipe(
      skip(1),
      debounceTime(400),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadProducts(this.buildQueryParams(1)));
  }

  // ── Data loading ──────────────────────────────────────────
  private buildQueryParams(page: number): ProductQuery {
    return {
      page,
      limit: 20,
      search: this.searchQuery().trim() || undefined,
      type:   this.activeHairType() !== 'all' ? this.activeHairType() : undefined,
      color:  this.activeColor()    !== 'all' ? this.activeColor()    : undefined,
      active: true, // Solo cargamos productos activos para la venta
    };
  }

  private loadProducts(query: ProductQuery): void {
    if ((query.page ?? 1) > 1) {
      this.isLoadingMore.set(true);
    } else {
      this.loading.set(true);
      this.hasError.set(false);
    }

    this.productService.getAll(query).subscribe({
      next: resource => {
        if ((query.page ?? 1) > 1) {
          this.resource.update(prev => {
            if (!prev) return resource;
            return { data: [...prev.data, ...resource.data], meta: resource.meta };
          });
        } else {
          this.resource.set(resource);
        }
      },
      error: () => {
        this.hasError.set(true);
      },
    }).add(() => {
      this.loading.set(false);
      this.isLoadingMore.set(false);
    });
  }

  // ── Scroll handler ────────────────────────────────────────
  protected onScroll(index: number): void {
    if (this.isLoadingMore() || this.loading()) return;

    const maxTotal   = this.resource()?.meta.total ?? 0;
    const totalItems = this.products().length;
    const threshold  = 4;

    if (totalItems >= maxTotal) return;

    // index ≈ scrollOffset / itemSize → aproxima el índice de fila en la grilla de 2 cols
    const approxRows = Math.ceil(totalItems / 2);
    if (index + threshold >= approxRows) {
      const currentPage = this.resource()?.meta.page ?? 1;
      this.loadProducts(this.buildQueryParams(currentPage + 1));
    }
  }

  // ── Search handlers ──────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected retry(): void {
    this.loadProducts(this.buildQueryParams(1));
  }

  // ── Filter handlers ───────────────────────────────────────
  protected setHairType(type: FilterHairType): void {
    this.activeHairType.set(type);
  }

  protected setColor(color: FilterColor): void {
    this.activeColor.set(color);
  }

  protected isFilterActive(): boolean {
    return this.activeHairType() !== 'all' || this.activeColor() !== 'all' || !!this.searchQuery().trim();
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.activeHairType.set('all');
    this.activeColor.set('all');
  }

  // ── Cart helpers ──────────────────────────────────────────
  protected isInCart(productId: number): boolean {
    return this.cartItems().some(i => i.product.id === productId);
  }

  protected addToCart(product: Product, qty: number): void {
    const cartProduct: Product = { ...product, imageUrl: product.imageUrls?.[0] };
    const defaultSalePrice = cartProduct.price;

    this.cartItems.update(items => {
      // Producto único: si ya está en el carrito no se duplica
      if (items.some(i => i.product.id === cartProduct.id)) return items;
      return [...items, { product: cartProduct, quantity: qty, salePrice: defaultSalePrice }];
    });
  }

  protected openCart(): void {
    const data: CartBottomSheetData = { items: this.cartItems() };

    this.bottomSheet
      .open<CartDrawerComponent, CartBottomSheetData, CartDismissResult | null>(
        CartDrawerComponent,
        { data, panelClass: 'stp-cart-panel' },
      )
      .afterDismissed()
      .subscribe(result => {
        if (result) {
          this.cartItems.set(result.items);
          if (result.confirmed) {
            this.loadProducts(this.buildQueryParams(1)); // Recarga para actualizar stock, precios, etc. —
            // TODO: conectar al backend — POST /sale
          }
        }
      });
  }

  // ── Helpers ──────────────────────────────────────────────
  protected trackByProductId(_index: number, product: Product): number {
    return product.id;
  }

  // ── Sticky observer ────────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.saleHeader()?.elementRef.nativeElement;
    if (!el) return;

    const appHeader    = document.querySelector('stp-app-header') as HTMLElement | null;
    const headerHeight = appHeader?.offsetHeight ?? 60;

    this.stickyObserver = new IntersectionObserver(
      ([entry]) => this.isStuck.set(!entry.isIntersecting),
      { threshold: 0, rootMargin: `-${headerHeight}px 0px 0px 0px` },
    );
    this.stickyObserver.observe(el);
  }

  ngOnDestroy(): void {
    this.stickyObserver?.disconnect();
  }
}
