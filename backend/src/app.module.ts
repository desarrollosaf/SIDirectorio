import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DependenciasModule } from './dependencias/dependencias.module';
import { ExtensionesModule } from './extensiones/extensiones.module';

@Module({
  imports: [
    UsersModule, 
    DependenciasModule, 
    ExtensionesModule
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}
