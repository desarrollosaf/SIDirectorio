import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UbicacionAsignada {
  asignacion_id: string;
  id: string;
  nombre: string;
}

export interface DependenciaConUbicaciones {
  id_Dependencia: number;
  nombre: string;
  ubicaciones: UbicacionAsignada[];
}

@Injectable({ providedIn: 'root' })
export class DependenciasUbicacionesService {
  private readonly api = 'https://administracionyfinanzasplem.gob.mx/directorio/backend/api/dependencias-ubicaciones';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DependenciaConUbicaciones[]> {
    return this.http.get<DependenciaConUbicaciones[]>(this.api);
  }

  asignar(dependencia_id: number, ubicacion_id: number): Observable<any> {
    return this.http.post(this.api, { dependencia_id, ubicacion_id });
  }

  desasignar(asignacion_id: string): Observable<any> {
    return this.http.delete(`${this.api}/${asignacion_id}`);
  }
}
