import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsersAdminService, AdminUser, SafUser, CreateAdminUserDto } from '../../../services/users-admin.service';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, NgSelectModule],
  templateUrl: './users-admin.component.html',
  styleUrls: ['./users-admin.component.scss'],
})
export class UsersAdminComponent implements OnInit {
  @ViewChild('modalForm') modalForm!: TemplateRef<any>;
  @ViewChild('modalRole') modalRole!: TemplateRef<any>;
  @ViewChild('modalConfirm') modalConfirm!: TemplateRef<any>;

  allUsers: AdminUser[] = [];
  filtered: AdminUser[] = [];
  paged: AdminUser[] = [];
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  loading = false;
  saving = false;
  error: string | null = null;

  safUsers: SafUser[] = [];
  safUsersLoading = false;

  form: CreateAdminUserDto = this.emptyForm();

  userTarget: AdminUser | null = null;
  nuevoRol: 'superuser' | 'admin' | 'tecnico' = 'admin';

  deleteTarget: AdminUser | null = null;

  private modalRef?: NgbModalRef;

  constructor(
    private service: UsersAdminService,
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

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase().trim();
    this.filtered = q
      ? this.allUsers.filter(u =>
          (u.name ?? '').toLowerCase().includes(q) ||
          (u.rfc ?? '').toLowerCase().includes(q) ||
          u.role.includes(q),
        )
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

  rolLabel(role: string): string {
    if (role === 'superuser') return 'Super Usuario';
    if (role === 'admin') return 'Administrador';
    if (role === 'tecnico') return 'Técnico';
    return 'Usuario';
  }

  rolBadge(role: string): string {
    if (role === 'superuser') return 'bg-danger-subtle text-danger';
    if (role === 'admin') return 'bg-primary-subtle text-primary';
    if (role === 'tecnico') return 'bg-warning-subtle text-warning';
    return 'bg-secondary-subtle text-secondary';
  }

  openAdd(): void {
    this.form = this.emptyForm();
    this.safUsers = [];
    this.safUsersLoading = true;
    this.service.getSafUsers().subscribe({
      next: users => { this.safUsers = users; this.safUsersLoading = false; },
      error: () => { this.safUsersLoading = false; },
    });
    this.modalRef = this.modal.open(this.modalForm, { size: 'md', centered: true });
  }

  onSave(): void {
    this.saving = true;
    this.service.create(this.form).subscribe({
      next: () => { this.saving = false; this.modalRef?.close(); this.load(); },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Error al asignar rol';
      },
    });
  }

  openEditRole(u: AdminUser): void {
    this.userTarget = u;
    this.nuevoRol = u.role === 'user' ? 'admin' : u.role as 'superuser' | 'admin' | 'tecnico';
    this.modalRef = this.modal.open(this.modalRole, { size: 'sm', centered: true });
  }

  saveRole(): void {
    if (!this.userTarget?.rfc) return;
    this.saving = true;
    this.service.updateRole(this.userTarget.rfc, this.nuevoRol).subscribe({
      next: () => { this.saving = false; this.modalRef?.close(); this.load(); },
      error: () => { this.saving = false; },
    });
  }

  openDelete(u: AdminUser): void {
    this.deleteTarget = u;
    this.modalRef = this.modal.open(this.modalConfirm, { size: 'sm', centered: true });
  }

  confirmDelete(): void {
    if (!this.deleteTarget?.rfc) return;
    this.service.remove(this.deleteTarget.rfc).subscribe({
      next: () => { this.modalRef?.close(); this.deleteTarget = null; this.load(); },
    });
  }

  buscarUsuario(term: string, item: SafUser): boolean {
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const t = norm(term);
    return norm(item.name).includes(t) || norm(item.rfc ?? '').includes(t);
  }

  private emptyForm(): CreateAdminUserDto {
    return { rfc: '', role: 'admin' };
  }
}
