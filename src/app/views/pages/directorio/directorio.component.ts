import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';



interface DependenciaBackend {
  id_Dependencia: number;
  Nombre: string;
}

interface Dependencia {
  id: number;
  nombre: string;
}

interface DirectorioResponse {
  dependencia: string;
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
        extension: string;
      }[];
    }[];
  }[];
}

export type DirectoryRow = {
  esTitular: boolean;
  direccionId?: number;        
  direccion?: string;
  departamentoId?: number;      
  departamento?: string;
  nombre: string;
  rango?: number;
  extension: string;
};

type Grouped = { 
  dependencia: string;
  titular: DirectoryRow | null;
  direcciones: {
    id: number;                 
    nombre: string;
    departamentos: DirectoryRow[];
  }[];
};



@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './directorio.component.html',
  styleUrl: './directorio.component.scss'
})
export class DirectorioComponent implements OnInit {

  loading = false;
  loadingDependencias = false;
  error: string | null = null;
  searched = false;

  form!: FormGroup;
  toast = { show: false, message: '' };
  private toastTimer: any;

  sortBy: 'area' | 'nombre' | 'ext' = 'area';

  dependencias: Dependencia[] = [];
  dependenciaNombre: string = '';

  private rows: DirectoryRow[] = [];
  private filteredRows: DirectoryRow[] = [];
  grouped: Grouped[] = [];
  totalFiltered = 0;

  // Para controlar el estado de los acordeones
  collapsedStates: { [key: number]: boolean } = {};

  private apiUrl = 'http://localhost:3000';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      dependencia: ['', Validators.required],
      q: [''],
    });
  }

  ngOnInit(): void {
    this.loadDependencias();
  }

  loadDependencias(): void {
    this.loadingDependencias = true;

    this.http.get<DependenciaBackend[]>(`${this.apiUrl}/dependencias`)
      .pipe(
        map(data =>
          data.map(d => ({
            id: d.id_Dependencia,
            nombre: d.Nombre
          }))
        ),
        catchError(err => {
          console.error(err);
          this.showToast('Error al cargar dependencias');
          return of([]);
        })
      )
      .subscribe(data => {
        this.dependencias = data;
        this.loadingDependencias = false;
      });
  }

  get depInvalid(): boolean {
    const c = this.form.controls['dependencia'];
    return c.invalid && (c.touched || this.searched);
  }

  onSearch(): void {
    this.searched = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const depId = this.form.value.dependencia;
    this.loading = true;
    this.error = null;

    this.http
      .get<DirectorioResponse>(
        `${this.apiUrl}/dependencias/${depId}/direcciones-extensiones`
      )
      .pipe(
        map(res => {
          const rows = this.mapBackendToRows(res);
          this.dependenciaNombre = res.dependencia;
          return rows;
        }),
        catchError(err => {
          this.error = 'No se pudo cargar el directorio';
          return of([]);
        })
      )
      .subscribe(rows => {
        this.rows = rows;
        this.collapsedStates = {};
        this.applyFilterAndSort();
        this.loading = false;
      });
  }

private mapBackendToRows(data: DirectorioResponse): DirectoryRow[] {
  const rows: DirectoryRow[] = [];

  data.direcciones.forEach(dir => {
    dir.departamentos.forEach(dep => {
      if (dep.usuarios.length > 0) {
        dep.usuarios.forEach(user => {
          rows.push({
            esTitular: user.rango === 1,
            direccionId: dir.id_Direccion,      
            direccion: dir.nombre,
            departamentoId: dep.id_Departamento, 
            departamento: dep.nombre,
            nombre: user.nombre,
            rango: user.rango,
            extension: user.extension,
          });
        });
      } else {
        rows.push({
          esTitular: false,
          direccionId: dir.id_Direccion,      
          direccion: dir.nombre,
          departamentoId: dep.id_Departamento, 
          departamento: dep.nombre,
          nombre: '',
          extension: 'Sin extensión',
        });
      }
    });
  });

  return rows;
}
  
  onClear(): void {
    this.form.reset({ dependencia: '', q: '' });
    this.rows = [];
    this.filteredRows = [];
    this.grouped = [];
    this.totalFiltered = 0;
    this.error = null;
    this.searched = false;
    this.sortBy = 'area';
    this.collapsedStates = {};
  }

  clearQuery(): void {
    this.form.controls['q'].setValue('');
    this.applyFilterAndSort();
  }

  setSort(value: 'area' | 'nombre' | 'ext'): void {
    this.sortBy = value;
    this.applyFilterAndSort();
  }

  applyFilterAndSort(): void {
  
  if (!this.rows.length) {
    this.filteredRows = [];
    this.grouped = [];
    this.totalFiltered = 0;
    return;
  }

  const q = (this.form.value.q ?? '').toLowerCase().trim();
  const norm = (s?: string) => (s ?? '').toLowerCase().trim();

  this.filteredRows = this.rows.filter(r =>
    !q ||
    norm(r.direccion).includes(q) ||
    norm(r.departamento).includes(q) ||
    norm(r.nombre).includes(q) ||
    r.extension.includes(q)
  );

  // Ordenar: primero titular (rango 1), luego por direccionId, luego departamentoId
  const sorted = [...this.filteredRows].sort((a, b) => {
    // El titular (rango 1) siempre primero
    if (a.rango === 1 && b.rango !== 1) return -1;
    if (b.rango === 1 && a.rango !== 1) return 1;
    
    // Si el sortBy es 'area', ordenar por IDs
    if (this.sortBy === 'area') {
      // Primero por direccionId
      const dirIdComp = (a.direccionId || 0) - (b.direccionId || 0);
      if (dirIdComp !== 0) return dirIdComp;
      
      // Luego por departamentoId
      return (a.departamentoId || 0) - (b.departamentoId || 0);
    }
    
    // Ordenar por nombre
    if (this.sortBy === 'nombre') return norm(a.nombre).localeCompare(norm(b.nombre));
    
    // Ordenar por extensión
    if (a.extension === 'Sin extensión') return 1;
    if (b.extension === 'Sin extensión') return -1;
    return parseInt(a.extension) - parseInt(b.extension);
  });

  const titular = sorted.find(r => r.rango === 1) || null;
  const restantes = sorted.filter(r => r.rango !== 1);

  // Agrupar por dirección (manteniendo el ID)
  const mapDirecciones = new Map<number, { nombre: string; rows: DirectoryRow[] }>();
  
  restantes.forEach(r => {
    const key = r.direccionId || 0;
    if (!mapDirecciones.has(key)) {
      mapDirecciones.set(key, { nombre: r.direccion || 'Sin dirección', rows: [] });
    }
    mapDirecciones.get(key)!.rows.push(r);
  });


  // Convertir el map a array y ordenar por ID de dirección
  const direccionesArray = Array.from(mapDirecciones.entries())
    .sort((a, b) => a[0] - b[0]) // Ordenar por ID de dirección
    .map(([id, data]) => ({
      id,
      nombre: data.nombre,
      departamentos: data.rows
    }));

  this.grouped = [{
    dependencia: this.dependenciaNombre,
    titular: titular,
    direcciones: direccionesArray
  }];

  this.totalFiltered = sorted.length;
 
}

  toggleCollapse(index: number): void {
    this.collapsedStates[index] = !this.collapsedStates[index];
  }

  isCollapsed(index: number): boolean {
    return this.collapsedStates[index] !== false;
  }


  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Extensión copiada ✓');
    } catch {
      this.showToast('No se pudo copiar ✗');
    }
  }

  private showToast(message: string): void {
    this.toast.message = message;
    this.toast.show = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast.show = false), 1600);
  }
}