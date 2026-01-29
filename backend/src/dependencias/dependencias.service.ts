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

    // 1️⃣ Dependencia → Direcciones → Departamentos (SIN usuarios)
    const dependencia = await prisma.t_dependencia.findUnique({
      where: { id_Dependencia: idDependencia },
      select: {
        Nombre: true,
        t_direccion: {
          select: {
            id_Direccion: true,
            Nombre: true,
            t_departamento: {
              where: {
                Estado: 1,
              },
              select: {
                id_Departamento: true,
                Nombre: true,
              },
            },
          },
        },
      },
    });

    if (!dependencia) return null;

    // 2️⃣ Obtener IDs de departamentos
    const departamentosIds = dependencia.t_direccion
      .flatMap(dir => dir.t_departamento)
      .map(dep => dep.id_Departamento);

    // 3️⃣ Obtener usuarios activos por departamento
    const usuarios = await prisma.s_usuario.findMany({
      where: {
        Estado: 1,
        id_Departamento: {
          in: departamentosIds,
        },
      },
      select: {
        id_Usuario: true,
        Nombre: true,
        id_Departamento: true,
        s_users: {
          select: {
            rango: true,
          },
        },
      },
    });

    // 4️⃣ Obtener extensiones
    const extensiones = await prismaDirectorio.extensiones.findMany({
      where: {
        servidor_publico_id: { not: null },
      },
      select: {
        extension: true,
        servidor_publico_id: true,
      },
    });

    const extensionesMap = new Map<number, string>();

    extensiones.forEach(ext => {
      if (!ext.extension) return; // 👈 evita null

      extensionesMap.set(
        Number(ext.servidor_publico_id),
        ext.extension
      );
    });

    const usuariosPorDepartamento = new Map<number, any[]>();

    usuarios.forEach(u => {
      if (!u.id_Departamento) return; // 👈 evita null

      const extension = extensionesMap.get(u.id_Usuario);
      if (!extension) return; // solo usuarios con extensión

      if (!usuariosPorDepartamento.has(u.id_Departamento)) {
        usuariosPorDepartamento.set(u.id_Departamento, []);
      }

      usuariosPorDepartamento.get(u.id_Departamento)!.push({
        id_Usuario: u.id_Usuario,
        nombre: u.Nombre,
        rango: u.s_users?.[0]?.rango ?? null,
        extension,
      });
    });

    // 6️⃣ Armar respuesta final
    return {
      dependencia: dependencia.Nombre,
      direcciones: dependencia.t_direccion.map(dir => ({
        id_Direccion: dir.id_Direccion,
        nombre: dir.Nombre,
        departamentos: dir.t_departamento.map(dep => ({
          id_Departamento: dep.id_Departamento,
          nombre: dep.Nombre,
          usuarios: (usuariosPorDepartamento.get(dep.id_Departamento) ?? [])
            .sort((a, b) => (a.rango ?? 0) - (b.rango ?? 0))
        })),
      })),
    };
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
