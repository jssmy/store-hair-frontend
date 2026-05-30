import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/pagination.model';

export interface Customer {
  id: number;
  names: string;
  phone: string;
  dni: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateCustomerDto = Pick<Customer, 'names' | 'phone'> & { dni?: string };
export type UpdateCustomerDto = Partial<Pick<Customer, 'names' | 'phone' | 'dni'>>;

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.endpoints.customer;

  search(query: string): Observable<Customer[]> {
    const params = new HttpParams()
      .set('search', query)
      .set('active', 'true')
      .set('limit', '5');
    return this.http
      .get<PaginatedResponse<Customer>>(this.url, { params })
      .pipe(map(res => res.data ?? []));
  }

  findByPhone(phone: string): Observable<Customer | undefined> {
    return this.search(phone).pipe(
      map(customers => customers.find(c => c.phone === phone)),
    );
  }

  findByDni(dni: string): Observable<Customer | undefined> {
    return this.search(dni).pipe(
      map(customers => customers.find(c => c.dni === dni)),
    );
  }

  add(data: CreateCustomerDto): Observable<Customer> {
    return this.http.post<Customer>(this.url, data);
  }

  update(dni: string, data: UpdateCustomerDto): Observable<Customer> {
    return this.http.patch<Customer>(`${this.url}/${dni}`, data);
  }
}
