import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SaleProductCardComponent } from '../../shared/components/sale-product-card/sale-product-card.component';
import { CartDrawerComponent, CartBottomSheetData, CartDismissResult } from '../../shared/components/cart-drawer/cart-drawer.component';
import {
  CartItem,
  HAIR_TYPE_ICONS,
  HAIR_TYPE_LABELS,
  MOCK_PRODUCTS,
  Product,
  HairType,
  HAIR_TYPE_OPTIONS,
} from '../products/products.data';
import { ShimmerComponent } from '../../shared/components/shimmer/shimmer.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  selector: 'stp-sale',
  imports: [DecimalPipe, FormsModule, ButtonComponent, SaleProductCardComponent, ShimmerComponent, IconComponent, SectionHeaderComponent],
  templateUrl: './sale.component.html',
  styleUrl: './sale.component.scss',
})
export class SaleComponent implements AfterViewInit, OnDestroy {
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly saleHeader = viewChild<SectionHeaderComponent>('saleHeader');
  protected readonly isStuck = signal(false);
  private stickyObserver?: IntersectionObserver;

  // ── Search & filter ──────────────────────────────────────
  protected readonly hairTypes = HAIR_TYPE_OPTIONS;

  protected readonly hairTypeLabels = HAIR_TYPE_LABELS;

  protected readonly searchQuery = signal('');
  protected readonly activeHairType = signal<HairType>('lasio');
  protected readonly hasSearched = signal(false);

  // ── Quantity per product (before adding to cart) ─────────
  protected readonly quantities = signal<Map<number, number>>(new Map());

  // ── Cart ─────────────────────────────────────────────────
  protected readonly cartItems = signal<CartItem[]>([]);

  // ── Swipe tracking ───────────────────────────────────────
  private touchStartX = 0;

  // ── Derived ──────────────────────────────────────────────
  protected readonly filteredProducts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const hairType = this.activeHairType();

    return MOCK_PRODUCTS.filter(product => {
      void hairType;
      const matchesQuery = !query || product.name.toLowerCase().includes(query);
      return matchesQuery;
    });
  });

  protected readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  protected readonly cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  // ── Search handlers ──────────────────────────────────────
  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (value.trim().length > 0) this.hasSearched.set(true);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.hasSearched.set(false);
  }

  protected setHairType(hairType: HairType): void {
    this.activeHairType.set(hairType);
    if (!this.hasSearched()) this.hasSearched.set(true);
  }

  // ── Hair type icon helper ────────────────────────────────
  protected hairTypeIcon(hairType: HairType): string {
    return HAIR_TYPE_ICONS[hairType];
  }

  // ── Quantity helpers ─────────────────────────────────────
  protected getQty(productId: number): number {
    return this.quantities().get(productId) ?? 1;
  }

  protected setQty(productId: number, value: number | undefined): void {
    const clamped = Math.max(1, value ?? 0);
    this.quantities.update(map => {
      const next = new Map(map);
      next.set(productId, clamped);
      return next;
    });
  }

  protected incrementQty(productId: number): void {
    this.setQty(productId, this.getQty(productId) + 1);
  }

  protected decrementQty(productId: number): void {
    this.setQty(productId, this.getQty(productId) - 1);
  }

  // ── Swipe gesture handlers ───────────────────────────────
  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  protected onTouchEnd(event: TouchEvent, productId: number): void {
    const delta = event.changedTouches[0].clientX - this.touchStartX;
    if (delta > 50) {
      this.incrementQty(productId);
    } else if (delta < -50) {
      this.decrementQty(productId);
    }
  }

  // ── Cart handlers ─────────────────────────────────────────
  protected isInCart(productId: number): boolean {
    return this.cartItems().some(i => i.product.id === productId);
  }

  protected addToCart(product: Product, qty: number): void {
    
    this.cartItems.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) {
        return items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i,
        );
      }
      return [...items, { product, quantity: qty }];
    });
    // Reset quantity for this product after adding
    this.setQty(product.id, 1);
  }



  protected openCart(): void {
    const data: CartBottomSheetData = { items: this.cartItems() };

    this.bottomSheet
      .open<CartDrawerComponent, CartBottomSheetData, CartDismissResult | null>(CartDrawerComponent, {
        data,
        panelClass: 'stp-cart-panel',
      })
      .afterDismissed()
      .subscribe(result => {
        if (result) {
          
          this.cartItems.set(result.items);
          if (result.confirmed) {
            // TODO: connect to backend
          }
        }
      });
  }

  // ── Sticky observer ───────────────────────────────────────
  ngAfterViewInit(): void {
    const el = this.saleHeader()?.elementRef.nativeElement;
    if (!el) return;

    // Read the actual rendered height of the fixed app-header (includes safe-area-inset-top)
    const appHeader = document.querySelector('stp-app-header') as HTMLElement | null;
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
