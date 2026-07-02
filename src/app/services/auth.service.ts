import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  name: string;
  rfc: string;
  role: 'superuser' | 'admin' | 'tecnico' | 'user';
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'https://administracionyfinanzasplem.gob.mx/directorio/backend/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  constructor(private http: HttpClient, private router: Router) {}

  login(rfc: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { rfc, password })
      .pipe(
        tap(response => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          localStorage.setItem('isLoggedin', 'true');
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('isLoggedin');
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  hasRole(role: string): boolean {
    return this.getUser()?.role === role;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
