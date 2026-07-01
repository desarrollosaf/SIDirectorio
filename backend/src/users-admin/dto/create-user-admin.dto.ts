export class CreateUserAdminDto {
  rfc!: string;
  role!: 'superuser' | 'admin';
}
