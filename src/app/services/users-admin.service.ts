import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AdminUser {
  id: string;
  name: string | null;
  rfc: string | null;
  email: string | null;
  role: 'superuser' | 'admin' | 'user';
  created_at: string | null;
}

export interface SafUser {
  id: number;
  rfc: string | null;
  name: string;
}

export interface CreateAdminUserDto {
  rfc: string;
  role: 'superuser' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class UsersAdminService {
  private readonly api = 'http://localhost:3000/api/users-admin';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers() {
    return { Authorization: `Bearer ${this.auth.getToken()}` };
  }

  getAll(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.api, { headers: this.headers });
  }

  getSafUsers(): Observable<SafUser[]> {
    return this.http.get<SafUser[]>(`${this.api}/saf-users`, { headers: this.headers });
  }

  create(dto: CreateAdminUserDto): Observable<any> {
    return this.http.post(this.api, dto, { headers: this.headers });
  }

  updateRole(rfc: string, role: 'superuser' | 'admin'): Observable<any> {
    return this.http.patch(`${this.api}/${rfc}/role`, { role }, { headers: this.headers });
  }

  remove(rfc: string): Observable<any> {
    return this.http.delete(`${this.api}/${rfc}`, { headers: this.headers });
  }
}
