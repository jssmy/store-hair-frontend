import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, SupplierCategory } from './suppliers.data';

export interface ApiSupplier {
  id: number;
  name: string;
  dni: number;
  phone: string;
  email: string;
  address: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  dni: number;
  phone: string;
  email: string;
  address: string;
  active?: boolean;
}

export type UpdateSupplierDto = Partial<CreateSupplierDto>;

@Injectable({ providedIn: 'root' })
export class SupplierApiService {
  private readonly url = environment.endpoints.supplier;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiSupplier[]> {
    return this.http.get<ApiSupplier[]>(this.url);
  }

  create(dto: CreateSupplierDto): Observable<ApiSupplier> {
    return this.http.post<ApiSupplier>(this.url, dto);
  }

  update(id: number, dto: UpdateSupplierDto): Observable<ApiSupplier> {
    return this.http.patch<ApiSupplier>(`${this.url}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  toSupplier(api: ApiSupplier, category: SupplierCategory = 'general'): Supplier {
    return {
      id: api.id,
      name: api.name,
      ruc: api.dni.toString(),
      phone: api.phone,
      email: api.email,
      address: api.address,
      category: category === 'todos' ? 'general' : category,
      active: api.active,
    };
  }
}
