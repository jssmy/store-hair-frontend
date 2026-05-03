import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import { SelectComponent, SelectOption } from '../select/select.component';
import {
  HAIR_TYPE_LABELS,
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
  HAIR_COLORS,
  HairColor,
  Inventory,
  Lote,
  LoteProduct,
  HairType,
} from '../../../features/products/products.data';
import { InventoryService } from '../../../core/services/inventory.service';
import { CreateProductDto } from '../../../features/products/products.data';
import { environment } from '../../../../environments/environment';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

// ── Types ────────────────────────────────────────────────────────────

interface LoteProductForm {
  id: string;
  name: string;
  type: string;
  color: HairColor | null;
  weight: number | null;
  length: number | null;
  price: number | null;
  images: { file: File | null; dataUrl: string }[];
}

export interface InventoryDrawerData {
  inventory?: Inventory;
  prefilledPoNumber?: string;
}

export type InventoryDrawerResult = Lote;

// ── Constants ────────────────────────────────────────────────────────

const PRODUCT_HAIR_TYPE_OPTIONS: Exclude<HairType, 'todos'>[] = [
  'lisa', 'ondulada', 'rizada', 'cortina', 'extensiones', 'peluca',
];

const HAIR_TYPE_OPTIONS: SelectOption[] = [
  { value: 'lizo', label: 'Lizo' },
  { value: 'lasio', label: 'Lasio' },
  { value: 'ondulado', label: 'Ondulado' },
  { value: 'rizado', label: 'Rizado' },
  { value: 'otros', label: 'Otros' },
];

// ── Component ────────────────────────────────────────────────────────

@Component({
  selector: 'stp-inventory-drawer',
  imports: [ButtonComponent, IconComponent, InputComponent, SelectComponent],
  templateUrl: './inventory-drawer.component.html',
  styleUrl: './inventory-drawer.component.scss',
})
export class InventoryDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<InventoryDrawerComponent, InventoryDrawerResult | null>>(MatBottomSheetRef);
  private readonly data = inject<InventoryDrawerData>(MAT_BOTTOM_SHEET_DATA);

  private readonly inventoryService = inject(InventoryService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);


  private readonly purchaseOrders = toSignal(this.purchaseOrderService.getAllAproved({ page: 1, limit: 100 }).pipe(map(res => res.data)), { initialValue: [] });
  protected readonly productHairTypeOptions = PRODUCT_HAIR_TYPE_OPTIONS;
  protected readonly productHairTypeLabels = HAIR_TYPE_LABELS;
  protected readonly productHairTypeSelectOptions: SelectOption[] = PRODUCT_HAIR_TYPE_OPTIONS.map(hairType => ({
    value: hairType,
    label: HAIR_TYPE_LABELS[hairType],
  }));

  protected readonly hairTypeOptions = HAIR_TYPE_OPTIONS;
  protected readonly hairColors = HAIR_COLORS;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;

  // ── Edit mode ────────────────────────────────────────────────────
  protected readonly isEditMode = !!this.data.inventory;
  protected readonly editInventory = this.data.inventory ?? null;

  // ── PO search state ──────────────────────────────────────────────
  protected readonly lotePoSearch = signal(this.data.prefilledPoNumber ?? '');
  protected readonly loteSelectedPO = signal<PurchaseOrder | null>(null);

  private readonly assets = environment.assets;

  // ── Products state (pre-filled when editing) ─────────────────────
  protected readonly loteProducts = signal<LoteProductForm[]>(
    this.data.inventory
      ? this.data.inventory.products.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          color: p.color,
          weight: p.weight,
          length: p.length,
          price: p.price,
          images: p.imageUrls.map(url => ({ file: null, dataUrl: this.assets + '/' + url })),
        }))
      : [],
  );

  // ── Submit state ─────────────────────────────────────────────────
  protected readonly invSubmitting = signal(false);
  protected readonly invSuccess = signal(false);

  // ── Computed ─────────────────────────────────────────────────────

  protected readonly filteredPOs = computed(() => {
    const q = this.lotePoSearch().trim().toLowerCase();
    if (!q || this.loteSelectedPO()) return [];
    return this.purchaseOrders().filter(po =>
      po.oc.toLowerCase().includes(q),
    ).slice(0, 6);
  });

  protected readonly lotePoNumber = computed(() =>
    this.loteSelectedPO()?.oc ?? this.lotePoSearch().trim(),
  );

  protected readonly canSubmitLote = computed(() => {
    const products = this.loteProducts();


    if (products.length === 0) return false;
    const allValid = products.every(p =>
      p.type.trim().length > 0 &&
      p.color !== null &&
      p.weight !== null && p.weight > 0 &&
      p.length !== null && p.length > 0 &&
      p.price !== null && p.price > 0,
    );
    if (this.isEditMode) return allValid;

    console.log('Selected PO:', this.loteSelectedPO());
    console.log('PO Number:', this.lotePoNumber());
    console.log('All products valid:', allValid);

    return allValid && !!this.loteSelectedPO();
  });

  protected close(): void {
    this.sheetRef.dismiss(null);
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'short' });
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
    this.lotePoSearch.set(po.oc);
  }

  // ── Products actions ─────────────────────────────────────────────

  protected addProduct(): void {
    const newProduct: LoteProductForm = {
      id: crypto.randomUUID(),
      name: '',
      type: '',
      color: null,
      weight: null,
      length: null,
      price: null,
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

    const products: CreateProductDto[] = this.loteProducts().map(p => ({
      type: p.type,
      color: p.color!,
      price: Number(p.price!),
      length: Number(p.length!),
      weight: Number(p.weight!),
      images: p.images.map(img => img.dataUrl),
    }));

    if (this.isEditMode) {
      this.inventoryService.update(this.editInventory!.id, products).subscribe({
        next: () => {
          this.invSubmitting.set(false);
          this.invSuccess.set(true);
          setTimeout(() => this.sheetRef.dismiss(null), 1200);
        },
        error: () => { this.invSubmitting.set(false); },
      });
      return;
    }

    const po = this.loteSelectedPO()!;
    const loteProductsMapped: LoteProduct[] = this.loteProducts().map(p => ({
      id: p.id,
      name: p.name.trim(),
      type: p.type,
      color: p.color!,
      weight: Number(p.weight!),
      length: Number(p.length!),
      price: Number(p.price!),
      images: p.images.map(img => img.dataUrl),
    }));

    const result: Lote = {
      purchaseOrderNumber: po.oc,
      registeredBy: 'Usuario Actual',
      registeredAt: new Date().toISOString(),
      supplierId: po.supplier.id,
      supplierName: po.supplier.name,
      products: loteProductsMapped,
    };

    this.inventoryService.create({ products }).subscribe({
      next: () => {
        this.invSubmitting.set(false);
        this.invSuccess.set(true);
        setTimeout(() => this.sheetRef.dismiss(result), 1200);
      },
      error: () => { this.invSubmitting.set(false); },
    });
  }
}
