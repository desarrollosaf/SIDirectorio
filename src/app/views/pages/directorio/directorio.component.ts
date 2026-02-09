import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DirectorioService, Dependencia, DirectorioResponse } from './directorio.service';

export type DirectoryRow = {
  esTitular: boolean;
  esDireccion?: boolean;
  dependenciaId?: number;
  dependenciaNombre?: string;
  direccionId?: number;
  direccion?: string;
  departamentoId?: number;
  departamento?: string;
  nombre: string;
  rango?: number;
  cargo?: string;
  extension: string;
};

type Grouped = {
  dependenciaId: number;
  dependencia: string;
  ubicacion?: string;
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

  private rows: DirectoryRow[] = [];
  private filteredRows: DirectoryRow[] = [];
  grouped: Grouped[] = [];
  totalFiltered = 0;

  collapsedStates: { [key: string]: boolean } = {};

  private ubicacionesPorDependencia = new Map<number, any>();

  constructor(
    private fb: FormBuilder,
    private directorioService: DirectorioService  // ✅ Inyectamos el servicio
  ) {
    this.form = this.fb.group({
      dependencia: [''],
      q: [''],
    });
  }

  ngOnInit(): void {
    this.loadDependencias();
  }

  /**
   * Carga el catálogo de dependencias
   */
  loadDependencias(): void {
    this.loadingDependencias = true;

    this.directorioService.getDependencias()
      .subscribe({
        next: (data) => {
          this.dependencias = data;
          this.loadingDependencias = false;
        },
        error: (err) => {
          console.error(err);
          this.showToast('Error al cargar dependencias');
          this.loadingDependencias = false;
        }
      });
  }

  get depInvalid(): boolean {
    return false;
  }

  /**
   * Realiza la búsqueda del directorio
   */
  onSearch(): void {
    this.searched = true;
    const depId = this.form.value.dependencia || 0;

    this.loading = true;
    this.error = null;

    this.directorioService.getDirecciones(depId)
      .subscribe({
        next: (dataArray) => {
          // Guardar ubicaciones
          dataArray.forEach(data => {
            if (data.ubicacion && data.id_Dependencia) {
              this.ubicacionesPorDependencia.set(data.id_Dependencia, data.ubicacion);
            }
          });

          // Mapear datos a filas
          this.rows = dataArray.flatMap(data => this.mapBackendToRows(data));
          this.collapsedStates = {};
          this.applyFilterAndSort();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'No se pudo cargar el directorio';
          this.loading = false;
        }
      });
  }

  /**
   * Formatea la ubicación para mostrar
   */
  getUbicacionString(depId: number): string {
    const ub = this.ubicacionesPorDependencia.get(depId);
    if (!ub) return '';

    const partes = [];
    if (ub.calle) partes.push(ub.calle);
    if (ub.num_ext && ub.num_ext !== 'S/N') partes.push(`No. ${ub.num_ext}`);
    if (ub.colonia) partes.push(`Col. ${ub.colonia}`);
    if (ub.codigo_postal) partes.push(`C.P. ${ub.codigo_postal}`);

    return partes.join(', ');
  }

  /**
   * Mapea la respuesta del backend a filas de la tabla
   */
  private mapBackendToRows(data: DirectorioResponse): DirectoryRow[] {
    const rows: DirectoryRow[] = [];
    const esOSFEM = data.dependencia === 'ÓRGANO SUPERIOR DE FISCALIZACIÓN DEL ESTADO DE MÉXICO';

    data.direcciones.forEach(dir => {
      dir.departamentos.forEach(dep => {
        const nombreNormalizado = this.normalizarTexto(dep.nombre);
        const esDireccion = esOSFEM && nombreNormalizado.startsWith('DIRECCION');

        if (dep.usuarios.length > 0) {
          dep.usuarios.forEach(user => {
            rows.push({
              esTitular: user.rango === 1,
              esDireccion: esDireccion,
              dependenciaId: data.id_Dependencia,
              dependenciaNombre: data.dependencia,
              direccionId: dir.id_Direccion,
              direccion: dir.nombre,
              departamentoId: dep.id_Departamento,
              departamento: dep.nombre,
              nombre: user.nombre,
              rango: user.rango,
              cargo: user.cargo,
              extension: user.extension,
            });
          });
        } else {
          rows.push({
            esTitular: false,
            esDireccion: esDireccion,
            dependenciaId: data.id_Dependencia,
            dependenciaNombre: data.dependencia,
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

  /**
   * Normaliza texto para comparaciones
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Limpia el formulario y resultados
   */
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

  /**
   * Limpia solo el campo de búsqueda
   */
  clearQuery(): void {
    this.form.controls['q'].setValue('');
    this.applyFilterAndSort();
  }

  /**
   * Establece el criterio de ordenamiento
   */
  setSort(value: 'area' | 'nombre' | 'ext'): void {
    this.sortBy = value;
    this.applyFilterAndSort();
  }

  /**
   * Aplica filtros y ordenamiento a los resultados
   */
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
      norm(r.dependenciaNombre).includes(q) ||
      norm(r.direccion).includes(q) ||
      norm(r.departamento).includes(q) ||
      norm(r.nombre).includes(q) ||
      r.extension.includes(q)
    );

    const sorted = [...this.filteredRows].sort((a, b) => {
      const depComp = (a.dependenciaId || 0) - (b.dependenciaId || 0);
      if (depComp !== 0) return depComp;

      if (a.rango === 1 && b.rango !== 1) return -1;
      if (b.rango === 1 && a.rango !== 1) return 1;

      if (this.sortBy === 'area') {
        const dirIdComp = (a.direccionId || 0) - (b.direccionId || 0);
        if (dirIdComp !== 0) return dirIdComp;
        return (a.departamentoId || 0) - (b.departamentoId || 0);
      }

      if (this.sortBy === 'nombre') return norm(a.nombre).localeCompare(norm(b.nombre));

      if (a.extension === 'Sin extensión') return 1;
      if (b.extension === 'Sin extensión') return -1;
      return parseInt(a.extension) - parseInt(b.extension);
    });

    const mapDependencias = new Map<number, DirectoryRow[]>();

    sorted.forEach(r => {
      const key = r.dependenciaId || 0;
      if (!mapDependencias.has(key)) {
        mapDependencias.set(key, []);
      }
      mapDependencias.get(key)!.push(r);
    });

    this.grouped = Array.from(mapDependencias.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([depId, rowsDep]) => {
        const titular = rowsDep.find(r => r.rango === 1) || null;
        const restantes = rowsDep.filter(r => r.rango !== 1);

        const mapDirecciones = new Map<number, { nombre: string; rows: DirectoryRow[] }>();

        restantes.forEach(r => {
          const key = r.direccionId || 0;
          if (!mapDirecciones.has(key)) {
            mapDirecciones.set(key, { nombre: r.direccion || 'Sin dirección', rows: [] });
          }
          mapDirecciones.get(key)!.rows.push(r);
        });

        const direccionesArray = Array.from(mapDirecciones.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([id, data]) => ({
            id,
            nombre: data.nombre,
            departamentos: data.rows
          }));

        return {
          dependenciaId: depId,
          dependencia: rowsDep[0]?.dependenciaNombre || 'Sin dependencia',
          ubicacion: this.getUbicacionString(depId),
          titular: titular,
          direcciones: direccionesArray
        };
      });

    this.totalFiltered = sorted.length;
  }

  /**
   * Alterna el estado colapsado de un acordeón
   */
  toggleCollapse(key: string): void {
    this.collapsedStates[key] = !this.collapsedStates[key];
  }

  /**
   * Verifica si un acordeón está colapsado
   */
  isCollapsed(key: string): boolean {
    return this.collapsedStates[key] !== false;
  }

  /**
   * Copia texto al portapapeles
   */
  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Extensión copiada ✓');
    } catch {
      this.showToast('No se pudo copiar ✗');
    }
  }

  /**
   * Muestra un mensaje toast
   */
  private showToast(message: string): void {
    this.toast.message = message;
    this.toast.show = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast.show = false), 1600);
  }
}