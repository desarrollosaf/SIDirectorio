import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma-users-database/prisma/prisma';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';
import { AsignarUbicacionDto } from './dto/asignar-ubicacion.dto';

function serializeBigInt(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}

@Injectable()
export class DependenciasUbicacionesService {
  async findAll() {
    const [dependencias, asignaciones] = await Promise.all([
      prisma.t_dependencia.findMany({
        where: { Estado: 1 },
        select: { id_Dependencia: true, nombre_completo: true, Nombre: true },
        orderBy: { orden: 'asc' },
      }),
      prismaDirectorio.ubicaciones_dependencias.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          dependencia_id: true,
          ubicaciones: { select: { id: true, nombre: true } },
        },
      }),
    ]);

    return serializeBigInt(
      dependencias.map(dep => ({
        id_Dependencia: dep.id_Dependencia,
        nombre: dep.nombre_completo || dep.Nombre,
        ubicaciones: asignaciones
          .filter(a => Number(a.dependencia_id) === dep.id_Dependencia)
          .map(a => ({ asignacion_id: a.id.toString(), ...a.ubicaciones })),
      })),
    );
  }

  async asignar(dto: AsignarUbicacionDto) {
    const existente = await prismaDirectorio.ubicaciones_dependencias.findFirst({
      where: {
        dependencia_id: BigInt(dto.dependencia_id),
        ubicacion_id: BigInt(dto.ubicacion_id),
        deleted_at: null,
      },
    });

    if (existente) return serializeBigInt(existente);

    const created = await prismaDirectorio.ubicaciones_dependencias.create({
      data: {
        dependencia_id: BigInt(dto.dependencia_id),
        ubicacion_id: BigInt(dto.ubicacion_id),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return serializeBigInt(created);
  }

  async desasignar(id: number) {
    const registro = await prismaDirectorio.ubicaciones_dependencias.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!registro) throw new NotFoundException(`Asignación #${id} no encontrada`);

    await prismaDirectorio.ubicaciones_dependencias.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });

    return { message: `Asignación #${id} eliminada` };
  }
}
