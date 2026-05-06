import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { map, Observable } from "rxjs";
import { PaginatedResponse } from "../models/pagination.model";
import { CreatePurchaseOrderDto, PurchaseOrder, PurchaseOrderQueryParams, UpdatePurchaseOrderDto } from "../models/purchase-order.model";
import { PurchaseOrderStatus } from "../../features/purchase-order/purchase-order.data";

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.endpoints.purchaseOrder;

  getAll(params: PurchaseOrderQueryParams = { page: 1, limit: 10 }): Observable<PaginatedResponse<PurchaseOrder>> {
    return this.http.get<PaginatedResponse<PurchaseOrder>>(this.baseUrl, {
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.status ? { status: params.status } : {}),
      },
    });
  }

  getAllAproved(params: PurchaseOrderQueryParams): Observable<PaginatedResponse<PurchaseOrder>> {
    return this.getAll(params).pipe(
      map(response => {
        return new PaginatedResponse(
          response.data.filter(order => order.status === PurchaseOrderStatus.APPROVED),
          response.meta,
        );
      }),
    );
  }

  getById(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.baseUrl}/${id}`);
  }

  create(data: CreatePurchaseOrderDto): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(this.baseUrl, data);
  }

  update(id: number, data: UpdatePurchaseOrderDto): Observable<PurchaseOrder> {
    return this.http.patch<PurchaseOrder>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}