import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UsuariosSafService, UsuarioSaf, UpdateUsuarioSafDto } from '../../../services/usuarios-saf.service';

@Component({
  selector: 'app-usuarios-saf',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './usuarios-saf.component.html',
})
export class UsuariosSafComponent implements OnInit {
  @ViewChild('modalEdit') modalEdit!: TemplateRef<any>;

  allUsers: UsuarioSaf[] = [];
  filtered: UsuarioSaf[] = [];
  paged: UsuarioSaf[] = [];

  searchTerm = '';
  pageSize = 25;
  currentPage = 1;
  totalItems = 0;

  loading = false;
  saving = false;
  error: string | null = null;
  successMsg: string | null = null;

  editTarget: UsuarioSaf | null = null;
  form: UpdateUsuarioSafDto & { nombre: string; grado_abreviado: string; rango: number | null } = this.emptyForm();

  private modalRef?: NgbModalRef;

  constructor(
    private service: UsuariosSafService,
    private modal: NgbModal,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.service.getAll().subscribe({
      next: data => { this.allUsers = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la información.'; this.loading = false; },
    });
  }

  private norm(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  applyFilter(): void {
    const q = this.norm(this.searchTerm.trim());
    this.filtered = q
      ? this.allUsers.filter(u => this.norm(u.nombre).includes(q) || this.norm(u.rfc).includes(q))
      : [...this.allUsers];
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
    this.currentPage = p; this.paginate();
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

  openEdit(u: UsuarioSaf): void {
    this.editTarget = u;
    this.form = { nombre: u.nombre, grado_abreviado: u.grado_abreviado, rango: u.rango };
    this.error = null;
    this.modalRef = this.modal.open(this.modalEdit, { size: 'md', centered: true });
  }

  save(): void {
    if (!this.editTarget) return;
    this.saving = true;
    this.service.update(this.editTarget.id, this.form).subscribe({
      next: () => {
        this.saving = false;
        this.modalRef?.close();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Error al guardar';
      },
    });
  }

  private emptyForm() {
    return { nombre: '', grado_abreviado: '', rango: null as number | null };
  }
}
