import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaces
export interface DependenciaBackend {
  id_Dependencia: number;
  Nombre: string;
}

export interface Dependencia {
  id: number;
  nombre: string;
}

export interface DirectorioResponse {
  id_Dependencia?: number;
  dependencia: string;
  ubicacion?: {
    calle: string;
    num_ext: string;
    num_int: string;
    colonia: string;
    codigo_postal: string;
  };
  direcciones: {
    id_Direccion: number;
    nombre: string;
    departamentos: {
      id_Departamento: number;
      nombre: string;
      usuarios: {
        id_Usuario: number;
        nombre: string;
        rango?: number;
        cargo?: string;
        extension: string;
      }[];
    }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DirectorioService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las dependencias
   */
  getDependencias(): Observable<Dependencia[]> {
    return this.http.get<DependenciaBackend[]>(`${this.apiUrl}/dependencias`)
      .pipe(
        map(data => data.map(d => ({
          id: d.id_Dependencia,
          nombre: d.Nombre
        }))),
        catchError(err => {
          console.error('Error al cargar dependencias:', err);
          return of([]);
        })
      );
  }

  /**
   * Obtiene el directorio de una dependencia específica
   * @param depId ID de la dependencia (0 para todas)
   */
  getDirecciones(depId: number): Observable<DirectorioResponse[]> {
    return this.http.get<DirectorioResponse | DirectorioResponse[]>(
      `${this.apiUrl}/dependencias/${depId}/direcciones-extensiones`
    )
    .pipe(
      map(res => Array.isArray(res) ? res : [res]),
      catchError(err => {
        console.error('Error al cargar directorio:', err);
        throw err; // Propagamos el error para manejarlo en el componente
      })
    );
  }
}