import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsuariosSafService } from './usuarios-saf.service';
import { UpdateUsuarioSafDto } from './dto/update-usuario-saf.dto';
import { JwtAuthGuard, Roles } from '../common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

@Controller('usuarios-saf')
@UseGuards(new JwtAuthGuard(new Reflector()))
@Roles('superuser', 'admin')
export class UsuariosSafController {
  constructor(private readonly service: UsuariosSafService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioSafDto) {
    return this.service.update(+id, dto);
  }
}
