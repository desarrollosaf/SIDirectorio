import { Injectable } from '@nestjs/common';
import { CreateExtensioneDto } from './dto/create-extensione.dto';
import { UpdateExtensioneDto } from './dto/update-extensione.dto';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma'
import { prisma } from '../../prisma-users-database/prisma/prisma'

@Injectable()
export class ExtensionesService {
  create(createExtensioneDto: CreateExtensioneDto) {
    return 'This action adds a new extensione';
  }

  async findAllExtensiones() {
    const extensiones = await prismaDirectorio.extensiones.findMany({
      select: {
        id: true,
        extension: true,
        extension_privada: true,
        ubicaciones: {
          select: {
            id: true,
            nombre: true, // ajusta al campo real
          },
        },
      },
    });

    return JSON.parse(
      JSON.stringify(extensiones, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ),
    );
  }



  async usuariosConExtension() {

    // 1️⃣ Obtener extensiones con servidor_publico_id
    const extensiones = await prismaDirectorio.extensiones.findMany({
      where: {
        servidor_publico_id: {
          not: null,
        },
      },
      select: {
        id: true,
        extension: true,
        servidor_publico_id: true,
        ubicaciones: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (extensiones.length === 0) return [];

    // 2️⃣ Extraer ids y convertir BigInt → number
    const usuariosIds = extensiones
      .map(e => e.servidor_publico_id)
      .filter(Boolean)
      .map(id => Number(id));

    const usuarios = await prisma.s_usuario.findMany({
      where: {
        Estado: 1,
        id_Usuario: {
          in: usuariosIds,
        },
      },
      include: {
        s_users: {
          select: {
            id: true,
            username: true,
            rango: true,
          },
        },
      },
    });

    function serializeBigInt(data: any) {
      return JSON.parse(
        JSON.stringify(data, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ),
      );
    }

    // 4️⃣ Unir resultados (JOIN manual)
    const resultado = extensiones.map(ext => {
      const usuario = usuarios.find(
        u => u.id_Usuario === Number(ext.servidor_publico_id),
      );

      return {
        extension_id: ext.id.toString(),
        extension: ext.extension,
        ubicacion: ext.ubicaciones
          ? {
            id: ext.ubicaciones.id.toString(),
            nombre: ext.ubicaciones.nombre,
          }
          : null,
        usuario: usuario ?? null,
      };
    });

    return serializeBigInt(resultado);
  }

  findAll() {
    return `This action returns all extensiones`;
  }

  findOne(id: number) {
    return `This action returns a #${id} extensione`;
  }

  update(id: number, updateExtensioneDto: UpdateExtensioneDto) {
    return `This action updates a #${id} extensione`;
  }

  remove(id: number) {
    return `This action removes a #${id} extensione`;
  }
}
