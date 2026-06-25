import { Injectable, NotFoundException } from '@nestjs/common';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';

@Injectable()
export class ServiciosService {
  async findAll() {
    return prismaDirectorio.servicios.findMany({
      where: { deleted_at: null },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(nombre: string, extension: string) {
    return prismaDirectorio.servicios.create({
      data: { nombre, extension, created_at: new Date(), updated_at: new Date() },
    });
  }

  async update(id: number, nombre: string, extension: string) {
    const s = await prismaDirectorio.servicios.findFirst({ where: { id, deleted_at: null } });
    if (!s) throw new NotFoundException(`Servicio #${id} no encontrado`);
    return prismaDirectorio.servicios.update({
      where: { id },
      data: { nombre, extension, updated_at: new Date() },
    });
  }

  async remove(id: number) {
    const s = await prismaDirectorio.servicios.findFirst({ where: { id, deleted_at: null } });
    if (!s) throw new NotFoundException(`Servicio #${id} no encontrado`);
    await prismaDirectorio.servicios.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { message: `Servicio #${id} eliminado` };
  }
}
