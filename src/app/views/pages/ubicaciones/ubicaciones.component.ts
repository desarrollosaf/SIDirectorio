import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UbicacionesService, Ubicacion, UbicacionForm } from '../../../services/ubicaciones.service';

@Component({
  selector: 'app-ubicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './ubicaciones.component.html',
  styleUrls: ['./ubicaciones.component.scss'],
})
export class UbicacionesComponent implements OnInit {
  @ViewChild('modalForm') modalForm!: TemplateRef<any>;
  @ViewChild('modalConfirm') modalConfirm!: TemplateRef<any>;

  allUbicaciones: Ubicacion[] = [];
  filtered: Ubicacion[] = [];
  paged: Ubicacion[] = [];
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  loading = false;
  saving = false;
  error: string | null = null;

  editMode = false;
  editId: string | null = null;
  form: UbicacionForm = this.emptyForm();
  deleteTarget: Ubicacion | null = null;
  private modalRef?: NgbModalRef;

  constructor(
    private ubicacionesService: UbicacionesService,
    private modal: NgbModal,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.ubicacionesService.getAll().subscribe({
      next: data => {
        this.allUbicaciones = data;
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
      ? this.allUbicaciones.filter(u =>
          u.nombre.toLowerCase().includes(q) ||
          u.calle.toLowerCase().includes(q) ||
          u.colonia.toLowerCase().includes(q) ||
          u.municipio.toLowerCase().includes(q) ||
          u.codigo_postal.includes(q),
        )
      : [...this.allUbicaciones];
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

  openAdd(): void {
    this.editMode = false;
    this.editId = null;
    this.form = this.emptyForm();
    this.modalRef = this.modal.open(this.modalForm, { size: 'lg', centered: true });
  }

  openEdit(u: Ubicacion): void {
    this.editMode = true;
    this.editId = u.id;
    this.form = {
      nombre: u.nombre,
      calle: u.calle,
      num_ext: u.num_ext,
      num_int: u.num_int ?? '',
      colonia: u.colonia,
      codigo_postal: u.codigo_postal,
      municipio: u.municipio,
    };
    this.modalRef = this.modal.open(this.modalForm, { size: 'lg', centered: true });
  }

  onSave(): void {
    this.saving = true;
    const obs = this.editMode
      ? this.ubicacionesService.update(this.editId!, this.form)
      : this.ubicacionesService.create(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.modalRef?.close(); this.load(); },
      error: () => { this.saving = false; },
    });
  }

  openDelete(u: Ubicacion): void {
    this.deleteTarget = u;
    this.modalRef = this.modal.open(this.modalConfirm, { size: 'sm', centered: true });
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.ubicacionesService.delete(this.deleteTarget.id).subscribe({
      next: () => { this.modalRef?.close(); this.deleteTarget = null; this.load(); },
    });
  }

  private emptyForm(): UbicacionForm {
    return { nombre: '', calle: '', num_ext: '', num_int: '', colonia: '', codigo_postal: '', municipio: '' };
  }
}
