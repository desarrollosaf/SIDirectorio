import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { DependenciasUbicacionesService } from './dependencias-ubicaciones.service';
import { AsignarUbicacionDto } from './dto/asignar-ubicacion.dto';

@Controller('dependencias-ubicaciones')
export class DependenciasUbicacionesController {
  constructor(private readonly service: DependenciasUbicacionesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  asignar(@Body() dto: AsignarUbicacionDto) {
    return this.service.asignar(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  desasignar(@Param('id') id: string) {
    return this.service.desasignar(+id);
  }
}
