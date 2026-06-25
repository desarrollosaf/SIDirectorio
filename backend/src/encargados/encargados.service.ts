import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma-users-database/prisma/prisma';

@Injectable()
export class EncargadosService {
  async findAll() {
    const encargados = await prisma.encargados.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        usuario_id: true,
        departamento_id: true,
        s_usuario: {
          select: {
            id_Usuario: true,
            Nombre: true,
            A_Paterno: true,
            A_Materno: true,
            Puesto: true,
            id_Dependencia: true,
          },
        },
        t_departamento: {
          select: {
            id_Departamento: true,
            nombre_completo: true,
            Nombre: true,
            id_Dependencia: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
    return encargados;
  }

  async create(usuarioId: number, departamentoId: number) {
    const existing = await prisma.encargados.findFirst({
      where: { usuario_id: usuarioId, departamento_id: departamentoId, deleted_at: null },
    });
    if (existing) return existing;

    return prisma.encargados.create({
      data: {
        usuario_id: usuarioId,
        departamento_id: departamentoId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async remove(id: number) {
    const enc = await prisma.encargados.findFirst({ where: { id, deleted_at: null } });
    if (!enc) throw new NotFoundException(`Encargado #${id} no encontrado`);
    await prisma.encargados.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { message: `Encargado #${id} eliminado` };
  }
}
