import { Module } from '@nestjs/common';
import { DependenciasUbicacionesService } from './dependencias-ubicaciones.service';
import { DependenciasUbicacionesController } from './dependencias-ubicaciones.controller';

@Module({
  controllers: [DependenciasUbicacionesController],
  providers: [DependenciasUbicacionesService],
})
export class DependenciasUbicacionesModule {}
