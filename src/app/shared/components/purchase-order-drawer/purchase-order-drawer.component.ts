import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import {
  CATEGORY_LABELS,
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
  HAIR_COLORS,
  HairColor,
  ProductCategory,
} from '../../../features/products/products.data';
import { MOCK_SUPPLIERS } from '../../../features/suppliers/suppliers.data';
import {
  PO_STATUS_LABELS,
  POStatus,
  PurchaseOrderDrawerData,
  PurchaseOrderDrawerResult,
  PurchaseOrderFull,
} from '../../../features/purchase-order/purchase-order.data';

// ── Constants ─────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: Exclude<ProductCategory, 'todos'>[] = [
  'lisa', 'ondulada', 'rizada', 'cortina', 'extensiones', 'peluca',
];

// ── Types ─────────────────────────────────────────────────────────────

interface DetailForm {
  id: string;
  color: HairColor | null;
  type: Exclude<ProductCategory, 'todos'>;
  length: number | null;   // cm
  kilo: number | null;     // kg
  totalPrice: number | null;
  duplicateError: boolean;
}

// ── Component ─────────────────────────────────────────────────────────

@Component({
  selector: 'stp-purchase-order-drawer',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './purchase-order-drawer.component.html',
  styleUrl: './purchase-order-drawer.component.scss',
})
export class PurchaseOrderDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<PurchaseOrderDrawerComponent, PurchaseOrderDrawerResult | null>>(MatBottomSheetRef);
  private readonly data = inject<PurchaseOrderDrawerData>(MAT_BOTTOM_SHEET_DATA);

  protected readonly suppliers = MOCK_SUPPLIERS.filter(s => s.active);
  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly hairColors = HAIR_COLORS;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;
  protected readonly statusOptions: POStatus[] = ['pendiente', 'recibida', 'cancelada'];
  protected readonly statusLabels = PO_STATUS_LABELS;
  protected readonly isEdit = !!this.data.purchaseOrder;

  // ── Form state ────────────────────────────────────────────────
  protected readonly supplierSearch = signal(this.data.purchaseOrder?.supplierName ?? '');
  protected readonly selectedSupplierId = signal<number | null>(this.data.purchaseOrder?.supplierId ?? null);
  protected readonly status = signal<POStatus>(this.data.purchaseOrder?.status ?? 'pendiente');
  protected readonly registeredBy = signal(this.data.purchaseOrder?.registeredBy ?? '');
  protected readonly details = signal<DetailForm[]>(
    (this.data.purchaseOrder?.details ?? []).map(d => ({
      id: d.id,
      color: d.color,
      type: d.type,
      length: d.length,
      kilo: d.kilo,
      totalPrice: d.totalPrice,
      duplicateError: false,
    })),
  );

  // ── Submit state ──────────────────────────────────────────────
  protected readonly submitting = signal(false);
  protected readonly success = signal(false);

  // ── Computed ──────────────────────────────────────────────────

  protected readonly filteredSuppliers = computed(() => {
    const q = this.supplierSearch().trim().toLowerCase();
    if (!q || this.selectedSupplierId() !== null) return [];
    return this.suppliers.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5);
  });

  protected readonly selectedSupplier = computed(() =>
    this.suppliers.find(s => s.id === this.selectedSupplierId()) ?? null,
  );

  protected readonly totalKilo = computed(() =>
    this.details().reduce((sum, d) => sum + (d.kilo ?? 0), 0),
  );

  protected readonly totalPrice = computed(() =>
    this.details().reduce((sum, d) => sum + (d.totalPrice ?? 0), 0),
  );

  protected readonly canSubmit = computed(() => {
    if (!this.selectedSupplierId()) return false;
    if (!this.registeredBy().trim()) return false;
    const dets = this.details();
    if (dets.length === 0) return false;
    if (dets.some(d => d.duplicateError)) return false;
    return dets.every(d =>
      d.color !== null &&
      d.length !== null && d.length > 0 &&
      d.kilo !== null && d.kilo > 0 &&
      d.totalPrice !== null && d.totalPrice > 0,
    );
  });

  // ── Actions ───────────────────────────────────────────────────

  protected close(): void {
    this.sheetRef.dismiss(null);
  }

  protected onSupplierSearch(value: string): void {
    this.supplierSearch.set(value);
    this.selectedSupplierId.set(null);
  }

  protected clearSupplier(): void {
    this.supplierSearch.set('');
    this.selectedSupplierId.set(null);
  }

  protected selectSupplier(id: number, name: string): void {
    this.selectedSupplierId.set(id);
    this.supplierSearch.set(name);
  }

  protected addDetail(): void {
    this.details.update(prev => [...prev, {
      id: crypto.randomUUID(),
      color: null,
      type: 'lisa',
      length: null,
      kilo: null,
      totalPrice: null,
      duplicateError: false,
    }]);
  }

  protected removeDetail(id: string): void {
    this.details.update(prev =>
      this.revalidateDuplicates(prev.filter(d => d.id !== id)),
    );
  }

  protected updateDetail(id: string, patch: Partial<DetailForm>): void {
    this.details.update(prev =>
      this.revalidateDuplicates(prev.map(d => d.id === id ? { ...d, ...patch } : d)),
    );
  }

  // Marks duplicate if another detail shares the same color+type+length
  private revalidateDuplicates(details: DetailForm[]): DetailForm[] {
    return details.map((d, i) => {
      if (d.color === null || d.length === null) return { ...d, duplicateError: false };
      const isDuplicate = details.some((other, j) =>
        j !== i &&
        other.color === d.color &&
        other.type === d.type &&
        other.length === d.length,
      );
      return { ...d, duplicateError: isDuplicate };
    });
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    setTimeout(() => {
      const supplier = this.selectedSupplier()!;
      const now = new Date().toISOString();
      const existing = this.data.purchaseOrder;

      const result: PurchaseOrderFull = {
        id:            existing?.id ?? crypto.randomUUID(),
        number:        existing?.number ?? this.generateNumber(),
        supplierId:    supplier.id,
        supplierName:  supplier.name,
        registeredBy:  this.registeredBy().trim(),
        createdAt:     existing?.createdAt ?? now,
        updatedAt:     now,
        status:        this.status(),
        details:       this.details().map(d => ({
          id:         d.id,
          color:      d.color!,
          type:       d.type,
          length:     d.length!,
          kilo:       d.kilo!,
          totalPrice: d.totalPrice!,
        })),
      };

      this.submitting.set(false);
      this.success.set(true);
      setTimeout(() => this.sheetRef.dismiss(result), 1200);
    }, 600);
  }

  private generateNumber(): string {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
    return `OC-${year}-${seq}`;
  }
}
