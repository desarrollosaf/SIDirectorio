import { Injectable } from '@nestjs/common';
import { CreateDependenciaDto } from './dto/create-dependencia.dto';
import { UpdateDependenciaDto } from './dto/update-dependencia.dto';
import { prisma } from '../../prisma-users-database/prisma/prisma'
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma'
import PDFDocument from 'pdfkit';

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
          where: { Estado: 1 }, // ✅ aquí va
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
          where: { Estado: 1 },
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

    const dependenciasExcluirRango4 = [0, 1, 2, 4, 5, 6, 7, 8];
    const dependenciasExcluirRango5 = [3];
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
        extension_privada: true, // 👈 NUEVO
        servidor_publico_id: true,
        ubicaciones: {
          select: {
            id: true,
            nombre: true,
            calle: true,
            num_ext: true,
            num_int: true,
            colonia: true,
            municipio: true,
            codigo_postal: true,
          },
        },
      },
    });


    const extensionesMap = new Map<number, any>();

    extensiones.forEach(ext => {
      if (!ext.extension && !ext.extension_privada) return;

      extensionesMap.set(Number(ext.servidor_publico_id), {
        extension_publica: ext.extension ?? null,
        extension_privada: ext.extension_privada ?? null,
        ubicacion: ext.ubicaciones ?? null,
      });
    });

    // 5️⃣ Usuarios por departamento
    const usuariosPorDepartamento = new Map<number, any[]>();
    usuarios.forEach(u => {
      if (!u.id_Departamento) return;

      const rango = u.s_users?.[0]?.rango ?? null;

      // 🔒 Reglas por dependencia
      if (
        dependenciasExcluirRango4.includes(idDependencia) &&
        rango === 4
      ) {
        return;
      }

      if (
        dependenciasExcluirRango5.includes(idDependencia) &&
        rango === 5
      ) {
        return;
      }

      const ext = extensionesMap.get(u.id_Usuario);

      if (!usuariosPorDepartamento.has(u.id_Departamento)) {
        usuariosPorDepartamento.set(u.id_Departamento, []);
      }

      const extension = ext?.extension_publica ?? ext?.extension_privada ?? '';

      usuariosPorDepartamento.get(u.id_Departamento)!.push({
        id_Usuario: u.id_Usuario,
        nombre: u.Nombre,
        cargo: u.Puesto,
        rango,
        extension: ext?.extension_publica ?? ext?.extension_privada ?? null,
        extension_publica: ext?.extension_publica ?? null,
        extension_privada: ext?.extension_privada ?? null,
        ubicacion: ext?.ubicacion ?? null,
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
            departamentos: dir.t_departamento.map(dpto => {
              const usuarios =
                (usuariosPorDepartamento.get(dpto.id_Departamento) ?? [])
                  .sort((a, b) => (a.rango ?? 0) - (b.rango ?? 0));

              return {
                id_Departamento: dpto.id_Departamento,
                nombre: dpto.nombre_completo,
                usuarios, // ← puede ser []
              };
            }),
          };
        }),
      };
    });
  }

  async findExtensionespdf(idDependencia: number) {

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

    // 🔹 Crear relación Departamento → Dependencia
    const departamentosInfo = dependencias
      .flatMap(dep =>
        dep.t_direccion.flatMap(dir =>
          dir.t_departamento.map(dpto => ({
            id_Departamento: dpto.id_Departamento,
            id_Dependencia: dep.id_Dependencia,
          }))
        )
      );

    const departamentoDependenciaMap = new Map<number, number>();

    departamentosInfo.forEach(d => {
      departamentoDependenciaMap.set(d.id_Departamento, d.id_Dependencia);
    });

    // 2️⃣ IDs de departamentos
    const departamentosIds = dependencias
      .flatMap(dep => dep.t_direccion)
      .flatMap(dir => dir.t_departamento)
      .map(dep => dep.id_Departamento);

    const dependenciasExcluirRango4 = [0, 1, 2, 4, 5, 6, 7, 8];
    const dependenciasExcluirRango5 = [3];
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
        extension_privada: true, // 👈 NUEVO
        servidor_publico_id: true,
        ubicaciones: {
          select: {
            id: true,
            nombre: true,
            calle: true,
            num_ext: true,
            num_int: true,
            colonia: true,
            municipio: true,
            codigo_postal: true,
          },
        },
      },
    });


    const extensionesMap = new Map<number, any>();

    extensiones.forEach(ext => {
      extensionesMap.set(Number(ext.servidor_publico_id), {
        extension_publica: ext.extension ?? null,
        extension_privada: ext.extension_privada ?? null,
        ubicacion: ext.ubicaciones ?? null,
      });
    });

    const encargados = await prisma.encargados.findMany({
      where: { deleted_at: null },
      include: {
        t_departamento: {
          select: { nombre_completo: true },
        },
      },
    });

    // 5️⃣ Usuarios por departamento
    const usuariosPorDepartamento = new Map<number, any[]>();
    usuarios.forEach(u => {
      if (!u.id_Departamento) return;

      const rango = u.s_users?.[0]?.rango ?? null;
      const dependenciaUsuario = departamentoDependenciaMap.get(u.id_Departamento);
      if (!dependenciaUsuario) return;

      // ─── Lógica de encargados ───────────────────────────────────────────
      const encargadoEntry = encargados.find(
        enc => Number(enc.usuario_id) === u.id_Usuario,
      );
      const ext = extensionesMap.get(u.id_Usuario);
      if (encargadoEntry) {
        const tieneExtension = ext?.extension_publica || ext?.extension_privada;
        if (!tieneExtension) return;
      }

      if (!usuariosPorDepartamento.has(u.id_Departamento)) {
        usuariosPorDepartamento.set(u.id_Departamento, []);
      }


      // 🔒 Reglas por dependencia
      if (dependenciasExcluirRango4.includes(dependenciaUsuario) && rango === 4) return;
      if (dependenciasExcluirRango5.includes(dependenciaUsuario) && rango === 5) return;

      if (!usuariosPorDepartamento.has(u.id_Departamento)) {
        usuariosPorDepartamento.set(u.id_Departamento, []);
      }

      usuariosPorDepartamento.get(u.id_Departamento)!.push({
        id_Usuario: u.id_Usuario,
        nombre: encargadoEntry && Number(encargadoEntry.departamento_id) === Number(u.id_Departamento)
          ? `${u.Nombre} (Encargado)`
          : u.Nombre,
        cargo: u.Puesto,
        rango,
        extension: ext?.extension_publica ?? ext?.extension_privada ?? null,
        extension_publica: ext?.extension_publica ?? null,
        extension_privada: ext?.extension_privada ?? null,
        ubicacion: ext?.ubicacion ?? null,
        ubicacion_id: ext?.ubicacion ? Number(ext.ubicacion.id) : null,
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


    // ─── Ubicaciones por dependencia (para OSFEM) ──────────────────────────────
    const ubicacionesPorDependencia = await prismaDirectorio.ubicaciones_dependencias.findMany({
      where: { deleted_at: null },
      select: {
        dependencia_id: true,
        ubicaciones: {
          select: {
            id: true,
            nombre: true,
            calle: true,
            num_ext: true,
            num_int: true,
            colonia: true,
            municipio: true,
            codigo_postal: true,
          },
        },
      },
    });

    // Mapa: dependencia_id → ubicaciones[]
    const ubicacionesMap = new Map<number, any[]>();
    ubicacionesPorDependencia.forEach(ud => {
      const depId = Number(ud.dependencia_id);
      if (!ubicacionesMap.has(depId)) ubicacionesMap.set(depId, []);
      ubicacionesMap.get(depId)!.push(ud.ubicaciones);
    });

    // ─── Mapa inverso: ubicacion_id → Set de id_Departamento ──────────────────
    const ubicacionDepartamentosMap = new Map<number, Set<number>>();

    usuarios.forEach(u => {
      if (!u.id_Departamento) return;
      const ext = extensionesMap.get(u.id_Usuario);
      if (!ext?.ubicacion) return;
      const ubId = Number(ext.ubicacion.id);
      if (!ubicacionDepartamentosMap.has(ubId)) {
        ubicacionDepartamentosMap.set(ubId, new Set());
      }
      ubicacionDepartamentosMap.get(ubId)!.add(u.id_Departamento);
    });


    function agruparDireccionesPorUbicacion(
      direcciones: any[],
      usuariosPorDepartamento: Map<number, any[]>,
      ubicacionesDep: any[],
      ubicacionDepartamentosMap: Map<number, Set<number>>,
    ): any[] {

      return ubicacionesDep
        .filter((ub: any) => ub != null)
        .map((ub: any) => {
          const ubId = Number(ub.id);
          const dptosEnUbicacion = ubicacionDepartamentosMap.get(ubId) ?? new Set();

          // Filtrar solo las direcciones que tienen al menos un departamento en esta ubicación
          const direccionesDeUbicacion = direcciones
            .map(dir => {
              // Filtrar departamentos de esta dirección que pertenecen a esta ubicación
              const departamentosFiltrados = (dir.departamentos ?? []).filter(
                (dpto: any) => dptosEnUbicacion.has(dpto.id_Departamento),
              );

              if (departamentosFiltrados.length === 0) return null;

              return {
                ...dir,
                departamentos: departamentosFiltrados,
              };
            })
            .filter(Boolean);

          return {
            ubicacion: ub,
            direcciones: direccionesDeUbicacion,
          };
        });
    }

    const servicios = await prismaDirectorio.servicios.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        nombre: true,
        extension: true,
      },
      orderBy: { nombre: 'asc' },
    });


    const encargadosPorUsuario = new Map<number, string>();
    encargados.forEach(enc => {
      if (enc.usuario_id && enc.t_departamento?.nombre_completo) {
        encargadosPorUsuario.set(
          Number(enc.usuario_id),
          enc.t_departamento.nombre_completo,
        );
      }
    });

    // 6️⃣ Respuesta final
    const dependenciasData = dependencias.map(dep => {

      let ubicacionDependencia: any = null;

      dep.t_direccion.forEach(dir => {
        dir.t_departamento.forEach(dpto => {
          const usuarios = usuariosPorDepartamento.get(dpto.id_Departamento);
          if (usuarios && usuarios.length && !ubicacionDependencia) {
            ubicacionDependencia = usuarios[0].ubicacion;
          }
        });
      });

      const esOsfem = (dep.nombre_completo ?? '')
        .toUpperCase()
        .includes('ÓRGANO SUPERIOR DE FISCALIZACIÓN');

      const encargadosParaPdf = encargados.map(enc => ({
        usuario_id: Number(enc.usuario_id),
        departamento_id: Number(enc.departamento_id),
        t_departamento: enc.t_departamento,
      }));

      // Construir direcciones normales (igual que antes)
      const direcciones = dep.t_direccion.map(dir => {
        if (
          dir.id_Direccion === 1 &&
          dir.nombre_completo === 'JUNTA DE COORDINACIÓN POLÍTICA'
        ) {
          return direccionJunta;
        }

        return {
          id_Direccion: dir.id_Direccion,
          nombre: dir.nombre_completo,
          departamentos: dir.t_departamento.filter(dpto => dpto.id_Departamento !== 109)
            .map(dpto => {
              const usuarios =
                (usuariosPorDepartamento.get(dpto.id_Departamento) ?? [])
                  .sort((a, b) => (a.rango ?? 0) - (b.rango ?? 0));

              return {
                id_Departamento: dpto.id_Departamento,
                nombre: dpto.nombre_completo,
                usuarios,
                encargados: encargados
                  .filter(enc => enc.departamento_id === dpto.id_Departamento)
                  .map(enc => ({
                    usuario_id: Number(enc.usuario_id),
                    departamento_id: enc.departamento_id,
                    t_departamento: enc.t_departamento,
                  })),
              };
            }),
        };
      });

      return {
        id_Dependencia: dep.id_Dependencia,
        dependencia: dep.nombre_completo,
        ubicacion: ubicacionDependencia,
        encargados: encargadosParaPdf,
        ubicaciones_dep: ubicacionesMap.get(dep.id_Dependencia) ?? [],
        // Solo OSFEM tendrá grupos_ubicacion poblado
        grupos_ubicacion: esOsfem
          ? agruparDireccionesPorUbicacion(
            direcciones,
            usuariosPorDepartamento,
            ubicacionesMap.get(dep.id_Dependencia) ?? [],
            ubicacionDepartamentosMap,  // 👈
          )
          : [],
        direcciones,
      };
    });


    return {
      dependencias: dependenciasData,
      servicios,
    };


  }



  async encargadosPorDepartamento(idDepartamento: number) {
    const encargados = await prisma.encargados.findMany({
      where: {
        departamento_id: idDepartamento,
        deleted_at: null,
        s_usuario: {
          isNot: null,
        },
      },
      include: {
        s_usuario: true,
        t_departamento: true,
      },
    });

    return JSON.parse(
      JSON.stringify(encargados, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ),
    );
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
