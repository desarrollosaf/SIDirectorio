import {
  Controller, Get, Post, Delete, Param, Body,
  HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { EncargadosService } from './encargados.service';

@Controller('encargados')
export class EncargadosController {
  constructor(private readonly encargadosService: EncargadosService) {}

  @Get()
  findAll() {
    return this.encargadosService.findAll();
  }

  @Post()
  create(@Body() body: { usuario_id: number; departamento_id: number }) {
    return this.encargadosService.create(body.usuario_id, body.departamento_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.encargadosService.remove(id);
  }
}
