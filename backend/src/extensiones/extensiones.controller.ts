import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ExtensionesService } from './extensiones.service';
import { CreateExtensioneDto } from './dto/create-extensione.dto';
import { UpdateExtensioneDto } from './dto/update-extensione.dto';

@Controller('extensiones')
export class ExtensionesController {
  constructor(private readonly extensionesService: ExtensionesService) {}

  @Post()
  create(@Body() dto: CreateExtensioneDto) {
    return this.extensionesService.create(dto);
  }

  @Get()
  findAll() {
    return this.extensionesService.findAllExtensiones();
  }

  @Get('usuarios')
  findUsuariosConExtension() {
    return this.extensionesService.usuariosConExtension();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extensionesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExtensioneDto) {
    return this.extensionesService.update(+id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.extensionesService.remove(+id);
  }
}
