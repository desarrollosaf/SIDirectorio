import { Injectable } from '@nestjs/common';
import { prisma } from '../../prisma-users-database/prisma/prisma';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';

function serial(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}

@Injectable()
export class CatalogosService {
  async getUsuarios() {
    const usuarios = await prisma.s_usuario.findMany({
      where: { Estado: 1, deleted_at: null },
      select: {
        id_Usuario: true,
        Nombre: true,
        A_Paterno: true,
        A_Materno: true,
        Puesto: true,
        N_Usuario: true,
        id_Dependencia: true,
      },
      orderBy: [{ A_Paterno: 'asc' }, { Nombre: 'asc' }],
    });
    return serial(usuarios);
  }

  async getDepartamentosByDependencia(dependenciaId: number) {
    const departamentos = await prisma.t_departamento.findMany({
      where: { Estado: 1, id_Dependencia: dependenciaId },
      select: {
        id_Departamento: true,
        nombre_completo: true,
        Nombre: true,
        id_Direccion: true,
        t_direccion: { select: { Nombre: true, nombre_completo: true } },
      },
      orderBy: { nombre_completo: 'asc' },
    });
    return serial(departamentos);
  }

  async getDepartamentosPorUsuario(usuarioId: number) {
    const usuario = await prisma.s_usuario.findFirst({
      where: { id_Usuario: usuarioId },
      select: {
        id_Dependencia: true,
        id_Direccion: true,
        id_Departamento: true,
        s_users: { select: { rango: true } },
      },
    });

    if (!usuario) return [];

    const rango = usuario.s_users?.[0]?.rango ?? null;

    let where: any = { Estado: 1 };

    if (rango === 1 && usuario.id_Dependencia) {
      // Titular de dependencia: todos los departamentos de su dependencia
      where.id_Dependencia = usuario.id_Dependencia;
    } else if (usuario.id_Direccion) {
      // Rango 2, 3, 4, 5: todos los departamentos de su dirección
      where.id_Direccion = usuario.id_Direccion;
    }

    const departamentos = await prisma.t_departamento.findMany({
      where,
      select: {
        id_Departamento: true,
        nombre_completo: true,
        Nombre: true,
        id_Dependencia: true,
        id_Direccion: true,
        t_direccion: { select: { Nombre: true, nombre_completo: true } },
      },
      orderBy: { nombre_completo: 'asc' },
    });

    return serial(departamentos);
  }

  async getUbicaciones() {
    const ubicaciones = await prismaDirectorio.ubicaciones.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        nombre: true,
        calle: true,
        num_ext: true,
        colonia: true,
        municipio: true,
      },
      orderBy: { nombre: 'asc' },
    });
    return serial(ubicaciones);
  }
}
