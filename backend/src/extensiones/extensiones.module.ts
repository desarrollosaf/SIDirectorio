import { Module } from '@nestjs/common';
import { ExtensionesService } from './extensiones.service';
import { ExtensionesController } from './extensiones.controller';

@Module({
  controllers: [ExtensionesController],
  providers: [ExtensionesService],
})
export class ExtensionesModule {}
