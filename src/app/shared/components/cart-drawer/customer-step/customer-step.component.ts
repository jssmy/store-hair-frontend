import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, of, Subject, switchMap, tap } from 'rxjs';
import { ButtonComponent } from '../../button/button.component';
import { IconComponent } from '../../icon/icon.component';
import { AvatarComponent } from '../../avatar/avatar.component';
import { BadgeComponent } from '../../badge/badge.component';
import { SearchComponent } from '../../search/search.component';
import { InputComponent } from '../../input/input.component';
import { AlertComponent } from '../../alert/alert.component';
import { EmptyStateComponent } from '../../empty-state/empty-state.component';
import { ShimmerComponent } from '../../shimmer/shimmer.component';
import { Customer, CreateCustomerDto, CustomerService, UpdateCustomerDto } from '../../../../core/services/customer.service';
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
    ShimmerComponent,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly view = signal<CustomerStepView>('search');
  protected readonly searchQuery = signal('');
  protected readonly selectedCustomer = signal<Customer | undefined>(undefined);
  protected readonly saving = signal(false);
  protected readonly searching = signal(false);

  protected readonly newNames = signal('');
  protected readonly newPhone = signal('');
  protected readonly newDni = signal('');
  protected readonly formErrors = signal<Record<string, string>>({});
  protected readonly phoneCollision = signal<Customer | undefined>(undefined);
  protected readonly conflictType = signal<'phone' | 'dni'>('phone');

  protected readonly searchResults = toSignal(
    this.searchSubject.pipe(
      debounceTime(300),
      tap(q => this.searching.set(!!q.trim())),
      switchMap(q => q.trim() ? this.customerService.search(q) : of([])),
      tap(() => this.searching.set(false)),
    ),
    { initialValue: [] as Customer[] },
  );

  constructor() {
    effect(() => {
      this.searchSubject.next(this.searchQuery());
    });
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
    this.conflictType.set('phone');
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
    if (!dni) errors['dni'] = 'El DNI es requerido';
    else if (!/^\d{8}$/.test(dni)) errors['dni'] = 'El DNI debe tener 8 dígitos';

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.saving.set(true);
    this.customerService.findByPhone(phone)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(existing => {
          if (existing) {
            this.phoneCollision.set(existing);
            this.view.set('update-confirm');
            this.saving.set(false);
            return of(null);
          }
          const dto: CreateCustomerDto = { names, phone, dni };
          return this.customerService.add(dto);
        }),
      )
      .subscribe({
        next: customer => {
          if (customer) {
            this.selectedCustomer.set(customer);
            this.view.set('search');
            this.saving.set(false);
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 409 && this.newDni().trim()) {
            this.customerService.findByDni(this.newDni().trim())
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: existing => {
                  if (existing) {
                    this.phoneCollision.set(existing);
                    this.conflictType.set('dni');
                    this.view.set('update-confirm');
                  }
                  this.saving.set(false);
                },
                error: () => this.saving.set(false),
              });
          } else {
            this.saving.set(false);
          }
        },
      });
  }

  protected confirmUpdate(): void {
    const collision = this.phoneCollision();
    if (!collision?.dni) return;

    const names = this.newNames().trim();
    const phone = this.newPhone().trim();
    const payload: UpdateCustomerDto = { names, phone };

    this.saving.set(true);
    this.customerService.update(collision.dni, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.selectedCustomer.set(updated);
          this.phoneCollision.set(undefined);
          this.view.set('search');
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  protected cancelUpdate(): void {
    this.phoneCollision.set(undefined);
    this.view.set('new-form');
  }

  protected confirmSale(): void {
    this.confirm.emit(this.selectedCustomer());
  }
}
