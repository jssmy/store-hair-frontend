import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Lote, CreateProductDto, Inventory, FindAllLoteQuery, CreateLoteDto, LoteStatus } from '../../features/products/products.data';
import { environment } from "../../../environments/environment";
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {

    private readonly http = inject(HttpClient);

    create(loteDto: CreateLoteDto) {
        return this.http.post(environment.endpoints.lote, loteDto);
    }

    getAll(query: FindAllLoteQuery = {}) {
        let params = new HttpParams();
        if (query.page != null) params = params.set('page', query.page);
        if (query.limit != null) params = params.set('limit', query.limit);
        if (query.userId) params = params.set('userId', query.userId);
        return this.http.get<PaginatedResponse<Inventory>>(environment.endpoints.lote, { params });
    }

    getById(id: string) {
        return this.http.get<Inventory>(`${environment.endpoints.lote}/${id}`);
    }

    update(id: string, products: CreateProductDto[]) {
        return this.http.patch(`${environment.endpoints.lote}/${id}`, { products });
    }

    updateStatus(id: string, status: LoteStatus) {
        return this.http.patch(`${environment.endpoints.lote}/${id}/status`, { status });
    }

    delete(id: string) {
        return this.http.delete(`${environment.endpoints.lote}/${id}`);
    }

}