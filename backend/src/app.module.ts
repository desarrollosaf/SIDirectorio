import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DependenciasModule } from './dependencias/dependencias.module';
import { ExtensionesModule } from './extensiones/extensiones.module';
import { AuthModule } from './auth/auth.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { EncargadosModule } from './encargados/encargados.module';
import { ServiciosModule } from './servicios/servicios.module';

@Module({
  imports: [
    UsersModule,
    DependenciasModule,
    ExtensionesModule,
    AuthModule,
    CatalogosModule,
    EncargadosModule,
    ServiciosModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}
