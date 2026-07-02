import { Injectable, NotFoundException } from '@nestjs/common';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';

function serializeBigInt(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}

@Injectable()
export class UbicacionesService {
  async findAll() {
    const data = await prismaDirectorio.ubicaciones.findMany({
      where: { deleted_at: null },
      orderBy: { nombre: 'asc' },
    });
    return serializeBigInt(data);
  }

  async findOne(id: number) {
    const ub = await prismaDirectorio.ubicaciones.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });
    if (!ub) throw new NotFoundException(`Ubicación #${id} no encontrada`);
    return serializeBigInt(ub);
  }

  async create(dto: CreateUbicacionDto) {
    const created = await prismaDirectorio.ubicaciones.create({
      data: {
        nombre: dto.nombre,
        calle: dto.calle,
        num_ext: dto.num_ext,
        num_int: dto.num_int ?? null,
        colonia: dto.colonia,
        codigo_postal: dto.codigo_postal,
        municipio: dto.municipio,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return serializeBigInt(created);
  }

  async update(id: number, dto: UpdateUbicacionDto) {
    await this.findOne(id);
    const updated = await prismaDirectorio.ubicaciones.update({
      where: { id: BigInt(id) },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
    return serializeBigInt(updated);
  }

  async remove(id: number) {
    await this.findOne(id);
    await prismaDirectorio.ubicaciones.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });
    return { message: `Ubicación #${id} eliminada` };
  }
}
