import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormArray, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
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
  LoteProduct,
  HAIR_TYPE_OPTIONS,
  HAIR_LENGTH_OPTIONS,
  CreateProductDto,
} from '../../../features/products/products.data';
import { InventoryService } from '../../../core/services/inventory.service';
import { environment } from '../../../../environments/environment';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrderStatus } from '../../../features/purchase-order/purchase-order.data';

// ── Types ────────────────────────────────────────────────────────────

type ProductImage = { file: File | null; dataUrl: string };

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
  protected readonly hairColorLabels = HAIR_COLOR_LABELS;
  protected readonly hairColorHex = HAIR_COLOR_HEX;

  protected readonly isEditMode = !!this.data.inventory;
  protected readonly editInventory = this.data.inventory ?? null;

  // Images live outside the form — File objects aren't serializable as form values
  private readonly productImages = signal<Map<string, ProductImage[]>>(
    new Map(
      this.data.inventory?.products.map(p => [
        p.id,
        p.imageUrls.map(url => ({ file: null, dataUrl: `${this.assets}/${url}` })),
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
    id?: string; name?: string; type?: string;
    color?: HairColor | null; weight?: number | null;
    length?: number | null; price?: number | null;
  }): FormGroup {
    return this.fb.group({
      id:     [p?.id ?? crypto.randomUUID()],
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

  // ── PO + submit state ─────────────────────────────────────────────

  protected readonly loteSelectedPO = signal<PurchaseOrder | null>(null);
  protected readonly invSubmitting = signal(false);
  protected readonly invSuccess = signal(false);

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
  }

  protected readonly loteTotals = computed(() => {
    const products = this.productsValue() as Array<Record<string, unknown>>;
    return {
      count:       products.length,
      totalPrice:  products.reduce((s, p) => s + (Number(p['price'])  || 0), 0),
      totalWeight: products.reduce((s, p) => s + (Number(p['weight']) || 0), 0),
    };
  });

  protected readonly canSubmitLote = computed(() => {
    const products = this.productsValue();
    if (products.length === 0) return false;
    if (this.formStatus() !== 'VALID') return false;
    if (!this.isEditMode && !this.loteSelectedPO()) return false;
    return true;
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
    const id = crypto.randomUUID();
    this.productsArray.push(this.buildProductGroup({ id }));
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

  protected submitLote(): void {
    if (!this.canSubmitLote()) return;
    this.form.markAllAsTouched();
    this.invSubmitting.set(true);

    type RawProduct = { id: string; name: string; type: string; color: HairColor; weight: string; length: string; price: string };
    const rawProducts = this.productsArray.value as RawProduct[];

    const products: CreateProductDto[] = rawProducts.map(p => ({
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

    const po = this.loteSelectedPO()!;
    const loteProducts: LoteProduct[] = rawProducts.map(p => ({
      id:     p.id,
      name:   p.name.trim(),
      type:   p.type,
      color:  p.color,
      weight: Number(p.weight),
      length: Number(p.length),
      price:  Number(p.price),
      images: (this.productImages().get(p.id) ?? []).map(img => img.dataUrl),
    }));

    const result: Lote = {
      purchaseOrderNumber: po.oc,
      registeredBy:        'Usuario Actual',
      registeredAt:        new Date().toISOString(),
      supplierId:          po.supplier.id,
      supplierName:        po.supplier.fullName || po.supplier.businessName || '',
      products:            loteProducts,
    };

    this.inventoryService.create(
      { purchaseOrderId: po.id, products }
    ).subscribe({
      next: () => {
        this.invSubmitting.set(false);
        this.invSuccess.set(true);
        setTimeout(() => this.sheetRef.dismiss(result), 1200);
      },
      error: () => { this.invSubmitting.set(false); },
    });
  }
}
