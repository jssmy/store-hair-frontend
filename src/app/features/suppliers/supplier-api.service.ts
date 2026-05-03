import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier } from './suppliers.data';
import { PaginatedResponse } from '../../core/models/pagination.model';

export interface SupplierQueryParams {
  page: number;
  limit: number;
}

export interface CreateSupplierDto {
  name: string;
  dni: string;
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

  getAll(params: SupplierQueryParams = { page: 1, limit: 10 }): Observable<PaginatedResponse<Supplier>> {
    return this.http.get<PaginatedResponse<Supplier>>(this.url, {
      params: {
        page: params.page,
        limit: params.limit,
      },
    });
  }

  create(dto: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<Supplier>(this.url, dto);
  }

  update(id: number, dto: UpdateSupplierDto): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.url}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
