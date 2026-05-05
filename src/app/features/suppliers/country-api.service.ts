import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Country } from './suppliers.data';

@Injectable({ providedIn: 'root' })
export class CountryApiService {
  private readonly url = environment.endpoints.country;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Country[]> {
    return this.http.get<Country[]>(this.url);
  }
}
