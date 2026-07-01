import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioResumen {
  id_Usuario: number;
  Nombre: string;
  A_Paterno: string;
  A_Materno: string;
  N_Usuario?: string;
  Puesto?: string;
}

export interface ExtensionUsuario {
  extension_id: string;
  extension: string | null;
  extension_privada: string | null;
  ubicacion: { id: string; nombre: string } | null;
  usuario: UsuarioResumen | null;
  personal_operativo: UsuarioResumen | null;
}

export interface ExtensionForm {
  extension?: string;
  extension_privada?: string;
  ubicacion_id?: number;
  servidor_publico_id?: number;
  personal_operativo_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ExtensionesService {
  private readonly api = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ExtensionUsuario[]> {
    return this.http.get<ExtensionUsuario[]>(`${this.api}/extensiones/usuarios`);
  }

  create(data: ExtensionForm): Observable<any> {
    return this.http.post(`${this.api}/extensiones`, data);
  }

  update(id: string, data: ExtensionForm): Observable<any> {
    return this.http.patch(`${this.api}/extensiones/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.api}/extensiones/${id}`);
  }
}
