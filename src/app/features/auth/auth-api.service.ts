import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(environment.endpoints.auth.login, { identifier, password });
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    const httpHeaders = new HttpHeaders()
    .set('Authorization', `Bearer ${refreshToken}`);
    return this.http.post<AuthResponse>(environment.endpoints.auth.refresh, {}, { headers: httpHeaders });
  }

  register(email: string, password: string, name?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(environment.endpoints.auth.register, { email, password, name });
  }
}
