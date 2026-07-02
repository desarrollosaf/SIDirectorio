import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioCatalogo {
  id_Usuario: number;
  Nombre: string;
  A_Paterno: string | null;
  A_Materno: string | null;
  Puesto: string | null;
  N_Usuario: string | null;
  id_Dependencia: number | null;
  nombreCompleto?: string;
}

export interface UbicacionCatalogo {
  id: string;
  nombre: string;
  calle: string;
  num_ext: string;
  colonia: string;
  municipio: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly api = 'https://administracionyfinanzasplem.gob.mx/directorio/backend/api';

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<UsuarioCatalogo[]> {
    return this.http.get<UsuarioCatalogo[]>(`${this.api}/catalogos/usuarios`);
  }

  getUbicaciones(): Observable<UbicacionCatalogo[]> {
    return this.http.get<UbicacionCatalogo[]>(`${this.api}/catalogos/ubicaciones`);
  }

  getDepartamentosByDependencia(dependenciaId: number): Observable<DepartamentoCatalogo[]> {
    return this.http.get<DepartamentoCatalogo[]>(`${this.api}/catalogos/departamentos/${dependenciaId}`);
  }

  getDepartamentosPorUsuario(usuarioId: number): Observable<DepartamentoCatalogo[]> {
    return this.http.get<DepartamentoCatalogo[]>(`${this.api}/catalogos/departamentos-por-usuario/${usuarioId}`);
  }
}

export interface DepartamentoCatalogo {
  id_Departamento: number;
  nombre_completo: string | null;
  Nombre: string;
  id_Dependencia: number | null;
  t_direccion: { Nombre: string; nombre_completo: string | null } | null;
}
