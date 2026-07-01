import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExtensioneDto } from './dto/create-extensione.dto';
import { UpdateExtensioneDto } from './dto/update-extensione.dto';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';
import { prisma } from '../../prisma-users-database/prisma/prisma';

function serializeBigInt(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}

@Injectable()
export class ExtensionesService {
  async findAllExtensiones() {
    const extensiones = await prismaDirectorio.extensiones.findMany({
      select: {
        id: true,
        extension: true,
        extension_privada: true,
        ubicaciones: {
          select: { id: true, nombre: true },
        },
      },
    });
    return serializeBigInt(extensiones);
  }

  async usuariosConExtension() {
    const extensiones = await prismaDirectorio.extensiones.findMany({
      where: { servidor_publico_id: { not: null } },
      select: {
        id: true,
        extension: true,
        extension_privada: true,
        servidor_publico_id: true,
        personal_operativo_id: true,
        ubicaciones: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (extensiones.length === 0) return [];

    const servidorIds = extensiones
      .map(e => e.servidor_publico_id)
      .filter(Boolean)
      .map(id => Number(id));

    const operativoIds = extensiones
      .map(e => e.personal_operativo_id)
      .filter(Boolean)
      .map(id => Number(id));

    const allIds = [...new Set([...servidorIds, ...operativoIds])];

    const usuarios = await prisma.s_usuario.findMany({
      where: { Estado: 1, id_Usuario: { in: allIds } },
      select: {
        id_Usuario: true,
        Nombre: true,
        A_Paterno: true,
        A_Materno: true,
        N_Usuario: true,
        Puesto: true,
      },
    });

    const resultado = extensiones.map(ext => {
      const usuario = usuarios.find(
        u => u.id_Usuario === Number(ext.servidor_publico_id),
      ) ?? null;
      const personal_operativo = ext.personal_operativo_id
        ? (usuarios.find(u => u.id_Usuario === Number(ext.personal_operativo_id)) ?? null)
        : null;
      return {
        extension_id: ext.id.toString(),
        extension: ext.extension,
        extension_privada: ext.extension_privada,
        ubicacion: ext.ubicaciones
          ? { id: ext.ubicaciones.id.toString(), nombre: ext.ubicaciones.nombre }
          : null,
        usuario,
        personal_operativo,
      };
    });

    return serializeBigInt(resultado);
  }

  async create(dto: CreateExtensioneDto) {
    const created = await prismaDirectorio.extensiones.create({
      data: {
        extension: dto.extension || null,
        extension_privada: dto.extension_privada,
        ubicacion_id: dto.ubicacion_id ? BigInt(dto.ubicacion_id) : null,
        servidor_publico_id: dto.servidor_publico_id
          ? BigInt(dto.servidor_publico_id)
          : null,
        personal_operativo_id: dto.personal_operativo_id
          ? BigInt(dto.personal_operativo_id)
          : null,
      },
    });
    return serializeBigInt(created);
  }

  async findOne(id: number) {
    const ext = await prismaDirectorio.extensiones.findUnique({
      where: { id: BigInt(id) },
      include: { ubicaciones: true },
    });
    if (!ext) throw new NotFoundException(`Extensión #${id} no encontrada`);
    return serializeBigInt(ext);
  }

  async update(id: number, dto: UpdateExtensioneDto) {
    const data: any = {};
    if (dto.extension !== undefined) data.extension = dto.extension || null;
    if (dto.extension_privada !== undefined) data.extension_privada = dto.extension_privada;
    if (dto.ubicacion_id !== undefined)
      data.ubicacion_id = dto.ubicacion_id ? BigInt(dto.ubicacion_id) : null;
    if (dto.servidor_publico_id !== undefined)
      data.servidor_publico_id = dto.servidor_publico_id ? BigInt(dto.servidor_publico_id) : null;
    if ('personal_operativo_id' in dto)
      data.personal_operativo_id = dto.personal_operativo_id
        ? BigInt(dto.personal_operativo_id)
        : null;

    const updated = await prismaDirectorio.extensiones.update({
      where: { id: BigInt(id) },
      data,
    });
    return serializeBigInt(updated);
  }

  async remove(id: number) {
    await prismaDirectorio.extensiones.delete({ where: { id: BigInt(id) } });
    return { message: `Extensión #${id} eliminada` };
  }
}
