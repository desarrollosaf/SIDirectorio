import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Servicio {
  id: number;
  nombre: string;
  extension: string;
  created_at?: string | null;
  updated_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private readonly api = 'https://administracionyfinanzasplem.gob.mx/directorio/backend/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.api}/servicios`);
  }

  create(nombre: string, extension: string): Observable<any> {
    return this.http.post(`${this.api}/servicios`, { nombre, extension });
  }

  update(id: number, nombre: string, extension: string): Observable<any> {
    return this.http.patch(`${this.api}/servicios/${id}`, { nombre, extension });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/servicios/${id}`);
  }
}
