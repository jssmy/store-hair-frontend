import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { debounceTime, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { SearchComponent } from '../search/search.component';
import { SelectComponent, SelectOption } from '../select/select.component';
import { InputComponent } from '../input/input.component';
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

// ── Constants ─────────────────────────────────────────────────────────

const HAIR_TYPE_OPTIONS: Exclude<HairType, 'todos'>[] = [
  'lisa', 'ondulada', 'rizada', 'cortina', 'extensiones', 'peluca',
];

const isHairColor = (v: string): v is HairColor => v in HAIR_COLOR_HEX;
const isHairTypeOption = (v: string): v is Exclude<HairType, 'todos'> =>
  HAIR_TYPE_OPTIONS.includes(v as Exclude<HairType, 'todos'>);

// ── Component ─────────────────────────────────────────────────────────

@Component({
  selector: 'stp-purchase-order-drawer',
  imports: [ButtonComponent, IconComponent, SearchComponent, SelectComponent, InputComponent, ReactiveFormsModule],
  templateUrl: './purchase-order-drawer.component.html',
  styleUrl: './purchase-order-drawer.component.scss',
})
export class PurchaseOrderDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<PurchaseOrderDrawerComponent, PurchaseOrderDrawerResult | null>>(MatBottomSheetRef);
  private readonly data = inject<PurchaseOrderDrawerData>(MAT_BOTTOM_SHEET_DATA);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly suppliers = toSignal(
    this.supplierService.getActiveAll({ page: 1, limit: 100 }).pipe(map(res => res.data)),
    { initialValue: [] },
  );
  protected readonly hairColors = HAIR_COLORS;
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;
  protected readonly statusOptions = [
    PurchaseOrderStatus.PENDING, PurchaseOrderStatus.APPROVED,
    PurchaseOrderStatus.CANCELED, PurchaseOrderStatus.COMPLETED,
  ];
  protected readonly statusLabels = PO_STATUS_LABELS;
  protected readonly isEdit = !!this.data.purchaseOrder;
  protected readonly hairTypeSelectOptions: SelectOption[] = HAIR_TYPE_OPTIONS.map(t => ({
    value: t, label: HAIR_TYPE_LABELS[t],
  }));

  // ── Form ──────────────────────────────────────────────────────

  readonly form = this.fb.group({
    supplierId: this.fb.control<number | null>(this.data.purchaseOrder?.supplier.id ?? null),
    supplierSearch: [this.data.purchaseOrder?.supplier.name ?? ''],
    details: this.fb.array(
      (this.data.purchaseOrder?.details ?? []).map(d => this.buildDetail({
        id: d.id,
        color: isHairColor(d.color) ? d.color : null,
        type: isHairTypeOption(d.type) ? d.type : 'lisa',
        length: d.length,
        kilo: d.weight,
        totalPrice: d.price,
      })),
    ),
  });

  get detailsArray() { return this.form.controls.details; }

  private buildDetail(data?: {
    id?: number; color?: HairColor | null; type?: string;
    length?: number | null; kilo?: number | null; totalPrice?: number | null;
  }) {
    return this.fb.group({
      id:         [data?.id ?? 0],
      color:      this.fb.control<HairColor | null>(data?.color ?? null),
      type:       [data?.type ?? 'lisa'],
      length:     [data?.length?.toString() ?? ''],
      kilo:       [data?.kilo?.toString() ?? ''],
      totalPrice: [data?.totalPrice?.toString() ?? ''],
    });
  }

  // ── Submit / UI state ─────────────────────────────────────────

  protected readonly submitting = signal(false);
  protected readonly success = signal(false);
  protected readonly duplicateIndexes = signal(new Set<number>());

  // ── Computed from form ────────────────────────────────────────

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly filteredSuppliers = computed(() => {
    const v = this.formValue();
    const q = (v.supplierSearch ?? '').trim().toLowerCase();
    if (!q || v.supplierId != null) return [];
    return this.suppliers()
      .filter(s => s.name.toLowerCase().includes(q) || s.dni.toLowerCase().includes(q))
      .slice(0, 5);
  });

  protected readonly selectedSupplier = computed(() =>
    this.suppliers().find(s => s.id === this.formValue().supplierId) ?? null,
  );

  protected readonly showSupplierNotFound = computed(() => {
    const v = this.formValue();
    return !v.supplierId && !!(v.supplierSearch ?? '').trim() && this.filteredSuppliers().length === 0;
  });

  protected readonly totalKilo = computed(() =>
    (this.formValue().details ?? []).reduce((sum, d) => sum + (+(d?.kilo ?? 0) || 0), 0),
  );

  protected readonly totalPrice = computed(() =>
    (this.formValue().details ?? []).reduce((sum, d) => sum + (+(d?.totalPrice ?? 0) || 0), 0),
  );

  protected readonly canSubmit = computed(() => {
    const v = this.formValue();
    if (!v.supplierId) return false;
    const details = v.details ?? [];
    if (details.length === 0) return false;
    if (this.duplicateIndexes().size > 0) return false;
    return details.every(d =>
      d?.color !== null &&
      +(d?.length ?? 0) > 0 &&
      +(d?.kilo ?? 0) > 0 &&
      +(d?.totalPrice ?? 0) > 0,
    );
  });

  constructor() {
    // Clear supplierId whenever user types in the search field
    this.form.controls.supplierSearch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.form.controls.supplierId.setValue(null, { emitEvent: false }),
      );

    // Revalidate duplicate combos when any detail changes
    this.form.controls.details.valueChanges
      .pipe(debounceTime(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.revalidateDuplicates());
  }

  // ── Actions ───────────────────────────────────────────────────

  protected close(): void { this.sheetRef.dismiss(null); }

  protected selectSupplier(id: number, name: string): void {
    this.form.patchValue({ supplierId: id, supplierSearch: name });
  }

  protected clearSupplier(): void {
    this.form.patchValue({ supplierId: null, supplierSearch: '' });
  }

  protected addDetail(): void {
    this.detailsArray.push(this.buildDetail());
  }

  protected removeDetail(index: number): void {
    this.detailsArray.removeAt(index);
    this.revalidateDuplicates();
  }

  protected colorLabel(color: HairColor | null | undefined): string {
    return color ? this.hairColorLabels[color] : '';
  }

  protected updateColor(index: number, color: HairColor): void {
    this.detailsArray.at(index).patchValue({ color });
  }

  private revalidateDuplicates(): void {
    const controls = this.detailsArray.controls;
    const next = new Set<number>();
    controls.forEach((ctrl, i) => {
      const d = ctrl.value;
      if (!d.color || !d.length) return;
      const isDuplicate = controls.some((other, j) =>
        j !== i &&
        other.value.color === d.color &&
        other.value.type === d.type &&
        +other.value.length! === +d.length,
      );
      if (isDuplicate) next.add(i);
    });
    this.duplicateIndexes.set(next);
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    const dto = {
      supplierId: this.form.value.supplierId!,
      details: this.detailsArray.controls.map(ctrl => ({
        color:  ctrl.value.color!,
        type:   ctrl.value.type!,
        length: +ctrl.value.length!,
        weight: +ctrl.value.kilo!,
        price:  +ctrl.value.totalPrice!,
      })),
    };

    this.purchaseOrderService.create(dto).subscribe({
      next: () => { this.submitting.set(false); this.success.set(true); },
      error: () => { this.submitting.set(false); },
    });
  }
}
