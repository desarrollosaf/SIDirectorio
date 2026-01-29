import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExtensionesService } from './extensiones.service';
import { CreateExtensioneDto } from './dto/create-extensione.dto';
import { UpdateExtensioneDto } from './dto/update-extensione.dto';

@Controller('extensiones')
export class ExtensionesController {
  constructor(private readonly extensionesService: ExtensionesService) {}

  @Post()
  create(@Body() createExtensioneDto: CreateExtensioneDto) {
    return this.extensionesService.create(createExtensioneDto);
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
  update(@Param('id') id: string, @Body() updateExtensioneDto: UpdateExtensioneDto) {
    return this.extensionesService.update(+id, updateExtensioneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.extensionesService.remove(+id);
  }
}
