import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';

@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get()
  findAll() {
    return this.serviciosService.findAll();
  }

  @Post()
  create(@Body() body: { nombre: string; extension: string }) {
    return this.serviciosService.create(body.nombre, body.extension);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { nombre: string; extension: string },
  ) {
    return this.serviciosService.update(id, body.nombre, body.extension);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }
}
