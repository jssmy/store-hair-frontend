import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, SupplierType } from './suppliers.data';
import { PaginatedResponse } from '../../core/models/pagination.model';


export interface SupplierQueryParams {
  page: number;
  limit: number;
  type?: SupplierType;
  active?: boolean;
}

export interface CreateSupplierDto {
  type: SupplierType;
  fullName?: string;
  businessName?: string;
  dni?: string;
  ruc?: string;
  contactFullName?: string;
  contactDni?: string;
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
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }

    if (params.active !== undefined) {
      httpParams = httpParams.set('active', params.active.toString());
    }

    return this.http.get<PaginatedResponse<Supplier>>(this.url, { params: httpParams });
  }

  getActiveAll(params: SupplierQueryParams) {
    return this.getAll(params).pipe(
      map(response => {
        return new PaginatedResponse(
          response.data.filter(supplier => supplier.active),
          response.meta,
        );
      }),
    );
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
