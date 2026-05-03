import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import { AlertComponent } from '../alert/alert.component';
import {
  Supplier,
} from '../../../features/suppliers/suppliers.data';
import { CreateSupplierDto, SupplierApiService } from '../../../features/suppliers/supplier-api.service';

interface SupplierForm {
  name: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
}

export interface SupplierDrawerData {
  supplier?: Supplier | null;
}

const EMPTY_FORM: SupplierForm = {
  name: '', dni: '', phone: '', email: '', address: '',
};

@Component({
  selector: 'stp-supplier-drawer',
  imports: [ButtonComponent, IconComponent, InputComponent, AlertComponent],
  templateUrl: './supplier-drawer.component.html',
  styleUrl: './supplier-drawer.component.scss',
})
export class SupplierDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<SupplierDrawerComponent, boolean>>(MatBottomSheetRef);
  private readonly data = inject<SupplierDrawerData>(MAT_BOTTOM_SHEET_DATA);
  private readonly supplierApi = inject(SupplierApiService);

  protected readonly editing: Supplier | null = this.data.supplier ?? null;

  protected readonly form = signal<SupplierForm>(
    this.editing
      ? {
          name:     this.editing.name,
          dni:      this.editing.dni,
          phone:    this.editing.phone,
          email:    this.editing.email,
          address:  this.editing.address,
        }
      : { ...EMPTY_FORM },
  );
  protected readonly submitting = signal(false);
  protected readonly success = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected readonly title = this.editing ? 'Editar proveedor' : 'Nuevo proveedor';
  protected readonly submitLabel = this.editing ? 'Guardar cambios' : 'Registrar proveedor';

  protected readonly canSubmit = computed(() => {
    const f = this.form();
    return !!(f.name.trim() && f.dni.trim().length >= 8 && f.phone.trim());
  });

  protected patchForm(patch: Partial<SupplierForm>): void {
    this.apiError.set(null);
    this.form.update(prev => ({ ...prev, ...patch }));
  }

  protected close(): void {
    this.sheetRef.dismiss(false);
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.apiError.set(null);

    const request: CreateSupplierDto = {
      name: this.form().name.trim(),
      dni: this.form().dni.trim(),
      phone: this.form().phone.trim(),
      email: this.form().email.trim(),
      address: this.form().address.trim(),
    }


    const request$ = this.editing
      ? this.supplierApi.update(this.editing.id, request)
      : this.supplierApi.create(request);

    request$.subscribe({
      next: saved => {
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

  private parseError(err: HttpErrorResponse): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
    return 'Error al guardar. Intenta de nuevo.';
  }
}
