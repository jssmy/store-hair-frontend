import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import {
  CATEGORY_LABELS,
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
  HAIR_COLORS,
  HairColor,
  Lote,
  LoteProduct,
  MOCK_PURCHASE_ORDERS,
  Product,
  ProductCategory,
  PurchaseOrder,
} from '../../../features/products/products.data';

// ── Types ────────────────────────────────────────────────────────────

interface LoteProductForm {
  id: string;
  name: string;
  color: HairColor | null;
  weight: number | null;
  length: number | null;
  price: number | null;
  quantity: number;
  category: Exclude<ProductCategory, 'todos'>;
  images: { file: File; dataUrl: string }[];
}

export interface InventoryDrawerData {
  products: Product[];
  prefilledPoNumber?: string;
}

export type InventoryDrawerResult = Lote;

// ── Constants ────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: Exclude<ProductCategory, 'todos'>[] = [
  'lisa', 'ondulada', 'rizada', 'cortina', 'extensiones', 'peluca',
];

// ── Component ────────────────────────────────────────────────────────

@Component({
  selector: 'stp-inventory-drawer',
  imports: [ButtonComponent, IconComponent, InputComponent],
  templateUrl: './inventory-drawer.component.html',
  styleUrl: './inventory-drawer.component.scss',
})
export class InventoryDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<InventoryDrawerComponent, InventoryDrawerResult | null>>(MatBottomSheetRef);
  private readonly data = inject<InventoryDrawerData>(MAT_BOTTOM_SHEET_DATA);

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly hairColors = HAIR_COLORS;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;

  // ── PO search state ──────────────────────────────────────────────
  protected readonly lotePoSearch = signal(this.data.prefilledPoNumber ?? '');
  protected readonly loteSelectedPO = signal<PurchaseOrder | null>(null);

  // ── Products state ───────────────────────────────────────────────
  protected readonly loteProducts = signal<LoteProductForm[]>([]);

  // ── Submit state ─────────────────────────────────────────────────
  protected readonly invSubmitting = signal(false);
  protected readonly invSuccess = signal(false);

  // ── Computed ─────────────────────────────────────────────────────

  protected readonly filteredPOs = computed(() => {
    const q = this.lotePoSearch().trim().toLowerCase();
    if (!q || this.loteSelectedPO()) return [];
    return MOCK_PURCHASE_ORDERS.filter(po =>
      po.number.toLowerCase().includes(q),
    ).slice(0, 6);
  });

  protected readonly lotePoNumber = computed(() =>
    this.loteSelectedPO()?.number ?? this.lotePoSearch().trim(),
  );

  protected readonly canSubmitLote = computed(() => {
    if (!this.loteSelectedPO()) return false;
    const products = this.loteProducts();
    if (products.length === 0) return false;
    return products.every(p =>
      p.name.trim() &&
      p.color !== null &&
      p.weight !== null && p.weight > 0 &&
      p.length !== null && p.length > 0 &&
      p.price !== null && p.price > 0 &&
      p.quantity > 0,
    );
  });

  protected close(): void {
    this.sheetRef.dismiss(null);
  }

  // ── PO search actions ────────────────────────────────────────────

  protected onPoSearchInput(value: string): void {
    this.lotePoSearch.set(value);
    this.loteSelectedPO.set(null);
  }

  protected clearPoSearch(): void {
    this.lotePoSearch.set('');
    this.loteSelectedPO.set(null);
  }

  protected selectPO(po: PurchaseOrder): void {
    this.loteSelectedPO.set(po);
    this.lotePoSearch.set(po.number);
  }

  // ── Products actions ─────────────────────────────────────────────

  protected addProduct(): void {
    const newProduct: LoteProductForm = {
      id: crypto.randomUUID(),
      name: '',
      color: null,
      weight: null,
      length: null,
      price: null,
      quantity: 1,
      category: 'lisa',
      images: [],
    };
    this.loteProducts.update(prev => [...prev, newProduct]);
  }

  protected removeProduct(id: string): void {
    this.loteProducts.update(prev => prev.filter(p => p.id !== id));
  }

  protected updateProduct(id: string, patch: Partial<LoteProductForm>): void {
    this.loteProducts.update(prev =>
      prev.map(p => p.id === id ? { ...p, ...patch } : p),
    );
  }

  protected addImages(productId: string, files: FileList | null): void {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.loteProducts.update(prev =>
          prev.map(p => p.id === productId
            ? { ...p, images: [...p.images, { file, dataUrl }] }
            : p,
          ),
        );
      };
      reader.readAsDataURL(file);
    });
  }

  protected removeImage(productId: string, index: number): void {
    this.loteProducts.update(prev =>
      prev.map(p => p.id === productId
        ? { ...p, images: p.images.filter((_, i) => i !== index) }
        : p,
      ),
    );
  }

  // ── Submit ───────────────────────────────────────────────────────

  protected submitLote(): void {
    if (!this.canSubmitLote()) return;
    this.invSubmitting.set(true);

    setTimeout(() => {
      const po = this.loteSelectedPO()!;
      const loteProductsMapped: LoteProduct[] = this.loteProducts().map(p => ({
        id: p.id,
        name: p.name.trim(),
        color: p.color!,
        weight: p.weight!,
        length: p.length!,
        price: p.price!,
        quantity: p.quantity,
        category: p.category,
        images: p.images.map(img => img.dataUrl),
      }));

      const result: Lote = {
        purchaseOrderNumber: po.number,
        registeredBy: 'Usuario Actual',
        registeredAt: new Date().toISOString(),
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        products: loteProductsMapped,
      };

      this.invSubmitting.set(false);
      this.invSuccess.set(true);
      setTimeout(() => this.sheetRef.dismiss(result), 1200);
    }, 600);
  }
}
