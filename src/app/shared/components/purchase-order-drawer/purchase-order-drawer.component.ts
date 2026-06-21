import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { debounceTime, map, startWith } from 'rxjs';
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
  HAIR_TYPE_OPTIONS,
  HAIR_LENGTH_OPTIONS,
} from '../../../features/products/products.data';
import {
  PO_STATUS_LABELS,
  PurchaseOrderDrawerData,
  PurchaseOrderDrawerResult,
  PurchaseOrderStatus,
} from '../../../features/purchase-order/purchase-order.data';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierApiService } from '../../../features/suppliers/supplier-api.service';
import { Supplier as SupplierData, SupplierType } from '../../../features/suppliers/suppliers.data';
import { StpNumericDirective } from "../../directives";

// ── Constants ─────────────────────────────────────────────────────────



const isHairColor = (v: string): v is HairColor => v in HAIR_COLOR_HEX;
const isHairTypeOption = (v: string): v is Exclude<HairType, 'todos'> =>
  HAIR_TYPE_OPTIONS.includes(v as Exclude<HairType, 'todos'>);

// ── Component ─────────────────────────────────────────────────────────

@Component({
  selector: 'stp-purchase-order-drawer',
  imports: [ButtonComponent, IconComponent, SearchComponent, SelectComponent, InputComponent, ReactiveFormsModule, StpNumericDirective],
  templateUrl: './purchase-order-drawer.component.html',
  styleUrls: ['./purchase-order-drawer.component.scss'],
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
  protected readonly hairTypeLabels = HAIR_TYPE_LABELS;
  protected readonly statusLabels = PO_STATUS_LABELS;
  protected readonly PurchaseOrderStatus = PurchaseOrderStatus;
  protected readonly isEdit = !!this.data.purchaseOrder;
  protected readonly editSupplier = this.data.purchaseOrder?.supplier ?? null;
  protected readonly orderStatus = this.data.purchaseOrder?.status ?? null;
  protected readonly isApproved = this.orderStatus === PurchaseOrderStatus.APPROVED;
  protected readonly isCanceled = this.orderStatus === PurchaseOrderStatus.CANCELED;
  protected readonly isReadOnly = this.isApproved || this.isCanceled;
  protected readonly orderOc = this.data.purchaseOrder?.oc ?? null;

  protected get statusDescription(): string {
    switch (this.orderStatus) {
      case PurchaseOrderStatus.PENDING:   return 'Esperando revisión y aprobación';
      case PurchaseOrderStatus.APPROVED:  return 'Aprobada · No puede modificarse';
      case PurchaseOrderStatus.CANCELED:  return 'Esta orden fue cancelada';
      case PurchaseOrderStatus.COMPLETED: return 'Completada exitosamente';
      default: return '';
    }
  }

  protected get statusIcon(): string {
    switch (this.orderStatus) {
      case PurchaseOrderStatus.APPROVED:  return 'check-circle';
      case PurchaseOrderStatus.CANCELED:  return 'x-circle';
      case PurchaseOrderStatus.COMPLETED: return 'check-square';
      default: return 'clock';
    }
  }

  protected readonly hairTypeSelectOptions: SelectOption[] = HAIR_TYPE_OPTIONS.map(t => ({
    value: t, label: HAIR_TYPE_LABELS[t],
  }));

  protected readonly hairLengthSelectOptions: SelectOption[] = HAIR_LENGTH_OPTIONS.map(l => ({
    value: l.toString(), label: `${l}`,
  }));

  // ── Form ──────────────────────────────────────────────────────

  readonly form = this.fb.group({
    supplierId: this.fb.control<number | null>(this.data.purchaseOrder?.supplier.id ?? null, Validators.required),
    supplierSearch: this.fb.control(this.data.purchaseOrder?.supplier.fullName || this.data.purchaseOrder?.supplier.businessName || ''),
    tcUsd: this.fb.control(
      this.data.purchaseOrder?.tc_usd?.toString()
      ?? this.data.purchaseOrder?.exchangeRate?.toString()
      ?? '',
    ),
    tcConvertedValue: this.fb.control(
      this.data.purchaseOrder?.tc_converted_value?.toString() ?? '',
    ),
    details: this.fb.array(
      (this.data.purchaseOrder?.details ?? []).map(d => this.buildDetail({
        id: d.id,
        color: isHairColor(d.color) ? d.color : null,
        type: isHairTypeOption(d.type) ? d.type : 'golden',
        length: d.length ?? 18,
        kilo: d.weight,
        pricePerGram: d.price,
      })),
    ),
  });

  get detailsArray() { return this.form.controls.details; }

  private buildDetail(data?: {
    id?: number; color?: HairColor | null; type?: HairType;
    length?: number | null; kilo?: number | null; pricePerGram?: number | null;
  }) {
    return this.fb.group({
      id: this.fb.control(data?.id ?? 0),
      color: this.fb.control<HairColor | null>(data?.color ?? null, Validators.required),
      type: this.fb.control<HairType>(data?.type ?? 'golden', Validators.required),
      length: this.fb.control(data?.length?.toString() ?? '18', Validators.required),
      kilo: this.fb.control(data?.kilo?.toString() ?? '', [Validators.required, Validators.min(0.001)]),
      pricePerGram: this.fb.control(data?.pricePerGram?.toString() ?? '', [Validators.required, Validators.min(0.001)]),
    });
  }

  // ── Submit / UI state ─────────────────────────────────────────

  protected readonly submitting = signal(false);
  protected readonly approving = signal(false);
  protected readonly canceling = signal(false);
  protected readonly success = signal(false);
  protected readonly duplicateIndexes = signal(new Set<number>());

  // ── Detail list / form state ──────────────────────────────────

  protected readonly editingIdx = signal<number | null>(null);
  protected readonly isAddingNew = signal<boolean>(false);
  private editSnapshot: Record<string, unknown> | null = null;

  // ── Computed from form ────────────────────────────────────────

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  protected readonly supplierCurrencyName = computed(() => {
    if (this.isEdit) {
      return this.editSupplier?.country?.currencyName
        ?? this.data.purchaseOrder?.exchangeCurrency
        ?? null;
    }
    return this.selectedSupplier()?.country?.currencyName ?? null;
  });

  protected readonly supplierCurrencyCode = computed(() => {
    if (this.isEdit) {
      return this.editSupplier?.country?.currency
        ?? this.data.purchaseOrder?.tc_converted_currency
        ?? null;
    }
    return this.selectedSupplier()?.country?.currency ?? null;
  });

  // totalPrice() is the COP total (prices are entered in COP)
  protected readonly totalUSD = computed(() => {
    const rate = +(this.formValue().tcUsd ?? 0);
    if (!rate) return 0;
    return this.totalPrice() / rate;
  });

  protected readonly totalConverted = computed(() => {
    return this.totalUSD() * (+(this.formValue().tcConvertedValue ?? 0) || 0);
  });


  protected readonly filteredSuppliers = computed(() => {
    const v = this.formValue();
    const q = (v.supplierSearch ?? '').trim().toLowerCase();
    if (!q || v.supplierId != null) return [];
    return this.suppliers()
      .filter(s => this.supplierDisplayName(s).toLowerCase().includes(q) || (s.ruc ?? s.dni ?? '').toLowerCase().includes(q))
      .slice(0, 5);
  });

  protected readonly selectedSupplier = computed(() =>
    this.suppliers().find(s => s.id === this.formValue().supplierId) ?? null,
  );

  protected readonly showSupplierNotFound = computed(() => {
    const v = this.formValue();
    return !v.supplierId && !!(v.supplierSearch ?? '').trim() && this.filteredSuppliers().length === 0;
  });

  protected readonly totalWeight = computed(() =>
    (this.formValue().details ?? []).reduce((sum, d) => sum + (+(d?.kilo ?? 0) || 0), 0),
  );

  protected readonly totalPrice = computed(() =>
    (this.formValue().details ?? []).reduce(
      (sum, d) => sum + (+(d?.kilo ?? 0) * +(d?.pricePerGram ?? 0) || 0), 0,
    ),
  );

  protected readonly canSubmit = computed(() => {
    if (this.isReadOnly) return false;
    if (!this.formValue().supplierId) return false;
    const hasDetails = (this.formValue().details ?? []).length > 0;
    if (!hasDetails) return false;
    if (this.duplicateIndexes().size > 0) return false;
    if (!(+(this.formValue().tcUsd ?? 0) > 0)) return false;
    return this.formStatus() === 'VALID';
  });

  constructor() {
    if (this.isReadOnly) this.form.disable();

    // Clear supplierId only when the typed text no longer matches the selected supplier
    this.form.controls.supplierSearch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        const supplierId = this.form.controls.supplierId.value;
        if (supplierId == null) return;

        const selected = this.suppliers().find(s => s.id === supplierId);
        const selectedName = selected ? this.supplierDisplayName(selected) : '';
        if ((query ?? '') !== selectedName) {
          this.form.controls.supplierId.setValue(null);
        }
      });

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

  protected startAdd(): void {
    this.detailsArray.push(this.buildDetail());
    this.editingIdx.set(this.detailsArray.length - 1);
    this.isAddingNew.set(true);
    this.editSnapshot = null;
  }

  protected startEdit(idx: number): void {
    this.editSnapshot = { ...this.detailsArray.at(idx).value } as Record<string, unknown>;
    this.editingIdx.set(idx);
    this.isAddingNew.set(false);
  }

  protected confirmEdit(): void {
    const idx = this.editingIdx();
    if (idx !== null) this.detailsArray.at(idx).markAllAsTouched();
    this.editingIdx.set(null);
    this.isAddingNew.set(false);
    this.editSnapshot = null;
  }

  protected cancelEdit(): void {
    const idx = this.editingIdx();
    if (idx === null) return;
    if (this.isAddingNew()) {
      this.detailsArray.removeAt(idx);
    } else if (this.editSnapshot) {
      this.detailsArray.at(idx).patchValue(this.editSnapshot);
    }
    this.editingIdx.set(null);
    this.isAddingNew.set(false);
    this.editSnapshot = null;
    this.revalidateDuplicates();
  }

  protected removeDetail(index: number): void {
    this.detailsArray.removeAt(index);
    this.revalidateDuplicates();

    const edit = this.editingIdx();
    if (edit !== null) {
      if (edit === index) { this.editingIdx.set(null); this.isAddingNew.set(false); }
      else if (edit > index) this.editingIdx.set(edit - 1);
    }
  }

  protected supplierDisplayName(s: SupplierData): string {
    return s.type === SupplierType.NATURAL ? (s.fullName ?? '') : (s.businessName ?? '');
  }

  protected colorLabel(color: HairColor | null | undefined): string {
    return color ? this.hairColorLabels[color] : '';
  }

  protected hairTypeLabel(type: string): string {
    return this.hairTypeLabels[type as keyof typeof this.hairTypeLabels] ?? type;
  }

  protected updateColor(index: number, color: HairColor): void {
    this.detailsArray.at(index).patchValue({ color });
  }

  protected detailControlErrorMessage(index: number, controlName: 'length' | 'kilo' | 'pricePerGram'): string {
    const control = this.detailsArray.at(index).get(controlName);
    if (!control || !(control.touched || control.dirty)) return '';
    return this.getControlErrorMessage(control, controlName);
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
        +other.value.length! === +(d.length ?? 0),
      );
      if (isDuplicate) next.add(i);
    });
    this.duplicateIndexes.set(next);
  }


  private getControlErrorMessage(
    control: AbstractControl,
    controlName: 'length' | 'kilo' | 'pricePerGram',
  ): string {

    if (!control.errors) return '';

    if (control.hasError('required')) {
      if (controlName === 'length') return 'El largo es obligatorio.';
      if (controlName === 'kilo') return 'El peso es obligatorio.';
      return 'El precio por gramo es obligatorio.';
    }

    if (control.hasError('min')) {
      if (controlName === 'length') return 'El largo debe ser mayor o igual a 1.';
      if (controlName === 'kilo') return 'El peso debe ser mayor o igual a 0.001.';
      return 'El precio por gramo debe ser mayor o igual a 0.001.';
    }

    return 'Valor no valido.';
  }

  protected approveOrder(): void {
    if (this.approving() || !this.data.purchaseOrder) return;
    this.approving.set(true);
    this.purchaseOrderService.updateStatus(this.data.purchaseOrder.id, PurchaseOrderStatus.APPROVED)
      .subscribe({
        next: result => { this.approving.set(false); this.sheetRef.dismiss(result); },
        error: () => this.approving.set(false),
      });
  }

  protected cancelOrder(): void {
    if (this.canceling() || !this.data.purchaseOrder) return;
    this.canceling.set(true);
    this.purchaseOrderService.updateStatus(this.data.purchaseOrder.id, PurchaseOrderStatus.CANCELED)
      .subscribe({
        next: result => { this.canceling.set(false); this.sheetRef.dismiss(result); },
        error: () => this.canceling.set(false),
      });
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    const currencyCode = this.supplierCurrencyCode();
    const tcUsdVal = +(this.form.value.tcUsd ?? 0) || undefined;
    const tcConvertedValueVal = +(this.form.value.tcConvertedValue ?? 0) || undefined;

    const dto = {
      supplierId: this.form.value.supplierId!,
      details: this.detailsArray.controls.map(ctrl => ({
        color: ctrl.value.color!,
        type: ctrl.value.type!,
        length: +ctrl.value.length!,
        weight: +ctrl.value.kilo!,
        price: +ctrl.value.pricePerGram!,
      })),
      ...(tcUsdVal && { tc_usd: tcUsdVal }),
      ...(currencyCode && { tc_converted_currency: currencyCode }),
      ...(tcConvertedValueVal && { tc_converted_value: tcConvertedValueVal }),
    };

    const request$ = this.isEdit
      ? this.purchaseOrderService.update(this.data.purchaseOrder!.id, dto)
      : this.purchaseOrderService.create(dto);

    request$.subscribe({
      next: () => { this.submitting.set(false); this.success.set(true); },
      error: () => { this.submitting.set(false); },
    });
  }
}
