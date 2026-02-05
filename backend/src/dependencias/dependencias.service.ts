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
    const dependencias = await prisma.t_dependencia.findMany({
      where: idDependencia === 0 ? undefined : { id_Dependencia: idDependencia },
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
      where: { servidor_publico_id: { not: null } },
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

    const extensionesMap = new Map<number, any>();

    extensiones.forEach(ext => {
      if (!ext.extension) return;

      extensionesMap.set(Number(ext.servidor_publico_id), {
        extension: ext.extension,
        ubicacion: ext.ubicaciones ?? null,
      });
    });

    // 5️⃣ Usuarios por departamento
    const usuariosPorDepartamento = new Map<number, any[]>();

    usuarios.forEach(u => {
      const ext = extensionesMap.get(u.id_Usuario);
      if (!u.id_Departamento || !ext) return;

      if (!usuariosPorDepartamento.has(u.id_Departamento)) {
        usuariosPorDepartamento.set(u.id_Departamento, []);
      }

      usuariosPorDepartamento.get(u.id_Departamento)!.push({
        nombre: u.Nombre,
        cargo: u.Puesto,
        rango: u.s_users?.[0]?.rango ?? null,
        extension: ext.extension,
        ubicacion: ext.ubicacion,
      });
    });

    // ✅ Dirección especial (UNA SOLA VEZ)
    const direccionJunta = {
      id_Direccion: 1,
      nombre: 'JUNTA DE COORDINACIÓN POLÍTICA',
      departamentos: [
        {
          nombre: 'Presidencia',
          usuarios: [{
            nombre: 'DIP. VAZQUEZ RODRIGUEZ JOSE FRANCISCO',
            cargo: 'PRESIDENTE DE LA JUNTA DE COORDINACIÓN POLÍTICA',
            extension: '6494',
          }],
        },
        {
          nombre: 'Secretaría Ejecutiva',
          usuarios: [{
            nombre: 'D. EN D. OLVERA HERREROS OMAR SALVADOR',
            cargo: 'SECRETARÍA EJECUTIVA',
            extension: '6609',
          }],
        },
        {
          nombre: 'Recepción',
          usuarios: [{
            nombre: 'RECEPCIÓN DE PRESIDENCIA',
            cargo: 'RECEPCIÓN',
            extension: '6606',
          }],
        },
      ],
    };

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
        ubicacion: ubicacionDependencia,
        direcciones: dep.t_direccion.map(dir => {

          // ⭐ AQUÍ va la lógica especial
          if (
            dir.id_Direccion === 1 &&
            dir.nombre_completo === 'JUNTA DE COORDINACIÓN POLÍTICA'
          ) {
            return direccionJunta;
          }

          // Dirección normal
          return {
            id_Direccion: dir.id_Direccion,
            nombre: dir.nombre_completo,
            departamentos: dir.t_departamento.map(dpto => ({
              id_Departamento: dpto.id_Departamento,
              nombre: dpto.nombre_completo,
              usuarios: (usuariosPorDepartamento.get(dpto.id_Departamento) ?? [])
                .sort((a, b) => (a.rango ?? 0) - (b.rango ?? 0)),
            })),
          };
        }),
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
