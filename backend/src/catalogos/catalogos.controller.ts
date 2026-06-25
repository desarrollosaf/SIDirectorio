import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';

@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get('usuarios')
  getUsuarios() {
    return this.catalogosService.getUsuarios();
  }

  @Get('ubicaciones')
  getUbicaciones() {
    return this.catalogosService.getUbicaciones();
  }

  @Get('departamentos/:dependenciaId')
  getDepartamentos(@Param('dependenciaId', ParseIntPipe) dependenciaId: number) {
    return this.catalogosService.getDepartamentosByDependencia(dependenciaId);
  }

  @Get('departamentos-por-usuario/:usuarioId')
  getDepartamentosPorUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.catalogosService.getDepartamentosPorUsuario(usuarioId);
  }
}
