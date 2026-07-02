import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ubicacion {
  id: string;
  nombre: string;
  calle: string;
  num_ext: string;
  num_int: string | null;
  colonia: string;
  codigo_postal: string;
  municipio: string;
}

export interface UbicacionForm {
  nombre: string;
  calle: string;
  num_ext: string;
  num_int?: string;
  colonia: string;
  codigo_postal: string;
  municipio: string;
}

@Injectable({ providedIn: 'root' })
export class UbicacionesService {
  private readonly api = 'https://administracionyfinanzasplem.gob.mx/directorio/backend/api/ubicaciones';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(this.api);
  }

  create(dto: UbicacionForm): Observable<Ubicacion> {
    return this.http.post<Ubicacion>(this.api, dto);
  }

  update(id: string, dto: UbicacionForm): Observable<Ubicacion> {
    return this.http.patch<Ubicacion>(`${this.api}/${id}`, dto);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
