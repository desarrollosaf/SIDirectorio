import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface UsuarioSaf {
  id: number;
  rfc: string;
  nombre: string;
  grado_abreviado: string;
  rango: number | null;
  s_users_id: number | null;
}

export interface UpdateUsuarioSafDto {
  nombre?: string;
  grado_abreviado?: string;
  rango?: number | null;
}

@Injectable({ providedIn: 'root' })
export class UsuariosSafService {
  private readonly api = 'http://localhost:3000/api/usuarios-saf';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers() {
    return { Authorization: `Bearer ${this.auth.getToken()}` };
  }

  getAll(search?: string): Observable<UsuarioSaf[]> {
    const url = search ? `${this.api}?search=${encodeURIComponent(search)}` : this.api;
    return this.http.get<UsuarioSaf[]>(url, { headers: this.headers });
  }

  update(id: number, dto: UpdateUsuarioSafDto): Observable<any> {
    return this.http.patch(`${this.api}/${id}`, dto, { headers: this.headers });
  }
}
