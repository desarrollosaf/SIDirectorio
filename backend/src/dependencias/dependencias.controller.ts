import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { DependenciasService } from './dependencias.service';
import { CreateDependenciaDto } from './dto/create-dependencia.dto';
import { UpdateDependenciaDto } from './dto/update-dependencia.dto';
import { generarReporteDependenciasPDF } from './pdf/reporte-pdf';
import { generarReporteDirectivosPDF } from './pdf/reporte-directivos';
import { Response } from 'express';


@Controller('dependencias')
export class DependenciasController {
  constructor(private readonly dependenciasService: DependenciasService) { }

  @Post()
  create(@Body() createDependenciaDto: CreateDependenciaDto) {
    return this.dependenciasService.create(createDependenciaDto);
  }

  @Get('encargados/departamento/:id')
  encargadosPorDepartamento(@Param('id') id: string) {
    return this.dependenciasService.encargadosPorDepartamento(+id);
  }

  @Get('reporte/pdf/:id')
  async generarPDF(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const resultado = await this.dependenciasService.findExtensionespdf(+id);

    if (!resultado) {
      return res.status(404).json({ message: 'No se encontraron dependencias' });
    }

    generarReporteDependenciasPDF(resultado.dependencias, resultado.servicios, res);
  }

  @Get('reporte/directivos/:id')
  async generarReporteDirectivos(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const resultado = await this.dependenciasService.findExtensionespdf(+id);

    if (!resultado) {
      return res.status(404).json({ message: 'No se encontraron dependencias' });
    }

    generarReporteDirectivosPDF(resultado.dependencias, res);
  }


  @Get()
  findAll() {
    return this.dependenciasService.findAll();
  }



  @Get(':id/direcciones')
  findDirecciones(
    @Param('id') id: string,
  ) {
    return this.dependenciasService.findDireccionesByDependencia(+id);
  }

  @Get(':id/direcciones-extensiones')
  findDireccionesConExtensiones(@Param('id') id: string) {
    return this.dependenciasService
      .findDireccionesByDependenciaConExtensiones(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dependenciasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDependenciaDto: UpdateDependenciaDto) {
    return this.dependenciasService.update(+id, updateDependenciaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dependenciasService.remove(+id);
  }




}
