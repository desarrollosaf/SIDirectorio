import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  DependenciasUbicacionesService,
  DependenciaConUbicaciones,
  UbicacionAsignada,
} from '../../../services/dependencias-ubicaciones.service';
import { CatalogosService, UbicacionCatalogo } from '../../../services/catalogos.service';

@Component({
  selector: 'app-dependencias-ubicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './dependencias-ubicaciones.component.html',
  styleUrls: ['./dependencias-ubicaciones.component.scss'],
})
export class DependenciasUbicacionesComponent implements OnInit {
  @ViewChild('modalGestionar') modalGestionar!: TemplateRef<any>;
  @ViewChild('modalConfirm') modalConfirm!: TemplateRef<any>;

  // Tabla
  allDependencias: DependenciaConUbicaciones[] = [];
  filtered: DependenciaConUbicaciones[] = [];
  paged: DependenciaConUbicaciones[] = [];
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  loading = false;
  error: string | null = null;

  // Modal gestionar
  dependenciaActual: DependenciaConUbicaciones | null = null;
  catalogUbicaciones: UbicacionCatalogo[] = [];
  ubicacionSeleccionada: number | null = null;
  guardando = false;
  private modalRef?: NgbModalRef;

  // Modal confirmar eliminación
  asignacionAEliminar: UbicacionAsignada | null = null;

  constructor(
    private service: DependenciasUbicacionesService,
    private catalogosService: CatalogosService,
    private modal: NgbModal,
  ) {}

  ngOnInit(): void {
    this.load();
    this.catalogosService.getUbicaciones().subscribe({
      next: data => { this.catalogUbicaciones = data; },
    });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.service.getAll().subscribe({
      next: data => {
        this.allDependencias = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la información.';
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase().trim();
    this.filtered = q
      ? this.allDependencias.filter(d =>
          d.nombre.toLowerCase().includes(q) ||
          d.ubicaciones.some(u => u.nombre.toLowerCase().includes(q)),
        )
      : [...this.allDependencias];
    this.totalItems = this.filtered.length;
    this.currentPage = 1;
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);
  }

  onSearch(): void { this.applyFilter(); }
  onPageSizeChange(): void { this.currentPage = 1; this.paginate(); }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.paginate();
  }

  get totalPages(): number { return Math.ceil(this.totalItems / this.pageSize); }
  get startItem(): number { return (this.currentPage - 1) * this.pageSize + 1; }
  get endItem(): number { return Math.min(this.currentPage * this.pageSize, this.totalItems); }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (this.currentPage > 3) pages.push(-1);
    for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(total - 1, this.currentPage + 1); i++) pages.push(i);
    if (this.currentPage < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  // Ubicaciones del catálogo que aún no están asignadas a la dependencia actual
  get ubicacionesDisponibles(): UbicacionCatalogo[] {
    if (!this.dependenciaActual) return this.catalogUbicaciones;
    const asignadasIds = new Set(this.dependenciaActual.ubicaciones.map(u => u.id));
    return this.catalogUbicaciones.filter(u => !asignadasIds.has(u.id));
  }

  openGestionar(dep: DependenciaConUbicaciones): void {
    this.dependenciaActual = { ...dep, ubicaciones: [...dep.ubicaciones] };
    this.ubicacionSeleccionada = null;
    this.modalRef = this.modal.open(this.modalGestionar, { size: 'lg', centered: true });
  }

  agregarUbicacion(): void {
    if (!this.ubicacionSeleccionada || !this.dependenciaActual) return;
    this.guardando = true;
    this.service.asignar(this.dependenciaActual.id_Dependencia, this.ubicacionSeleccionada).subscribe({
      next: () => {
        this.guardando = false;
        this.modalRef?.close();
        this.load();
      },
      error: () => { this.guardando = false; },
    });
  }

  openConfirmEliminar(asignacion: UbicacionAsignada): void {
    this.asignacionAEliminar = asignacion;
    this.modal.open(this.modalConfirm, { size: 'sm', centered: true }).result.then(
      () => {
        if (this.asignacionAEliminar) {
          this.service.desasignar(this.asignacionAEliminar.asignacion_id).subscribe({
            next: () => { this.asignacionAEliminar = null; this.modalRef?.close(); this.load(); },
          });
        }
      },
      () => { this.asignacionAEliminar = null; },
    );
  }
}
