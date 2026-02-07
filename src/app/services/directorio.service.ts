import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DependenciaBackend {
  id_Dependencia: number;
  Nombre: string;
}

export interface Dependencia {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class DirectorioService {
  private apiUrl = 'https://administracionyfinanzasplem.gob.mx/directoriov2/backend/api';

  constructor(private http: HttpClient) {}

  getDependencias(): Observable<Dependencia[]> {
    return this.http.get<DependenciaBackend[]>(`${this.apiUrl}/dependencias`).pipe(
      map(data => data.map(d => ({
        id: d.id_Dependencia,
        nombre: d.Nombre
      })))
    );
  }
}