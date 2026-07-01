import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Encargado {
  id: number;
  usuario_id: number | null;
  departamento_id: number | null;
  s_usuario: {
    id_Usuario: number;
    Nombre: string;
    A_Paterno: string;
    A_Materno: string;
    Puesto: string | null;
    id_Dependencia: number | null;
  } | null;
  t_departamento: {
    id_Departamento: number;
    nombre_completo: string | null;
    Nombre: string;
    id_Dependencia: number | null;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class EncargadosService {
  private readonly api = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Encargado[]> {
    return this.http.get<Encargado[]>(`${this.api}/encargados`);
  }

  create(usuarioId: number, departamentoId: number): Observable<any> {
    return this.http.post(`${this.api}/encargados`, {
      usuario_id: usuarioId,
      departamento_id: departamentoId,
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/encargados/${id}`);
  }
}
