import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EncargadosService, Encargado } from '../../../services/encargados.service';
import { CatalogosService, UsuarioCatalogo, DepartamentoCatalogo } from '../../../services/catalogos.service';

@Component({
  selector: 'app-encargados-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './encargados-admin.component.html',
  styleUrl: './encargados-admin.component.scss',
})
export class EncargadosAdminComponent implements OnInit {
  @ViewChild('modalForm') modalForm!: TemplateRef<any>;
  @ViewChild('modalConfirm') modalConfirm!: TemplateRef<any>;

  // Tabla
  allEncargados: Encargado[] = [];
  filtered: Encargado[] = [];
  paged: Encargado[] = [];
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  loading = false;
  saving = false;
  error: string | null = null;

  deleteTarget: Encargado | null = null;
  private modalRef?: NgbModalRef;

  // Form
  selectedUsuarioId: number | null = null;
  selectedDepartamentoId: number | null = null;

  // Catálogo usuarios
  catalogUsuarios: UsuarioCatalogo[] = [];
  userSearch = '';
  filteredUsuarios: UsuarioCatalogo[] = [];
  userDropdownOpen = false;
  selectedUsuario: UsuarioCatalogo | null = null;

  // Catálogo departamentos (filtrado por dependencia)
  departamentos: DepartamentoCatalogo[] = [];
  loadingDepts = false;

  constructor(
    private encargadosService: EncargadosService,
    private catalogosService: CatalogosService,
    private modal: NgbModal,
  ) {}

  ngOnInit(): void {
    this.load();
    this.catalogosService.getUsuarios().subscribe({
      next: data => {
        this.catalogUsuarios = data.map(u => ({
          ...u,
          nombreCompleto: (u.Nombre ?? '').trim(),
        }));
      },
    });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.encargadosService.getAll().subscribe({
      next: data => { this.allEncargados = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la información.'; this.loading = false; },
    });
  }

  // ── Búsqueda de usuario ────────────────────────────────────────────────────
  private norm(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  onUserSearch(): void {
    const q = this.norm(this.userSearch.trim());
    this.userDropdownOpen = q.length >= 2;
    this.filteredUsuarios = q.length >= 2
      ? this.catalogUsuarios.filter(u =>
          this.norm(u.nombreCompleto ?? '').includes(q) ||
          this.norm(u.N_Usuario ?? '').includes(q),
        ).slice(0, 15)
      : [];
  }

  selectUsuario(u: UsuarioCatalogo): void {
    this.selectedUsuario = u;
    this.selectedUsuarioId = u.id_Usuario;
    this.userSearch = u.nombreCompleto ?? '';
    this.userDropdownOpen = false;
    this.filteredUsuarios = [];
    this.selectedDepartamentoId = null;
    this.departamentos = [];
    this.loadingDepts = true;
    this.catalogosService.getDepartamentosPorUsuario(u.id_Usuario).subscribe({
      next: data => { this.departamentos = data; this.loadingDepts = false; },
      error: () => { this.loadingDepts = false; },
    });
  }

  clearUser(): void {
    this.selectedUsuario = null;
    this.selectedUsuarioId = null;
    this.userSearch = '';
    this.userDropdownOpen = false;
    this.departamentos = [];
    this.selectedDepartamentoId = null;
  }

  // ── Tabla ─────────────────────────────────────────────────────────────────
  applyFilter(): void {
    const q = this.norm(this.searchTerm.trim());
    this.filtered = q
      ? this.allEncargados.filter(e =>
          this.norm(this.nombreCompleto(e)).includes(q) ||
          this.norm(e.t_departamento?.nombre_completo ?? e.t_departamento?.Nombre ?? '').includes(q),
        )
      : [...this.allEncargados];
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

  nombreCompleto(e: Encargado): string {
    if (!e.s_usuario) return '—';
    return (e.s_usuario.Nombre ?? '').trim();
  }

  nombreDepartamento(e: Encargado): string {
    return e.t_departamento?.nombre_completo || e.t_departamento?.Nombre || '—';
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openAdd(): void {
    this.selectedUsuario = null;
    this.selectedUsuarioId = null;
    this.selectedDepartamentoId = null;
    this.userSearch = '';
    this.filteredUsuarios = [];
    this.departamentos = [];
    this.modalRef = this.modal.open(this.modalForm, { size: 'lg', centered: true });
  }

  onSave(): void {
    if (!this.selectedUsuarioId || !this.selectedDepartamentoId) return;
    this.saving = true;
    this.encargadosService.create(this.selectedUsuarioId, this.selectedDepartamentoId).subscribe({
      next: () => { this.saving = false; this.modalRef?.close(); this.load(); },
      error: () => { this.saving = false; },
    });
  }

  openDelete(e: Encargado): void {
    this.deleteTarget = e;
    this.modalRef = this.modal.open(this.modalConfirm, { size: 'sm', centered: true });
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.encargadosService.delete(this.deleteTarget.id).subscribe({
      next: () => { this.modalRef?.close(); this.deleteTarget = null; this.load(); },
    });
  }
}
