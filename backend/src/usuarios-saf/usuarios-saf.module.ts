import { Module } from '@nestjs/common';
import { UsuariosSafController } from './usuarios-saf.controller';
import { UsuariosSafService } from './usuarios-saf.service';

@Module({
  controllers: [UsuariosSafController],
  providers: [UsuariosSafService],
})
export class UsuariosSafModule {}
