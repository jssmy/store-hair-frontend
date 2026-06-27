import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormArray, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, forkJoin, map, startWith } from 'rxjs';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import { SearchComponent } from '../search/search.component';
import { SelectComponent, SelectOption } from '../select/select.component';
import { StpNumericDirective } from '../../directives';
import {
  HAIR_TYPE_LABELS,
  HAIR_COLOR_HEX,
  HAIR_COLOR_LABELS,
  HAIR_COLORS,
  HairColor,
  HairType,
  Inventory,
  Lote,
  LoteStatus,
  HAIR_TYPE_OPTIONS,
  HAIR_LENGTH_OPTIONS,
  CreateProductDto,
  CreateProductApiDto,
} from '../../../features/products/products.data';
import { InventoryService } from '../../../core/services/inventory.service';
import { environment } from '../../../../environments/environment';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrderStatus } from '../../../features/purchase-order/purchase-order.data';

// ── Types ────────────────────────────────────────────────────────────

type ProductImage = { file: File | null; dataUrl: string };

type ComplianceAlertType = 'incomplete' | 'over' | 'unexpected';

interface ComplianceAlert {
  alertType: ComplianceAlertType;
  label: string;
  expected: number;
  received: number;
  diff: number;
}

export interface InventoryDrawerData {
  inventory?: Inventory;
  prefilledPoNumber?: string;
}

export type InventoryDrawerResult = Lote;

// ── Component ────────────────────────────────────────────────────────

@Component({
  selector: 'stp-inventory-drawer',
  imports: [ButtonComponent, IconComponent, InputComponent, SearchComponent, SelectComponent, ReactiveFormsModule, StpNumericDirective],
  templateUrl: './inventory-drawer.component.html',
  styleUrl: './inventory-drawer.component.scss',
})
export class InventoryDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<InventoryDrawerComponent, InventoryDrawerResult | null>>(MatBottomSheetRef);
  private readonly data = inject<InventoryDrawerData>(MAT_BOTTOM_SHEET_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly assets = environment.assets;

  protected readonly purchaseOrders = signal<PurchaseOrder[]>([]);
  protected readonly poSearchLoading = signal(false);

  protected readonly productHairTypeSelectOptions: SelectOption[] = HAIR_TYPE_OPTIONS.map(t => ({
    value: t, label: HAIR_TYPE_LABELS[t],
  }));
  protected readonly productHairLengthSelectOptions: SelectOption[] = HAIR_LENGTH_OPTIONS.map(l => ({
    value: l.toString(), label: `${l}`,
  }));
  protected readonly hairColors = HAIR_COLORS;

  /** Colors in the selected PO; all colors when no PO is selected */
  protected readonly poAllowedColors = computed<HairColor[]>(() => {
    const po = this.loteSelectedPO();
    if (!po?.details?.length) return this.hairColors;
    const seen = new Set<HairColor>();
    return po.details.reduce<HairColor[]>((acc, d) => {
      if (!seen.has(d.color)) { seen.add(d.color); acc.push(d.color); }
      return acc;
    }, []);
  });

  /** Types in the selected PO; all types when no PO is selected */
  protected readonly poFilteredTypeOptions = computed<SelectOption[]>(() => {
    const po = this.loteSelectedPO();
    if (!po?.details?.length) return this.productHairTypeSelectOptions;
    const types = new Set(po.details.map(d => String(d.type)));
    return this.productHairTypeSelectOptions.filter(o => types.has(String(o.value)));
  });

  /** Lengths in the selected PO; all lengths when no PO is selected */
  protected readonly poFilteredLengthOptions = computed<SelectOption[]>(() => {
    const po = this.loteSelectedPO();
    if (!po?.details?.length) return this.productHairLengthSelectOptions;
    const lengths = new Set(po.details.map(d => Number(d.length)));
    return this.productHairLengthSelectOptions.filter(o => lengths.has(Number(o.value)));
  });
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;

  protected readonly isEditMode = !!this.data.inventory;
  protected readonly editInventory = this.data.inventory ?? null;
  protected readonly isCompleted = this.data.inventory?.status === LoteStatus.COMPLETED;
  protected readonly isReadOnly = this.data.inventory?.status === LoteStatus.COMPLETED;

  /** IDs que vienen del servidor — se envían en el payload de actualización.
   *  Los productos creados durante la sesión de edición NO estarán aquí. */
  private readonly existingProductIds = new Set<string>(
    this.data.inventory?.products.map(p => String(p.id)) ?? [],
  );

  protected get statusIcon(): string {
    switch (this.editInventory?.status) {
      case LoteStatus.COMPLETED: return 'check-circle';
      default: return 'clock';
    }
  }

  protected get statusLabel(): string {
    switch (this.editInventory?.status) {
      case LoteStatus.COMPLETED: return 'Completado';
      default: return 'Pendiente';
    }
  }

  protected get statusDesc(): string {
    switch (this.editInventory?.status) {
      case 'completed': return 'Este lote fue completado y no puede modificarse.';
      default: return 'Este lote está en proceso. Puedes editarlo y completarlo cuando esté listo.';
    }
  }

  // Images live outside the form — File objects aren't serializable as form values
  private readonly productImages = signal<Map<string, ProductImage[]>>(
    new Map(
      this.data.inventory?.products.map(p => [
        String(p.id),
        (p.imageUrls ?? []).map(url => ({ file: null, dataUrl: `${this.assets}/${url}` })),
      ]) ?? [],
    ),
  );

  // ── Form ─────────────────────────────────────────────────────────

  protected readonly form = this.fb.group({
    poSearch: [this.data.prefilledPoNumber ?? ''],
    products: this.fb.array(
      this.data.inventory?.products.map(p => this.buildProductGroup(p)) ?? [],
    ),
  });

  get productsArray(): FormArray {
    return this.form.controls['products'] as FormArray;
  }

  private buildProductGroup(p?: {
    id?: string | number; po?: string; name?: string; type?: string;
    color?: HairColor | null; weight?: number | null;
    length?: number | null; price?: number | null;
  }): FormGroup {
    return this.fb.group({
      id:     [p?.id != null ? String(p.id) : crypto.randomUUID()],
      po:     [p?.po ?? ''],
      name:   [p?.name ?? ''],
      type:   [p?.type ?? '', Validators.required],
      color:  [p?.color ?? null, Validators.required],
      weight: [p?.weight != null ? String(p.weight) : null, [Validators.required, Validators.min(0.001)]],
      length: [p?.length != null ? String(p.length) : null, Validators.required],
      price:  [p?.price  != null ? String(p.price)  : null, [Validators.required, Validators.min(0.001)]],
    });
  }

  // ── Signals derived from form ─────────────────────────────────────

  protected readonly lotePoSearch = toSignal(
    this.form.controls['poSearch'].valueChanges.pipe(
      startWith(this.data.prefilledPoNumber ?? ''),
      map(v => v ?? ''),
    ),
    { initialValue: this.data.prefilledPoNumber ?? '' },
  );

  private readonly productsValue = toSignal(
    this.productsArray.valueChanges.pipe(startWith(this.productsArray.value)),
    { initialValue: this.productsArray.value },
  );

  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  // ── Detail list / form state ──────────────────────────────────────

  protected readonly editingIdx = signal<number | null>(null);
  protected readonly isAddingNew = signal(false);
  private editSnapshot: Record<string, unknown> | null = null;
  private prevPriceAutofillKey = '';

  // ── PO + submit state ─────────────────────────────────────────────

  protected readonly loteSelectedPO = signal<PurchaseOrder | null>(null);
  protected readonly invSubmitting = signal(false);
  protected readonly invSuccess = signal(false);
  protected readonly markingComplete = signal(false);
  protected readonly completedNow = signal(false);
  protected readonly step = signal<1 | 2>(1);
  protected readonly createdLoteId = signal<number | null>(null);
  protected readonly creatingLote = signal(false);

  // ── Computed ─────────────────────────────────────────────────────

  protected readonly filteredPOs = computed(() => {
    if (!this.lotePoSearch().trim() || this.loteSelectedPO()) return [];
    return this.purchaseOrders();
  });

  protected readonly lotePoNumber = computed(() =>
    this.loteSelectedPO()?.oc ?? this.lotePoSearch().trim(),
  );

  constructor() {
    const poControl = this.form.controls['poSearch'];

    // Limpia la OC seleccionada al instante si el usuario escribe
    poControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loteSelectedPO.set(null));

    // Llama al servicio con debounce de 2 s, enviando search + status aprobado
    poControl.valueChanges.pipe(
      debounceTime(2000),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => {
      const q = term?.trim() ?? '';
      if (!q) {
        this.purchaseOrders.set([]);
        this.poSearchLoading.set(false);
        return;
      }
      this.poSearchLoading.set(true);
      this.purchaseOrderService
        .getAllAproved({ page: 1, limit: 20, search: q, status: PurchaseOrderStatus.APPROVED })
        .pipe(map(res => res.data))
        .subscribe({
          next: orders => { this.purchaseOrders.set(orders); this.poSearchLoading.set(false); },
          error: () => this.poSearchLoading.set(false),
        });
    });

    // Búsqueda inicial si hay un número de OC pre-cargado
    const prefilled = this.data.prefilledPoNumber?.trim();
    if (prefilled) {
      this.poSearchLoading.set(true);
      this.purchaseOrderService
        .getAllAproved({ page: 1, limit: 20, search: prefilled, status: PurchaseOrderStatus.APPROVED })
        .pipe(map(res => res.data))
        .subscribe({
          next: orders => { this.purchaseOrders.set(orders); this.poSearchLoading.set(false); },
          error: () => this.poSearchLoading.set(false),
        });
    }

    // En modo edición, cargar la OC completa via getById
    if (this.isEditMode) {
      const poId = this.data.inventory?.purchaseOrder?.id;
      if (poId != null) {
        this.poSearchLoading.set(true);
        this.purchaseOrderService.getById(poId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: po => {
              this.loteSelectedPO.set(po);
              this.form.controls['poSearch'].setValue(po.oc, { emitEvent: false });
              this.poSearchLoading.set(false);
            },
            error: () => this.poSearchLoading.set(false),
          });
      }
    }

    // Auto-rellena el precio cuando el producto en edición coincide con un detalle de la OC
    effect(() => {
      const idx = this.editingIdx();
      const products = this.productsValue() as Array<Record<string, unknown>>;

      if (idx === null) { this.prevPriceAutofillKey = ''; return; }

      const p = products[idx];
      if (!p) return;

      const type   = String(p['type']   ?? '');
      const color  = String(p['color']  ?? '');
      const length = Number(p['length'] ?? 0);
      if (!type || !color || !length) return;

      const key = `${idx}|${type}|${color}|${length}`;
      if (key === this.prevPriceAutofillKey) return;
      this.prevPriceAutofillKey = key;

      const po = this.loteSelectedPO();
      if (!po?.details?.length) return;

      const match = po.details.find(d =>
        String(d.type) === type && String(d.color) === color && Number(d.length) === length
      );
      if (!match) return;

      this.productsArray.at(idx).patchValue({ price: String(Number(match.price)) }, { emitEvent: false });
    });
  }

  protected readonly loteTotals = computed(() => {
    const products = this.productsValue() as Array<Record<string, unknown>>;
    return {
      count:       products.length,
      totalPrice:  products.reduce((s, p) => s + (Number(p['price']) || 0) * (Number(p['weight']) || 0), 0),
      totalWeight: products.reduce((s, p) => s + (Number(p['weight']) || 0), 0),
    };
  });

  protected readonly canCreateLote = computed(() =>
    !this.isEditMode && this.step() === 1 && !!this.loteSelectedPO()
  );

  protected readonly canSubmitLote = computed(() => {
    if (this.isReadOnly) return false;
    const products = this.productsValue();
    if (products.length === 0) return false;
    if (this.formStatus() !== 'VALID') return false;
    if (!this.isEditMode && this.step() !== 2) return false;
    return true;
  });

  protected readonly complianceAlerts = computed<ComplianceAlert[]>(() => {
    const po = this.loteSelectedPO();
    if (!po?.details?.length) return [];

    const products = this.productsValue() as Array<Record<string, unknown>>;


    const makeKey = (type: string, color: string, length: number) => `${type}|${color}|${length}`;
    const makeLabel = (type: string, color: string, length: number) =>
      `${HAIR_TYPE_LABELS[type as HairType] ?? type} ${HAIR_COLOR_LABELS[color as HairColor] ?? color} ${length} pulgadas`;

    const expectedMap = new Map<string, { label: string; weight: number }>();
    for (const d of po.details) {
      const type = String(d.type ?? '');
      const color = String(d.color ?? '');
      const length = Number(d.length);
      const weight = Number(d.weight);
      const key = makeKey(type, color, length);
      const existing = expectedMap.get(key);
      if (existing) {
        existing.weight += weight;
      } else {
        expectedMap.set(key, { label: makeLabel(type, color, length), weight });
      }
    }

    const receivedMap = new Map<string, number>();
    for (const p of products) {
      const type = String(p['type'] ?? '');
      const color = String(p['color'] ?? '');
      const length = Number(p['length'] ?? 0);
      if (!type || !color || !length) continue;
      const key = makeKey(type, color, length);
      receivedMap.set(key, (receivedMap.get(key) ?? 0) + (Number(p['weight']) || 0));
    }


    const alerts: ComplianceAlert[] = [];

    for (const [key, exp] of expectedMap) {
      const rec = receivedMap.get(key) ?? 0;
      if (rec < exp.weight) {
        alerts.push({ alertType: 'incomplete', label: exp.label, expected: exp.weight, received: rec, diff: exp.weight - rec });
      } else if (rec > exp.weight) {
        alerts.push({ alertType: 'over', label: exp.label, expected: exp.weight, received: rec, diff: rec - exp.weight });
      }
    }

    for (const [key, rec] of receivedMap) {
      if (!expectedMap.has(key)) {
        const p = products.find(prod =>
          makeKey(String(prod['type'] ?? ''), String(prod['color'] ?? ''), Number(prod['length'] ?? 0)) === key
        );
        if (p) {
          const label = makeLabel(String(p['type'] ?? ''), String(p['color'] ?? ''), Number(p['length'] ?? 0));
          alerts.push({ alertType: 'unexpected', label, expected: 0, received: rec, diff: rec });
        }
      }
    }

    return alerts;
  });

  // ── Helpers ──────────────────────────────────────────────────────

  protected asGroup(ctrl: unknown): FormGroup { return ctrl as FormGroup; }

  protected getProductImages(id: string): ProductImage[] {
    return this.productImages().get(id) ?? [];
  }

  protected colorLabel(color: unknown): string {
    return color ? (this.hairColorLabels[color as HairColor] ?? '') : '';
  }

  protected colorHex(color: unknown): string {
    return color ? (this.hairColorHex[color as HairColor] ?? '') : '';
  }

  protected typeLabel(type: unknown): string {
    return HAIR_TYPE_LABELS[type as HairType] ?? String(type ?? '');
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'short' });
  }

  protected complianceIcon(type: ComplianceAlertType): string {
    if (type === 'incomplete') return 'warning';
    if (type === 'over') return 'arrow-up';
    return 'prohibit';
  }

  protected productTotal(price: unknown, weight: unknown): string {
    return ((Number(price) || 0) * (Number(weight) || 0)).toFixed(2);
  }

  protected complianceMessage(alert: ComplianceAlert): string {
    if (alert.alertType === 'incomplete') {
      return `Esperado ${alert.expected} g · Recibido ${alert.received} g · Faltan ${alert.diff} g`;
    }
    if (alert.alertType === 'over') {
      return `Esperado ${alert.expected} g · Recibido ${alert.received} g · Excede ${alert.diff} g`;
    }
    return `${alert.received} g recibidos · No corresponde a ningún ítem de la OC`;
  }

  protected close(): void { this.sheetRef.dismiss(null); }

  // ── PO search actions ─────────────────────────────────────────────

  protected clearPOSelection(): void { this.loteSelectedPO.set(null); }

  protected clearPoSearch(): void {
    this.form.controls['poSearch'].setValue('');
    this.loteSelectedPO.set(null);
    this.purchaseOrders.set([]);
  }

  protected selectPO(po: PurchaseOrder): void {
    this.loteSelectedPO.set(po);
    this.purchaseOrders.set([]);
    // emitEvent: false evita disparar valueChanges (y la búsqueda con debounce)
    this.form.controls['poSearch'].setValue(po.oc, { emitEvent: false });
  }

  // ── Detail list actions ───────────────────────────────────────────

  protected startAdd(): void {
    if (!this.isEditMode && !this.loteSelectedPO()) return;
    const id = crypto.randomUUID();
    const defaultColor  = this.poAllowedColors()[0] ?? null;
    const defaultType   = String(this.poFilteredTypeOptions()[0]?.value  ?? '');
    const defaultLength = this.poFilteredLengthOptions()[0]?.value != null
      ? Number(this.poFilteredLengthOptions()[0].value) : null;
    this.productsArray.push(this.buildProductGroup({ id, color: defaultColor, type: defaultType, length: defaultLength }));
    this.productImages.update(m => new Map(m).set(id, []));
    this.editingIdx.set(this.productsArray.length - 1);
    this.isAddingNew.set(true);
    this.editSnapshot = null;
  }

  protected startEdit(idx: number): void {
    this.editSnapshot = { ...this.productsArray.at(idx).value } as Record<string, unknown>;
    this.editingIdx.set(idx);
    this.isAddingNew.set(false);
  }

  protected confirmEdit(): void {
    const idx = this.editingIdx();
    if (idx !== null) this.productsArray.at(idx).markAllAsTouched();
    this.editingIdx.set(null);
    this.isAddingNew.set(false);
    this.editSnapshot = null;
  }

  protected cancelEdit(): void {
    const idx = this.editingIdx();
    if (idx === null) return;
    if (this.isAddingNew()) {
      const id = (this.productsArray.at(idx).value as Record<string, unknown>)['id'] as string;
      this.productsArray.removeAt(idx);
      this.productImages.update(m => { const n = new Map(m); n.delete(id); return n; });
    } else if (this.editSnapshot) {
      this.productsArray.at(idx).patchValue(this.editSnapshot);
    }
    this.editingIdx.set(null);
    this.isAddingNew.set(false);
    this.editSnapshot = null;
  }

  protected removeProduct(idx: number): void {
    const id = (this.productsArray.at(idx).value as Record<string, unknown>)['id'] as string;
    this.productsArray.removeAt(idx);
    this.productImages.update(m => { const n = new Map(m); n.delete(id); return n; });

    const edit = this.editingIdx();
    if (edit !== null) {
      if (edit === idx) { this.editingIdx.set(null); this.isAddingNew.set(false); }
      else if (edit > idx) this.editingIdx.set(edit - 1);
    }
  }

  protected patchProductColor(idx: number, color: HairColor): void {
    this.productsArray.at(idx).patchValue({ color });
  }

  protected addImages(productId: string, files: FileList | null): void {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.productImages.update(m => {
          const n = new Map(m);
          n.set(productId, [...(n.get(productId) ?? []), { file, dataUrl }]);
          return n;
        });
      };
      reader.readAsDataURL(file);
    });
  }

  protected productControlErrorMessage(index: number, field: 'weight' | 'length' | 'price'): string {
    const control = this.productsArray.at(index).get(field);
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';

    if (control.hasError('required')) {
      if (field === 'weight') return 'El peso es obligatorio.';
      if (field === 'length') return 'El largo es obligatorio.';
      return 'El precio es obligatorio.';
    }
    if (control.hasError('min')) {
      if (field === 'weight') return 'El peso debe ser mayor a 0.';
      if (field === 'length') return 'El largo debe ser mayor a 0.';
      return 'El precio debe ser mayor a 0.';
    }
    return 'Valor no válido.';
  }

  protected removeImage(productId: string, imgIdx: number): void {
    this.productImages.update(m => {
      const n = new Map(m);
      n.set(productId, (n.get(productId) ?? []).filter((_, i) => i !== imgIdx));
      return n;
    });
  }

  // ── Submit ───────────────────────────────────────────────────────

  protected createLoteStep1(): void {
    const po = this.loteSelectedPO();
    if (!po) return;
    this.creatingLote.set(true);
    this.inventoryService.create({ purchaseOrderId: po.id }).subscribe({
      next: (lote) => {
        this.createdLoteId.set(lote.id);
        this.creatingLote.set(false);
        this.step.set(2);
      },
      error: () => this.creatingLote.set(false),
    });
  }

  protected markAsCompleted(): void {
    if (!this.editInventory) return;
    this.markingComplete.set(true);
    this.inventoryService.updateStatus(this.editInventory.id, LoteStatus.COMPLETED).subscribe({
      next: () => {
        this.markingComplete.set(false);
        this.completedNow.set(true);
        this.invSuccess.set(true);
        setTimeout(() => this.sheetRef.dismiss(null), 1200);
      },
      error: () => { this.markingComplete.set(false); },
    });
  }

  protected submitLote(): void {
    if (!this.canSubmitLote()) return;
    this.form.markAllAsTouched();
    this.invSubmitting.set(true);

    type RawProduct = { id: string; name: string; type: string; color: HairColor; weight: string; length: string; price: string };
    const rawProducts = this.productsArray.value as RawProduct[];

    const products: CreateProductDto[] = rawProducts.map(p => ({
      // Incluir id solo si el producto ya existía en el servidor;
      // los productos nuevos agregados en esta sesión van sin id.
      ...(this.existingProductIds.has(p.id) ? { id: p.id } : {}),
      type:   p.type,
      color:  p.color,
      price:  Number(p.price),
      length: Number(p.length),
      weight: Number(p.weight),
      images: (this.productImages().get(p.id) ?? []).map(img => img.dataUrl),
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

    const loteId = this.createdLoteId()!;
    const requests = rawProducts.map(p =>
      this.inventoryService.createProduct({
        loteId,
        type:   p.type,
        color:  p.color,
        price:  Number(p.price),
        length: Number(p.length),
        weight: Number(p.weight),
        images: (this.productImages().get(p.id) ?? []).map(img => img.dataUrl),
      } satisfies CreateProductApiDto)
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.invSubmitting.set(false);
        this.invSuccess.set(true);
        setTimeout(() => this.sheetRef.dismiss(null), 1200);
      },
      error: () => { this.invSubmitting.set(false); },
    });
  }
}
