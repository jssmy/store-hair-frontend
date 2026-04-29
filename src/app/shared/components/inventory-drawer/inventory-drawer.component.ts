import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import {
  SupplierDrawerComponent,
  SupplierDrawerData,
} from '../supplier-drawer/supplier-drawer.component';
import {
  MOCK_SUPPLIERS,
  SUPPLIER_CATEGORY_ICONS,
  Supplier,
  SupplierCategory,
} from '../../../features/suppliers/suppliers.data';
import {
  CATEGORY_LABELS,
  Product,
  ProductCategory,
} from '../../../features/products/products.data';

interface InvNewProductForm {
  name: string;
  category: Exclude<ProductCategory, 'todos'>;
  price: number | null;
  unit: string;
}

export interface InventoryDrawerData {
  products: Product[];
  prefilledName?: string;
}

export type InventoryDrawerResult =
  | { type: 'update'; productId: number; stockAdd: number; supplier: string }
  | {
      type: 'new';
      name: string;
      category: Exclude<ProductCategory, 'todos'>;
      price: number;
      unit: string;
      stockAdd: number;
      supplier: string;
    };

const CATEGORY_OPTIONS: Exclude<ProductCategory, 'todos'>[] = [
  'abarrotes', 'bebidas', 'lacteos', 'snacks', 'limpieza', 'higiene', 'panaderia', 'carnes',
];

const UNITS = [
  'unidad', 'kg', 'bolsa', 'botella', 'caja', 'paquete', 'tarro', 'barra', 'vaso', 'saco', 'cartón',
];

@Component({
  selector: 'stp-inventory-drawer',
  imports: [ButtonComponent, IconComponent, InputComponent],
  templateUrl: './inventory-drawer.component.html',
  styleUrl: './inventory-drawer.component.scss',
})
export class InventoryDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<InventoryDrawerComponent, InventoryDrawerResult | null>>(MatBottomSheetRef);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly data = inject<InventoryDrawerData>(MAT_BOTTOM_SHEET_DATA);

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly UNITS = UNITS;
  protected readonly categoryLabels = CATEGORY_LABELS;

  // ── Product search state ─────────────────────────────────────
  protected readonly invProductSearch = signal(this.data.prefilledName ?? '');
  protected readonly invSelectedProduct = signal<Product | null>(null);
  protected readonly invAddingNew = signal(false);
  protected readonly invNewProduct = signal<InvNewProductForm>({
    name: '', category: 'abarrotes', price: null, unit: '',
  });

  // ── Supplier search state ────────────────────────────────────
  private readonly localSuppliers = signal<Supplier[]>([...MOCK_SUPPLIERS]);
  protected readonly invSupplierSearch = signal('');
  protected readonly invSelectedSupplier = signal<Supplier | null>(null);

  // ── Other state ──────────────────────────────────────────────
  protected readonly invStockAdd = signal<number | null>(null);
  protected readonly invSubmitting = signal(false);
  protected readonly invSuccess = signal(false);

  constructor() {
    const prefilled = this.data.prefilledName?.trim() ?? '';
    if (prefilled) {
      const hasMatch = this.data.products.some(p =>
        p.name.toLowerCase().includes(prefilled.toLowerCase()),
      );
      this.invAddingNew.set(!hasMatch);
      if (!hasMatch) {
        this.invNewProduct.update(prev => ({ ...prev, name: prefilled }));
      }
    }
  }

  // ── Computed ─────────────────────────────────────────────────
  protected readonly invFilteredProducts = computed(() => {
    const q = this.invProductSearch().trim().toLowerCase();
    if (!q || this.invSelectedProduct()) return [];
    return this.data.products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  });

  protected readonly invFilteredSuppliers = computed(() => {
    const q = this.invSupplierSearch().trim().toLowerCase();
    if (!q || this.invSelectedSupplier()) return [];
    return this.localSuppliers()
      .filter(s => s.active && s.name.toLowerCase().includes(q))
      .slice(0, 6);
  });

  protected readonly canSubmitInventory = computed(() => {
    if (!this.invStockAdd() || this.invStockAdd()! <= 0) return false;
    if (!this.invSelectedSupplier()) return false;
    if (this.invSelectedProduct()) return true;
    if (this.invAddingNew()) {
      const np = this.invNewProduct();
      return !!(np.name.trim() && np.price && np.price > 0 && np.unit);
    }
    return false;
  });

  protected close(): void {
    this.sheetRef.dismiss(null);
  }

  // ── Product search actions ───────────────────────────────────
  protected onInvProductSearchInput(value: string): void {
    this.invProductSearch.set(value);
    this.invSelectedProduct.set(null);
    this.invAddingNew.set(false);
  }

  protected clearInvProductSearch(): void {
    this.invProductSearch.set('');
    this.invSelectedProduct.set(null);
    this.invAddingNew.set(false);
  }

  protected selectInvProduct(product: Product): void {
    this.invSelectedProduct.set(product);
    this.invProductSearch.set(product.name);
    this.invAddingNew.set(false);
  }

  protected switchToNewProduct(): void {
    this.invAddingNew.set(true);
    this.invNewProduct.update(prev => ({ ...prev, name: this.invProductSearch() }));
    this.invSelectedProduct.set(null);
  }

  protected patchInvNewProduct(patch: Partial<InvNewProductForm>): void {
    this.invNewProduct.update(prev => ({ ...prev, ...patch }));
  }

  // ── Supplier search actions ──────────────────────────────────
  protected onSupplierSearchInput(value: string): void {
    this.invSupplierSearch.set(value);
    this.invSelectedSupplier.set(null);
  }

  protected clearSupplierSearch(): void {
    this.invSupplierSearch.set('');
    this.invSelectedSupplier.set(null);
  }

  protected selectSupplier(supplier: Supplier): void {
    this.invSelectedSupplier.set(supplier);
    this.invSupplierSearch.set(supplier.name);
  }

  protected openAddSupplier(): void {
    const data: SupplierDrawerData = { supplier: null };
    this.bottomSheet
      .open<SupplierDrawerComponent, SupplierDrawerData, Supplier | null>(
        SupplierDrawerComponent,
        { data, panelClass: 'stp-supplier-panel' },
      )
      .afterDismissed()
      .subscribe((result: Supplier | null | undefined) => {
        if (!result) return;
        const newSupplier: Supplier = {
          id: this.localSuppliers().length + 1,
          name: result.name,
          ruc: result.ruc,
          phone: result.phone,
          email: result.email,
          address: result.address,
          category: result.category,
          active: true,
        };
        this.localSuppliers.update(prev => [...prev, newSupplier]);
        this.selectSupplier(newSupplier);
      });
  }

  // ── Submit ───────────────────────────────────────────────────
  protected submitInventory(): void {
    if (!this.canSubmitInventory()) return;
    this.invSubmitting.set(true);

    setTimeout(() => {
      const stockAdd = this.invStockAdd()!;
      const supplier = this.invSelectedSupplier()!.name;
      const selected = this.invSelectedProduct();
      let result: InventoryDrawerResult;

      if (selected) {
        result = { type: 'update', productId: selected.id, stockAdd, supplier };
      } else {
        const np = this.invNewProduct();
        result = {
          type: 'new',
          name: np.name.trim(),
          category: np.category,
          price: np.price!,
          unit: np.unit,
          stockAdd,
          supplier,
        };
      }

      this.invSubmitting.set(false);
      this.invSuccess.set(true);
      setTimeout(() => this.sheetRef.dismiss(result), 1200);
    }, 600);
  }

  // ── Helpers ──────────────────────────────────────────────────
  protected productInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  protected supplierIcon(category: SupplierCategory): string {
    return SUPPLIER_CATEGORY_ICONS[category];
  }
}
