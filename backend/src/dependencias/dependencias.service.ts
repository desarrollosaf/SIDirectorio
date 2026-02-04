import { Injectable } from '@nestjs/common';
import { CreateDependenciaDto } from './dto/create-dependencia.dto';
import { UpdateDependenciaDto } from './dto/update-dependencia.dto';
import { prisma } from '../../prisma-users-database/prisma/prisma'
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma'

@Injectable()
export class DependenciasService {
  create(createDependenciaDto: CreateDependenciaDto) {
    return 'This action adds a new dependencia';
  }

  async findAll() {
    return prisma.t_dependencia.findMany({
      select: {
        id_Dependencia: true,
        Nombre: true,
      },
    });
  }

  async findDireccionesByDependencia(idDependencia: number) {
    return prisma.t_dependencia.findUnique({
      where: { id_Dependencia: idDependencia },
      select: {
        Nombre: true,
        t_direccion: {
          select: {
            id_Direccion: true,
            Nombre: true,
            t_departamento: {
              select: {
                id_Departamento: true,
                Nombre: true,
              },
            },
          },
        },
      },
    });
  }

  async findDireccionesByDependenciaConExtensiones(idDependencia: number) {

    // 1️⃣ Dependencias → Direcciones → Departamentos
    const dependencias = idDependencia === 0
      ? await prisma.t_dependencia.findMany({
        select: {
          id_Dependencia: true,
          nombre_completo: true,
          t_direccion: {
            select: {
              id_Direccion: true,
              nombre_completo: true,
              t_departamento: {
                where: { Estado: 1 },
                select: {
                  id_Departamento: true,
                  nombre_completo: true,
                },
              },
            },
          },
        },
      })
      : await prisma.t_dependencia.findMany({
        where: { id_Dependencia: idDependencia },
        select: {
          id_Dependencia: true,
          nombre_completo: true,
          t_direccion: {
            select: {
              id_Direccion: true,
              nombre_completo: true,
              t_departamento: {
                where: { Estado: 1 },
                select: {
                  id_Departamento: true,
                  nombre_completo: true,
                },
              },
            },
          },
        },
      });

    if (!dependencias.length) return null;

    // 2️⃣ IDs de departamentos
    const departamentosIds = dependencias
      .flatMap(dep => dep.t_direccion)
      .flatMap(dir => dir.t_departamento)
      .map(dep => dep.id_Departamento);

    // 3️⃣ Usuarios activos
    const usuarios = await prisma.s_usuario.findMany({
      where: {
        Estado: 1,
        id_Departamento: { in: departamentosIds },
      },
      select: {
        id_Usuario: true,
        Nombre: true,
        id_Departamento: true,
        Puesto: true,
        s_users: {
          select: { rango: true },
        },
      },
    });

    // 4️⃣ Extensiones
    const extensiones = await prismaDirectorio.extensiones.findMany({
      where: {
        servidor_publico_id: { not: null },
      },
      select: {
        extension: true,
        servidor_publico_id: true,
        ubicaciones: {
          select: {
            calle: true,
            num_ext: true,
            num_int: true,
            colonia: true,
            codigo_postal: true,
          },
        },
      },
    });

    const extensionesMap = new Map<number, {
      extension: string;
      ubicacion: {
        calle: string | null;
        num_ext: string | null;
        num_int: string | null;
        colonia: string | null;
        codigo_postal: string | null;
      } | null;
    }>();

    extensiones.forEach(ext => {
      if (!ext.extension) return;

      extensionesMap.set(
        Number(ext.servidor_publico_id),
        {
          extension: ext.extension,
          ubicacion: ext.ubicaciones
            ? {
              calle: ext.ubicaciones.calle ?? null,
              num_ext: ext.ubicaciones.num_ext ?? null,
              num_int: ext.ubicaciones.num_int ?? null,
              colonia: ext.ubicaciones.colonia ?? null,
              codigo_postal: ext.ubicaciones.codigo_postal ?? null,
            }
            : null,
        }
      );
    });

    // 5️⃣ Usuarios por departamento
    const usuariosPorDepartamento = new Map<number, any[]>();

    usuarios.forEach(u => {
      if (!u.id_Departamento) return;

      const extData = extensionesMap.get(u.id_Usuario);
      if (!extData) return;

      if (!usuariosPorDepartamento.has(u.id_Departamento)) {
        usuariosPorDepartamento.set(u.id_Departamento, []);
      }

      usuariosPorDepartamento.get(u.id_Departamento)!.push({
        id_Usuario: u.id_Usuario,
        nombre: u.Nombre,
        cargo: u.Puesto,
        rango: u.s_users?.[0]?.rango ?? null,
        extension: extData.extension,
        ubicacion: extData.ubicacion,
      });
    });

    // 6️⃣ Respuesta final
    return dependencias.map(dep => {

      let ubicacionDependencia: any = null;

      dep.t_direccion.forEach(dir => {
        dir.t_departamento.forEach(dpto => {
          const usuarios = usuariosPorDepartamento.get(dpto.id_Departamento);
          if (usuarios && usuarios.length && !ubicacionDependencia) {
            ubicacionDependencia = usuarios[0].ubicacion;
          }
        });
      });

      return {
        id_Dependencia: dep.id_Dependencia,
        dependencia: dep.nombre_completo,
        ubicacion: ubicacionDependencia, // 👈 AQUÍ
        direcciones: dep.t_direccion.map(dir => ({
          id_Direccion: dir.id_Direccion,
          nombre: dir.nombre_completo,
          departamentos: dir.t_departamento.map(dpto => ({
            id_Departamento: dpto.id_Departamento,
            nombre: dpto.nombre_completo,
            usuarios: (usuariosPorDepartamento.get(dpto.id_Departamento) ?? [])
              .sort((a, b) => (a.rango ?? 0) - (b.rango ?? 0)),
          })),
        })),
      };
    });
  }



  findOne(id: number) {
    return `This action returns a #${id} dependencia`;
  }

  update(id: number, updateDependenciaDto: UpdateDependenciaDto) {
    return `This action updates a #${id} dependencia`;
  }

  remove(id: number) {
    return `This action removes a #${id} dependencia`;
  }
}
