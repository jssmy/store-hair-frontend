import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import {
  HAIR_TYPE_LABELS,
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
  HAIR_COLORS,
  HairColor,
  HairType,
} from '../../../features/products/products.data';
import {
  PO_STATUS_LABELS,
  PurchaseOrderDrawerData,
  PurchaseOrderDrawerResult,
  PurchaseOrderStatus,
} from '../../../features/purchase-order/purchase-order.data';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierApiService } from '../../../features/suppliers/supplier-api.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

// ── Constants ─────────────────────────────────────────────────────────

const HAIR_TYPE_OPTIONS: Exclude<HairType, 'todos'>[] = [
  'lisa', 'ondulada', 'rizada', 'cortina', 'extensiones', 'peluca',
];

const isHairColor = (value: string): value is HairColor => value in HAIR_COLOR_HEX;
const isHairTypeOption = (value: string): value is Exclude<HairType, 'todos'> =>
  HAIR_TYPE_OPTIONS.includes(value as Exclude<HairType, 'todos'>);

// ── Types ─────────────────────────────────────────────────────────────

interface DetailForm {
  id: number;
  color: HairColor | null;
  type: Exclude<HairType, 'todos'>;
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
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierApiService);

  protected readonly suppliers = toSignal(this.supplierService.getActiveAll({ page: 1, limit: 100 }).pipe(map(res => res.data)), { initialValue: [] });
  protected readonly hairTypeOptions = HAIR_TYPE_OPTIONS;
  protected readonly hairTypeLabels = HAIR_TYPE_LABELS;
  protected readonly hairColors = HAIR_COLORS;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;
  protected readonly statusOptions = [PurchaseOrderStatus.PENDING, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.CANCELED, PurchaseOrderStatus.COMPLETED];
  protected readonly statusLabels = PO_STATUS_LABELS;
  protected readonly isEdit = !!this.data.purchaseOrder;

  // ── Form state ────────────────────────────────────────────────
  protected readonly supplierSearch = signal(this.data.purchaseOrder?.supplier.name ?? '');
  protected readonly selectedSupplierId = signal<number | null>(this.data.purchaseOrder?.supplier.id ?? null);
  protected readonly status = signal<PurchaseOrderStatus>(this.data.purchaseOrder?.status ?? PurchaseOrderStatus.PENDING);
  protected readonly details = signal<DetailForm[]>(
    (this.data.purchaseOrder?.details ?? []).map(d => ({
      id: d.id,
      color: isHairColor(d.color) ? d.color : null,
      type: isHairTypeOption(d.type) ? d.type : 'lisa',
      length: d.length,
      kilo: d.weight,
      totalPrice: d.price,
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
    return this.suppliers().filter(s => s.name.toLowerCase().includes(q) || s.dni.toLowerCase().includes(q)).slice(0, 5);
  });

  protected readonly selectedSupplier = computed(() =>
    this.suppliers().find(s => s.id === this.selectedSupplierId()) ?? null,
  );

  protected readonly totalKilo = computed(() =>
    this.details().reduce((sum, d) => sum + (d.kilo ?? 0), 0),
  );

  protected readonly totalPrice = computed(() =>
    this.details().reduce((sum, d) => sum + (d.totalPrice ?? 0), 0),
  );

  protected readonly canSubmit = computed(() => {
    if (!this.selectedSupplierId()) return false;

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
      id: 0,
      color: null,
      type: 'lisa',
      length: null,
      kilo: null,
      totalPrice: null,
      duplicateError: false,
    }]);
  }

  protected removeDetail(id: number): void {
    this.details.update(prev =>
      this.revalidateDuplicates(prev.filter(d => d.id !== id)),
    );
  }

  protected updateDetail(id: number, patch: Partial<DetailForm>): void {
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

    const dto = {
      supplierId: this.selectedSupplierId()!,
      details: this.details().map(d => ({
        color:  d.color!,
        type:   d.type,
        length: d.length!,
        weight: d.kilo!,
        price:  d.totalPrice!,
      })),
    };

    this.purchaseOrderService.create(dto).subscribe({
      next: (order) => {
        // const supplier = this.selectedSupplier()!;
        // const result: PurchaseOrderFull = {
        //   id:           String(order.id),
        //   number:       order.oc,
        //   supplierId:   supplier.id,
        //   supplierName: supplier.name,
        //   registeredBy: this.registeredBy().trim(),
        //   createdAt:    order.createdAt.toString(),
        //   updatedAt:    order.updatedAt.toString(),
        //   status:       'pendiente',
        //   details:      this.details().map(d => ({
        //     id:         d.id,
        //     color:      d.color!,
        //     type:       d.type,
        //     length:     d.length!,
        //     kilo:       d.kilo!,
        //     totalPrice: d.totalPrice!,
        //   })),
        // };
        this.submitting.set(false);
        this.success.set(true);
        // setTimeout(() => this.sheetRef.dismiss(result), 1200);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
}
