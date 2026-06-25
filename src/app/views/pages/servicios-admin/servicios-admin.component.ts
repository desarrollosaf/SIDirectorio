import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ServiciosService, Servicio } from '../../../services/servicios.service';

@Component({
  selector: 'app-servicios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './servicios-admin.component.html',
  styleUrl: './servicios-admin.component.scss',
})
export class ServiciosAdminComponent implements OnInit {
  @ViewChild('modalForm') modalForm!: TemplateRef<any>;
  @ViewChild('modalConfirm') modalConfirm!: TemplateRef<any>;

  all: Servicio[] = [];
  filtered: Servicio[] = [];
  paged: Servicio[] = [];
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  loading = false;
  saving = false;
  error: string | null = null;

  editMode = false;
  form = { id: 0, nombre: '', extension: '' };
  deleteTarget: Servicio | null = null;
  private modalRef?: NgbModalRef;

  constructor(
    private serviciosService: ServiciosService,
    private modal: NgbModal,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.serviciosService.getAll().subscribe({
      next: data => { this.all = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la información.'; this.loading = false; },
    });
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase().trim();
    this.filtered = q
      ? this.all.filter(s =>
          s.nombre.toLowerCase().includes(q) ||
          s.extension.toLowerCase().includes(q),
        )
      : [...this.all];
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
    this.form = { id: 0, nombre: '', extension: '' };
    this.modalRef = this.modal.open(this.modalForm, { size: 'md', centered: true });
  }

  openEdit(s: Servicio): void {
    this.editMode = true;
    this.form = { id: s.id, nombre: s.nombre, extension: s.extension };
    this.modalRef = this.modal.open(this.modalForm, { size: 'md', centered: true });
  }

  onSave(): void {
    if (!this.form.nombre.trim()) return;
    this.saving = true;
    const obs = this.editMode
      ? this.serviciosService.update(this.form.id, this.form.nombre, this.form.extension)
      : this.serviciosService.create(this.form.nombre, this.form.extension);
    obs.subscribe({
      next: () => { this.saving = false; this.modalRef?.close(); this.load(); },
      error: () => { this.saving = false; },
    });
  }

  openDelete(s: Servicio): void {
    this.deleteTarget = s;
    this.modalRef = this.modal.open(this.modalConfirm, { size: 'sm', centered: true });
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.serviciosService.delete(this.deleteTarget.id).subscribe({
      next: () => { this.modalRef?.close(); this.deleteTarget = null; this.load(); },
    });
  }
}
