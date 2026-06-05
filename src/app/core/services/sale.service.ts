import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/pagination.model';
import { Sale, SalePaymentMethod } from '../../features/sales/sales.data';

export interface SaleQueryParams {
  page: number;
  limit: number;
  paymentMethod?: SalePaymentMethod;
  customerId?: number;
  search?: string;
}

export interface CreateSalePayload {
  paymentMethod: 'cash' | 'credit';
  customerId: number;
  details: { productId: number; salePrice: number }[];
  cashAmount: number;
  transferAmount: number;
  notes?: string;
}

export interface SaleResponse {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly url  = environment.endpoints.sale;

  getAll(params: SaleQueryParams = { page: 1, limit: 10 }): Observable<PaginatedResponse<Sale>> {
    let httpParams = new HttpParams();

    const keys = Object.keys(params) as (keyof SaleQueryParams)[];
    keys.forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<PaginatedResponse<Sale>>(this.url, { params: httpParams });
  }

  create(payload: CreateSalePayload): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(this.url, payload);
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/pdf`, { responseType: 'blob' });
  }
}
