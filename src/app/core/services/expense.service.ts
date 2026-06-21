import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/pagination.model';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../features/expenses/expenses.data';

export interface ExpenseQueryParams {
  page: number;
  limit: number;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  search?: string;
}

export interface CreateExpensePayload {
  description: string;
  amount: number;
  category: ExpenseCategory;
  status: ExpenseStatus;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly url  = environment.endpoints.expense;

  getAll(params: ExpenseQueryParams = { page: 1, limit: 15 }): Observable<PaginatedResponse<Expense>> {
    let httpParams = new HttpParams();
    const keys = Object.keys(params) as (keyof ExpenseQueryParams)[];
    keys.forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Expense>>(this.url, { params: httpParams });
  }

  create(payload: CreateExpensePayload): Observable<Expense> {
    return this.http.post<Expense>(this.url, payload);
  }

  update(id: number, payload: Partial<CreateExpensePayload>): Observable<Expense> {
    return this.http.patch<Expense>(`${this.url}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete(`${this.url}/${id}`).pipe(map(() => void 0));
  }
}
