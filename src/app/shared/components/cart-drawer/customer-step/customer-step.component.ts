import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { IconComponent } from '../../icon/icon.component';
import { AvatarComponent } from '../../avatar/avatar.component';
import { BadgeComponent } from '../../badge/badge.component';
import { SearchComponent } from '../../search/search.component';
import { InputComponent } from '../../input/input.component';
import { AlertComponent } from '../../alert/alert.component';
import { EmptyStateComponent } from '../../empty-state/empty-state.component';
import { CustomerService, Customer } from '../../../../core/services/customer.service';
import { CartItem } from '../../../../features/products/products.data';
import { PaymentData } from '../payment-step/payment-step.component';

type CustomerStepView = 'search' | 'new-form' | 'update-confirm';

@Component({
  selector: 'stp-customer-step',
  imports: [
    DecimalPipe,
    ButtonComponent,
    IconComponent,
    AvatarComponent,
    BadgeComponent,
    SearchComponent,
    InputComponent,
    AlertComponent,
    EmptyStateComponent,
  ],
  templateUrl: './customer-step.component.html',
  styleUrl: './customer-step.component.scss',
})
export class CustomerStepComponent {
  readonly items = input.required<CartItem[]>();
  readonly payment = input.required<PaymentData>();
  readonly total = input.required<number>();

  readonly back = output<void>();
  readonly confirm = output<Customer | undefined>();

  private readonly customerService = inject(CustomerService);

  protected readonly view = signal<CustomerStepView>('search');
  protected readonly searchQuery = signal('');
  protected readonly selectedCustomer = signal<Customer | undefined>(undefined);

  protected readonly newNames = signal('');
  protected readonly newPhone = signal('');
  protected readonly newDni = signal('');
  protected readonly formErrors = signal<Record<string, string>>({});
  protected readonly phoneCollision = signal<Customer | undefined>(undefined);

  protected readonly searchResults = computed(() => {
    const q = this.searchQuery().trim();
    if (!q) return [];
    return this.customerService.search(q);
  });

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.searchQuery.set('');
  }

  protected clearSelection(): void {
    this.selectedCustomer.set(undefined);
    this.searchQuery.set('');
  }

  protected showNewForm(): void {
    this.newNames.set('');
    this.newPhone.set('');
    this.newDni.set('');
    this.formErrors.set({});
    this.view.set('new-form');
  }

  protected cancelNewForm(): void {
    this.view.set('search');
  }

  protected saveNewCustomer(): void {
    const errors: Record<string, string> = {};
    const names = this.newNames().trim();
    const phone = this.newPhone().trim();
    const dni = this.newDni().trim();

    if (!names) errors['names'] = 'El nombre es requerido';
    if (!phone) errors['phone'] = 'El teléfono es requerido';
    else if (!/^\d{9}$/.test(phone)) errors['phone'] = 'Ingresa un teléfono válido de 9 dígitos';
    if (dni && !/^\d{8}$/.test(dni)) errors['dni'] = 'El DNI debe tener 8 dígitos';

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    const existing = this.customerService.findByPhone(phone);
    if (existing) {
      this.phoneCollision.set(existing);
      this.view.set('update-confirm');
      return;
    }

    const customer = this.customerService.add({ names, phone, dni: dni || undefined });
    this.selectedCustomer.set(customer);
    this.view.set('search');
  }

  protected confirmUpdate(): void {
    const collision = this.phoneCollision();
    if (!collision) return;
    const names = this.newNames().trim();
    const dni = this.newDni().trim();
    this.customerService.update(collision.id, { names, dni: dni || undefined });
    const updated = this.customerService.findById(collision.id)!;
    this.selectedCustomer.set(updated);
    this.phoneCollision.set(undefined);
    this.view.set('search');
  }

  protected cancelUpdate(): void {
    this.phoneCollision.set(undefined);
    this.view.set('new-form');
  }

  protected confirmSale(): void {
    const customer = this.selectedCustomer();
    this.confirm.emit(customer);
  }

}
