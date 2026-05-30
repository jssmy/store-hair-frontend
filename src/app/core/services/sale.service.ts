import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  create(payload: CreateSalePayload): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(environment.endpoints.sale, payload);
  }
}
