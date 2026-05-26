import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/pagination.model';
import { Product } from '../../features/products/products.data';

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  color?: string;
  active?: boolean;
}

/** Shape exacta que devuelve el backend antes de parsear. */
interface RawProduct extends Omit<Product, 'price' | 'length' | 'weight'> {
  price:   string | number;
  length?: string | number | null;
  weight?: string | number | null;
}

function parseProduct(raw: RawProduct): Product {
  return {
    ...raw,
    price:  parseFloat(String(raw.price)),
    length: raw.length != null ? parseFloat(String(raw.length)) : undefined,
    weight: raw.weight != null ? parseFloat(String(raw.weight)) : undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  getAll(query: ProductQuery = {}) {
    let params = new HttpParams();
    if (query.page != null)  params = params.set('page', query.page);
    if (query.limit != null) params = params.set('limit', query.limit);
    if (query.search)        params = params.set('search', query.search);
    if (query.type)          params = params.set('type', query.type);
    if (query.color)         params = params.set('color', query.color);
    if (query.active != null) params = params.set('active', String(query.active));

    return this.http
      .get<PaginatedResponse<RawProduct>>(environment.endpoints.product, { params })
      .pipe(
        map(res => ({
          ...res,
          data: res.data.map(parseProduct),
        })),
      );
  }
}
