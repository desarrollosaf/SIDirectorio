import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma-users-database/prisma/prisma';
import { UpdateUsuarioSafDto } from './dto/update-usuario-saf.dto';

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

@Injectable()
export class UsuariosSafService {
  async findAll(search?: string) {
    const usuarios = await prisma.s_usuario.findMany({
      where: { Estado: 1, deleted_at: null },
      select: {
        id_Usuario: true,
        N_Usuario: true,
        Nombre: true,
        grado_abreviado: true,
        s_users: {
          select: { id: true, rango: true },
          take: 1,
        },
      },
      orderBy: { Nombre: 'asc' },
    });

    const result = usuarios.map(u => ({
      id: u.id_Usuario,
      rfc: u.N_Usuario ?? '',
      nombre: u.Nombre ?? '',
      grado_abreviado: u.grado_abreviado ?? '',
      rango: u.s_users[0]?.rango ?? null,
      s_users_id: u.s_users[0]?.id ?? null,
    }));

    if (!search?.trim()) return result;

    const q = norm(search.trim());
    return result.filter(u => norm(u.nombre).includes(q) || norm(u.rfc).includes(q));
  }

  async update(id: number, dto: UpdateUsuarioSafDto) {
    const usuario = await prisma.s_usuario.findUnique({
      where: { id_Usuario: id },
      include: { s_users: { take: 1 } },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    await prisma.s_usuario.update({
      where: { id_Usuario: id },
      data: {
        ...(dto.nombre !== undefined && { Nombre: dto.nombre.trim().toUpperCase() }),
        ...(dto.grado_abreviado !== undefined && { grado_abreviado: dto.grado_abreviado.trim().toUpperCase() || null }),
        updated_at: new Date(),
      },
    });

    if (dto.rango !== undefined && usuario.s_users[0]) {
      await prisma.s_users.update({
        where: { id: usuario.s_users[0].id },
        data: { rango: dto.rango },
      });
    }

    return { message: 'Usuario actualizado' };
  }
}
