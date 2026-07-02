import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersAdminService } from './users-admin.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard, Roles } from '../common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

@Controller('users-admin')
@UseGuards(new JwtAuthGuard(new Reflector()))
@Roles('superuser')
export class UsersAdminController {
  constructor(private readonly service: UsersAdminService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('saf-users')
  findActiveSafUsers() {
    return this.service.findActiveSafUsers();
  }

  @Post()
  create(@Body() dto: CreateUserAdminDto) {
    return this.service.create(dto);
  }

  @Patch(':rfc/role')
  updateRole(@Param('rfc') rfc: string, @Body() dto: UpdateRoleDto) {
    return this.service.updateRole(rfc, dto);
  }

  @Delete(':rfc')
  @HttpCode(HttpStatus.OK)
  remove(@Param('rfc') rfc: string) {
    return this.service.remove(rfc);
  }

}
