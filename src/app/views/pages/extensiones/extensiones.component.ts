import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ExtensionesService, ExtensionUsuario, ExtensionForm } from '../../../services/extensiones.service';
import { CatalogosService, UsuarioCatalogo, UbicacionCatalogo } from '../../../services/catalogos.service';

@Component({
  selector: 'app-extensiones',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './extensiones.component.html',
  styleUrls: ['./extensiones.component.scss'],
})
export class ExtensionesComponent implements OnInit {
  @ViewChild('modalForm') modalForm!: TemplateRef<any>;
  @ViewChild('modalConfirm') modalConfirm!: TemplateRef<any>;

  // Tabla
  allExtensiones: ExtensionUsuario[] = [];
  filtered: ExtensionUsuario[] = [];
  paged: ExtensionUsuario[] = [];
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  // Estado
  loading = false;
  saving = false;
  error: string | null = null;

  // Modal
  editMode = false;
  form: ExtensionForm & { id?: string } = {};
  deleteTarget: ExtensionUsuario | null = null;
  private modalRef?: NgbModalRef;

  // Catálogos
  catalogUsuarios: UsuarioCatalogo[] = [];
  catalogUbicaciones: UbicacionCatalogo[] = [];

  // Búsqueda servidor público
  userSearch = '';
  filteredUsuarios: UsuarioCatalogo[] = [];
  userDropdownOpen = false;

  // Extensión secretarial
  showSecretaria = false;
  secretariaSearch = '';
  filteredSecretarias: UsuarioCatalogo[] = [];
  secretariaDropdownOpen = false;

  constructor(
    private extService: ExtensionesService,
    private catalogosService: CatalogosService,
    private modal: NgbModal,
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadCatalogos();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.extService.getAll().subscribe({
      next: data => { this.allExtensiones = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la información.'; this.loading = false; },
    });
  }

  loadCatalogos(): void {
    this.catalogosService.getUsuarios().subscribe({
      next: data => {
        this.catalogUsuarios = data.map(u => ({
          ...u,
          nombreCompleto: (u.Nombre ?? '').trim(),
        }));
      },
    });
    this.catalogosService.getUbicaciones().subscribe({
      next: data => { this.catalogUbicaciones = data; },
    });
  }

  private norm(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // ── Búsqueda servidor público ──────────────────────────────────────────────
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
    this.form.servidor_publico_id = u.id_Usuario;
    this.userSearch = u.nombreCompleto ?? '';
    this.userDropdownOpen = false;
    this.filteredUsuarios = [];
  }

  clearUser(): void {
    this.form.servidor_publico_id = undefined;
    this.userSearch = '';
    this.userDropdownOpen = false;
  }

  // ── Búsqueda secretaria / personal operativo ───────────────────────────────
  onSecretariaSearch(): void {
    const q = this.norm(this.secretariaSearch.trim());
    this.secretariaDropdownOpen = q.length >= 2;
    this.filteredSecretarias = q.length >= 2
      ? this.catalogUsuarios.filter(u =>
          this.norm(u.nombreCompleto ?? '').includes(q) ||
          this.norm(u.N_Usuario ?? '').includes(q),
        ).slice(0, 15)
      : [];
  }

  selectSecretaria(u: UsuarioCatalogo): void {
    this.form.personal_operativo_id = u.id_Usuario;
    this.secretariaSearch = u.nombreCompleto ?? '';
    this.secretariaDropdownOpen = false;
    this.filteredSecretarias = [];
  }

  clearSecretaria(): void {
    this.form.personal_operativo_id = null;
    this.secretariaSearch = '';
    this.secretariaDropdownOpen = false;
  }

  toggleSecretaria(): void {
    if (!this.showSecretaria) {
      this.form.personal_operativo_id = null;
      this.form.extension = '';
      this.secretariaSearch = '';
      this.secretariaDropdownOpen = false;
    }
  }

  // ── Tabla ─────────────────────────────────────────────────────────────────
  applyFilter(): void {
    const q = this.norm(this.searchTerm.trim());
    this.filtered = q
      ? this.allExtensiones.filter(e =>
          (e.extension ?? '').includes(q) ||
          (e.extension_privada ?? '').includes(q) ||
          this.norm(e.ubicacion?.nombre ?? '').includes(q) ||
          this.norm(this.nombreCompleto(e)).includes(q) ||
          this.norm(e.usuario?.N_Usuario ?? '').includes(q),
        )
      : [...this.allExtensiones];
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

  nombreCompleto(e: ExtensionUsuario): string {
    if (!e.usuario) return '—';
    return (e.usuario.Nombre ?? '').trim();
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openAdd(): void {
    this.editMode = false;
    this.form = {};
    this.userSearch = '';
    this.filteredUsuarios = [];
    this.showSecretaria = false;
    this.secretariaSearch = '';
    this.filteredSecretarias = [];
    this.modalRef = this.modal.open(this.modalForm, { size: 'lg', centered: true });
  }

  openEdit(e: ExtensionUsuario): void {
    this.editMode = true;
    this.form = {
      id: e.extension_id,
      extension: e.extension ?? '',
      extension_privada: e.extension_privada ?? '',
      ubicacion_id: e.ubicacion ? Number(e.ubicacion.id) : undefined,
      servidor_publico_id: e.usuario?.id_Usuario,
      personal_operativo_id: e.personal_operativo?.id_Usuario ?? null,
    };
    this.userSearch = e.usuario ? (e.usuario.Nombre ?? '').trim() : '';
    this.filteredUsuarios = [];
    this.showSecretaria = !!e.personal_operativo;
    this.secretariaSearch = e.personal_operativo ? (e.personal_operativo.Nombre ?? '').trim() : '';
    this.filteredSecretarias = [];
    this.modalRef = this.modal.open(this.modalForm, { size: 'lg', centered: true });
  }

  onSave(): void {
    this.saving = true;
    const { id, ...data } = this.form;
    if (!this.showSecretaria) {
      data.personal_operativo_id = null;
      data.extension = '';
    }
    const obs = this.editMode ? this.extService.update(id!, data) : this.extService.create(data);
    obs.subscribe({
      next: () => { this.saving = false; this.modalRef?.close(); this.load(); },
      error: () => { this.saving = false; },
    });
  }

  openDelete(e: ExtensionUsuario): void {
    this.deleteTarget = e;
    this.modalRef = this.modal.open(this.modalConfirm, { size: 'sm', centered: true });
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.extService.delete(this.deleteTarget.extension_id).subscribe({
      next: () => { this.modalRef?.close(); this.deleteTarget = null; this.load(); },
    });
  }
}
