import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma-users-database/prisma/prisma';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

function serializeBigInt(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}

@Injectable()
export class UsersAdminService {
  async findAll() {
    const roles = await prismaDirectorio.user_roles.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
    });

    if (roles.length === 0) return [];

    const rfcs = roles.map(r => r.rfc);
    const safUsers = await prisma.s_usuario.findMany({
      where: { N_Usuario: { in: rfcs } },
      select: { id_Usuario: true, N_Usuario: true, Nombre: true, C_Electronico: true },
    });

    const userMap = new Map(safUsers.map(u => [u.N_Usuario, u]));

    return serializeBigInt(
      roles.map(r => {
        const u = userMap.get(r.rfc);
        return {
          id: r.id.toString(),
          rfc: r.rfc,
          name: u ? u.Nombre.trim() : null,
          email: u?.C_Electronico ?? null,
          role: r.role,
          created_at: r.created_at?.toISOString() ?? null,
        };
      }),
    );
  }

  async findActiveSafUsers() {
    const users = await prisma.s_usuario.findMany({
      where: { Estado: 1, deleted_at: null },
      select: { id_Usuario: true, N_Usuario: true, Nombre: true },
      orderBy: { Nombre: 'asc' },
    });

    return users.map(u => ({
      id: u.id_Usuario,
      rfc: u.N_Usuario,
      name: u.Nombre.trim(),
    }));
  }

  async create(dto: CreateUserAdminDto) {
    const rfcUpper = dto.rfc.toUpperCase();

    const existing = await prismaDirectorio.user_roles.findFirst({
      where: { rfc: rfcUpper, deleted_at: null },
    });
    if (existing) throw new ConflictException('Este usuario ya tiene un rol asignado');

    const deleted = await prismaDirectorio.user_roles.findFirst({
      where: { rfc: rfcUpper, deleted_at: { not: null } },
    });

    if (deleted) {
      return prismaDirectorio.user_roles.update({
        where: { id: deleted.id },
        data: { role: dto.role, deleted_at: null, updated_at: new Date() },
      });
    }

    return prismaDirectorio.user_roles.create({
      data: { rfc: rfcUpper, role: dto.role, created_at: new Date(), updated_at: new Date() },
    });
  }

  async updateRole(rfc: string, dto: UpdateRoleDto) {
    const rfcUpper = rfc.toUpperCase();

    const existing = await prismaDirectorio.user_roles.findFirst({
      where: { rfc: rfcUpper },
    });
    if (!existing) throw new NotFoundException('Usuario no encontrado en roles');

    await prismaDirectorio.user_roles.update({
      where: { id: existing.id },
      data: { role: dto.role, deleted_at: null, updated_at: new Date() },
    });

    return { rfc: rfcUpper, role: dto.role };
  }

  async remove(rfc: string) {
    const rfcUpper = rfc.toUpperCase();

    const existing = await prismaDirectorio.user_roles.findFirst({
      where: { rfc: rfcUpper, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    await prismaDirectorio.user_roles.update({
      where: { id: existing.id },
      data: { deleted_at: new Date() },
    });

    return { message: `Acceso de ${rfcUpper} eliminado` };
  }

}
