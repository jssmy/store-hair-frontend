import { Injectable, signal } from '@angular/core';

export interface Customer {
  id: number;
  names: string;
  phone: string;
  dni?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private nextId = 4;
  private readonly _customers = signal<Customer[]>([
    { id: 1, names: 'María García López', phone: '987654321', dni: '12345678' },
    { id: 2, names: 'Juan Pérez Torres', phone: '976543210', dni: '87654321' },
    { id: 3, names: 'Ana Rodríguez Silva', phone: '965432109' },
  ]);

  readonly customers = this._customers.asReadonly();

  search(query: string): Customer[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this._customers()
      .filter(c =>
        c.names.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.dni?.includes(q) ?? false),
      )
      .slice(0, 6);
  }

  findByPhone(phone: string): Customer | undefined {
    return this._customers().find(c => c.phone === phone.trim());
  }

  findById(id: number): Customer | undefined {
    return this._customers().find(c => c.id === id);
  }

  add(data: Omit<Customer, 'id'>): Customer {
    const customer: Customer = { ...data, id: this.nextId++ };
    this._customers.update(list => [...list, customer]);
    return customer;
  }

  update(id: number, data: Partial<Omit<Customer, 'id'>>): void {
    this._customers.update(list =>
      list.map(c => (c.id === id ? { ...c, ...data } : c)),
    );
  }
}
