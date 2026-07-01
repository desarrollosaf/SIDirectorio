import { Module } from '@nestjs/common';
import { EncargadosController } from './encargados.controller';
import { EncargadosService } from './encargados.service';

@Module({
  controllers: [EncargadosController],
  providers: [EncargadosService],
})
export class EncargadosModule {}
