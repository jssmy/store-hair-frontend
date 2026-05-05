import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import { AlertComponent } from '../alert/alert.component';
import { TabsComponent, TabItem } from '../tabs/tabs.component';
import {
  Supplier,
  SupplierType,
} from '../../../features/suppliers/suppliers.data';
import { CreateSupplierDto, SupplierApiService } from '../../../features/suppliers/supplier-api.service';

export interface SupplierDrawerData {
  supplier?: Supplier | null;
}

@Component({
  selector: 'stp-supplier-drawer',
  imports: [ButtonComponent, IconComponent, InputComponent, AlertComponent, TabsComponent, ReactiveFormsModule],
  templateUrl: './supplier-drawer.component.html',
  styleUrl: './supplier-drawer.component.scss',
})
export class SupplierDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<SupplierDrawerComponent, boolean>>(MatBottomSheetRef);
  private readonly data = inject<SupplierDrawerData>(MAT_BOTTOM_SHEET_DATA);
  private readonly supplierApi = inject(SupplierApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly editing: Supplier | null = this.data.supplier ?? null;
  protected readonly SupplierType = SupplierType;

  protected readonly typeTabs: TabItem[] = [
    { value: SupplierType.NATURAL, label: 'Persona natural' },
    { value: SupplierType.JURIDICA, label: 'Persona jurídica' },
  ];

  protected readonly form: FormGroup;
  protected readonly submitting = signal(false);
  protected readonly success = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected readonly title = this.editing ? 'Editar proveedor' : 'Nuevo proveedor';
  protected readonly submitLabel = this.editing ? 'Guardar cambios' : 'Registrar proveedor';

  constructor() {
    const e = this.editing;
    const initialType = e?.type ?? SupplierType.NATURAL;

    this.form = this.fb.group({
      type:             new FormControl(initialType),
      fullName:         new FormControl(e?.fullName ?? ''),
      dni:              new FormControl(e?.dni ?? ''),
      businessName:     new FormControl(e?.businessName ?? ''),
      ruc:              new FormControl(e?.ruc ?? ''),
      contactFullName:  new FormControl(e?.contactFullName ?? ''),
      contactDni:       new FormControl(e?.contactDni ?? ''),
      phone:            new FormControl(e?.phone ?? '',   [Validators.required, Validators.pattern(/^\d{6,14}$/)]),
      email:            new FormControl(e?.email ?? '',   [Validators.required, Validators.email]),
      address:          new FormControl(e?.address ?? '', [Validators.required]),
    });

    this.applyTypeValidators(initialType);
  }

  protected get isNatural(): boolean {
    return this.form.get('type')!.value === SupplierType.NATURAL;
  }

  protected get canSubmit(): boolean {
    return this.form.valid;
  }

  protected setType(type: string): void {
    this.apiError.set(null);
    this.form.patchValue({ type });
    this.applyTypeValidators(type as SupplierType);
  }

  protected close(): void {
    this.sheetRef.dismiss(false);
  }

  protected submit(): void {
    if (!this.canSubmit) return;
    this.submitting.set(true);
    this.apiError.set(null);

    const f = this.form.getRawValue();
    const dto: CreateSupplierDto = {
      type: f.type,
      phone: f.phone.trim(),
      email: f.email.trim(),
      address: f.address.trim(),
    };

    if (f.type === SupplierType.NATURAL) {
      dto.fullName = f.fullName.trim();
      dto.dni = f.dni.trim();
    } else {
      dto.businessName = f.businessName.trim();
      dto.ruc = f.ruc.trim();
      dto.contactFullName = f.contactFullName.trim();
      dto.contactDni = f.contactDni.trim();
    }

    const request$ = this.editing
      ? this.supplierApi.update(this.editing.id, dto)
      : this.supplierApi.create(dto);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        setTimeout(() => this.sheetRef.dismiss(true), 1200);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.apiError.set(this.parseError(err));
      },
    });
  }

  private applyTypeValidators(type: SupplierType): void {
    if (type === SupplierType.NATURAL) {
      this.form.get('fullName')!.setValidators([Validators.required]);
      this.form.get('dni')!.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
      this.form.get('businessName')!.clearValidators();
      this.form.get('ruc')!.clearValidators();
      this.form.get('contactFullName')!.clearValidators();
      this.form.get('contactDni')!.clearValidators();
    } else {
      this.form.get('fullName')!.clearValidators();
      this.form.get('dni')!.clearValidators();
      this.form.get('businessName')!.setValidators([Validators.required]);
      this.form.get('ruc')!.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
      this.form.get('contactFullName')!.setValidators([Validators.required]);
      this.form.get('contactDni')!.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
    }

    ['fullName', 'dni', 'businessName', 'ruc', 'contactFullName', 'contactDni'].forEach(
      key => this.form.get(key)!.updateValueAndValidity({ emitEvent: false }),
    );
  }

  private parseError(err: HttpErrorResponse): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
    return 'Error al guardar. Intenta de nuevo.';
  }
}
