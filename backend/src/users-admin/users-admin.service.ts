import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma-users-database/prisma/prisma';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateRoleCatalogDto } from './dto/create-role-catalog.dto';
import { UpdateRoleCatalogDto } from './dto/update-role-catalog.dto';

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

  // ── Catálogo de roles ──────────────────────────────────────────────────────

  async findAllRoles() {
    return serializeBigInt(
      await prismaDirectorio.roles_catalog.findMany({
        where: { deleted_at: null },
        orderBy: { id: 'asc' },
      }),
    );
  }

  async createRole(dto: CreateRoleCatalogDto) {
    const name = dto.name.toLowerCase().replace(/\s+/g, '_');

    const existing = await prismaDirectorio.roles_catalog.findFirst({
      where: { name },
    });
    if (existing && !existing.deleted_at) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    if (existing) {
      return serializeBigInt(
        await prismaDirectorio.roles_catalog.update({
          where: { id: existing.id },
          data: { label: dto.label, description: dto.description ?? null, deleted_at: null, updated_at: new Date() },
        }),
      );
    }

    return serializeBigInt(
      await prismaDirectorio.roles_catalog.create({
        data: { name, label: dto.label, description: dto.description ?? null, created_at: new Date(), updated_at: new Date() },
      }),
    );
  }

  async updateRoleCatalog(id: number, dto: UpdateRoleCatalogDto) {
    const existing = await prismaDirectorio.roles_catalog.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Rol no encontrado');

    return serializeBigInt(
      await prismaDirectorio.roles_catalog.update({
        where: { id },
        data: { label: dto.label, description: dto.description ?? null, updated_at: new Date() },
      }),
    );
  }

  async removeRole(id: number) {
    const existing = await prismaDirectorio.roles_catalog.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Rol no encontrado');

    const PROTECTED = ['superuser', 'admin', 'tecnico'];
    if (PROTECTED.includes(existing.name)) {
      throw new BadRequestException('No se puede eliminar un rol del sistema');
    }

    await prismaDirectorio.roles_catalog.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: `Rol "${existing.label}" eliminado` };
  }
}
