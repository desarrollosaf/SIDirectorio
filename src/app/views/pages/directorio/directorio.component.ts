import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type Dependencia = { id: string; nombre: string };

export type DirectoryRow = {
  area: string;           
  areaDetalle?: string;  
  puesto?: string;        
  nombre?: string;        
  extension: string;      
};

type Grouped = { area: string; items: DirectoryRow[] };

@Component({
  selector: 'app-directorio',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './directorio.component.html',
  styleUrl: './directorio.component.scss'
})
export class DirectorioComponent {

    loading = false;
  error: string | null = null;
  searched = false;

  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      dependencia: ['', Validators.required],
      q: [''],
    });
  }

  
  toast = { show: false, message: '' };
  private toastTimer: any;

 
  sortBy: 'area' | 'nombre' | 'ext' = 'area';

  
  dependencias: Dependencia[] = [
    { id: 'LEGISLATURA', nombre: 'Legislatura' },
    { id: 'ADMIN', nombre: 'Administración' },
    { id: 'COM_SOCIAL', nombre: 'Comunicación Social' },
  ];

  
  private rows: DirectoryRow[] = [];

  
  private filteredRows: DirectoryRow[] = [];

  
  grouped: Grouped[] = [];

  
  totalFiltered = 0;

  

  get depInvalid(): boolean {
    const c = this.form.controls.dependencia;
    return c.invalid && (c.touched || this.searched);
  }

  async onSearch(): Promise<void> {
    this.searched = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const dep = this.form.value.dependencia!;
      
      this.rows = await this.mockApi(dep);

      this.applyFilterAndSort();
    } catch (e) {
      this.error = 'No se pudo cargar el directorio. Intenta de nuevo.';
      this.rows = [];
      this.filteredRows = [];
      this.grouped = [];
      this.totalFiltered = 0;
    } finally {
      this.loading = false;
    }
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
  }

  clearQuery(): void {
    this.form.controls.q.setValue('');
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

    
    this.filteredRows = this.rows.filter(r => {
      if (!q) return true;

      return (
        norm(r.area).includes(q) ||
        norm(r.areaDetalle).includes(q) ||
        norm(r.puesto).includes(q) ||
        norm(r.nombre).includes(q) ||
        (r.extension ?? '').includes(q)
      );
    });

    
    const sorted = [...this.filteredRows].sort((a, b) => {
      if (this.sortBy === 'area') return norm(a.area).localeCompare(norm(b.area));

      if (this.sortBy === 'nombre') {
       
        const an = norm(a.nombre);
        const bn = norm(b.nombre);
        if (!an && bn) return 1;
        if (an && !bn) return -1;
        return an.localeCompare(bn);
      }

     
      const ax = parseInt(a.extension, 10);
      const bx = parseInt(b.extension, 10);
      if (!Number.isNaN(ax) && !Number.isNaN(bx)) return ax - bx;
      return norm(a.extension).localeCompare(norm(b.extension));
    });

    
    const map = new Map<string, DirectoryRow[]>();
    for (const r of sorted) {
      const key = r.area || 'Sin área';
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }

    this.grouped = Array.from(map.entries()).map(([area, items]) => ({ area, items }));
    this.totalFiltered = sorted.length;
  }

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Extensión copiada ');
    } catch {
      this.showToast('No se pudo copiar ');
    }
  }

  onDownloadPdf(): void {
   
    window.open('/api/directorio/pdf', '_blank');
  }

  private showToast(message: string): void {
    this.toast.message = message;
    this.toast.show = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast.show = false), 1600);
  }

  
  private async mockApi(dependencia: string): Promise<DirectoryRow[]> {
    
    await new Promise(res => setTimeout(res, 450));

    if (!dependencia) return [];

    return [
      {
        area: 'Junta de Coordinación Política',
        puesto: 'Presidente de la Junta de Coordinación Política',
        nombre: 'Dip. Vázquez Rodríguez José Francisco',
        extension: '6494',
      },
      {
        area: 'Junta de Coordinación Política',
        puesto: 'Secretaría Ejecutiva',
        nombre: 'D. en D. Olvera Herreros Omar Salvador',
        extension: '6609',
      },
      {
        area: 'Junta de Coordinación Política',
        puesto: 'Recepción de Presidencia',
        nombre: '',
        extension: '6606',
      },
      {
        area: 'Grupo Parlamentario del PRI',
        puesto: 'Recepción',
        nombre: '',
        extension: '6101',
      },
      {
        area: 'Grupo Parlamentario del PAN',
        puesto: 'Recepción',
        nombre: '',
        extension: '6201',
      },
      {
        area: 'Grupo Parlamentario del PRD',
        puesto: 'Recepción',
        nombre: '',
        extension: '6301',
      },
    ];
  }
}
