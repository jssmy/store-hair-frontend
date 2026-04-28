import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import {
  SUPPLIER_CATEGORY_ICONS,
  SUPPLIER_CATEGORY_LABELS,
  Supplier,
  SupplierCategory,
} from '../../../features/suppliers/suppliers.data';

interface SupplierForm {
  name: string;
  ruc: string;
  phone: string;
  email: string;
  address: string;
  category: Exclude<SupplierCategory, 'todos'>;
}

export interface SupplierDrawerData {
  supplier?: Supplier | null;
}

export interface SupplierDrawerResult {
  name: string;
  ruc: string;
  phone: string;
  email?: string;
  address?: string;
  category: Exclude<SupplierCategory, 'todos'>;
}

const EMPTY_FORM: SupplierForm = {
  name: '', ruc: '', phone: '', email: '', address: '', category: 'general',
};

@Component({
  selector: 'stp-supplier-drawer',
  imports: [ButtonComponent, IconComponent, InputComponent],
  templateUrl: './supplier-drawer.component.html',
  styleUrl: './supplier-drawer.component.scss',
})
export class SupplierDrawerComponent {
  private readonly sheetRef =
    inject<MatBottomSheetRef<SupplierDrawerComponent, SupplierDrawerResult | null>>(MatBottomSheetRef);

  private readonly data = inject<SupplierDrawerData>(MAT_BOTTOM_SHEET_DATA);

  protected readonly editing: Supplier | null = this.data.supplier ?? null;

  protected readonly categoryOptions: Exclude<SupplierCategory, 'todos'>[] = [
    'abarrotes', 'bebidas', 'lacteos', 'snacks', 'limpieza', 'higiene', 'panaderia', 'carnes', 'general',
  ];
  protected readonly categoryLabels = SUPPLIER_CATEGORY_LABELS;

  protected readonly form = signal<SupplierForm>(
    this.editing
      ? {
          name:     this.editing.name,
          ruc:      this.editing.ruc,
          phone:    this.editing.phone,
          email:    this.editing.email ?? '',
          address:  this.editing.address ?? '',
          category: this.editing.category,
        }
      : { ...EMPTY_FORM },
  );
  protected readonly submitting = signal(false);
  protected readonly success = signal(false);

  protected readonly title = this.editing ? 'Editar proveedor' : 'Nuevo proveedor';
  protected readonly submitLabel = this.editing ? 'Guardar cambios' : 'Registrar proveedor';

  protected readonly canSubmit = computed(() => {
    const f = this.form();
    return !!(f.name.trim() && f.ruc.trim().length >= 8 && f.phone.trim());
  });

  protected patchForm(patch: Partial<SupplierForm>): void {
    this.form.update(prev => ({ ...prev, ...patch }));
  }

  protected close(): void {
    this.sheetRef.dismiss(null);
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    setTimeout(() => {
      const f = this.form();
      this.submitting.set(false);
      this.success.set(true);

      const result: SupplierDrawerResult = {
        name:     f.name.trim(),
        ruc:      f.ruc.trim(),
        phone:    f.phone.trim(),
        email:    f.email.trim() || undefined,
        address:  f.address.trim() || undefined,
        category: f.category,
      };

      setTimeout(() => this.sheetRef.dismiss(result), 1200);
    }, 600);
  }

  protected categoryIcon(category: SupplierCategory): string {
    return SUPPLIER_CATEGORY_ICONS[category];
  }
}
