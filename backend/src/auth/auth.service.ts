import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../../prisma-users-database/prisma/prisma';
import { prismaDirectorio } from '../../prisma-directorio-database/prisma/prisma';
import { LoginDto } from './dto/login.dto';

const JWT_SECRET = process.env.JWT_SECRET || 'directorio-secret-key-2024';

@Injectable()
export class AuthService {
  async login(loginDto: LoginDto) {
    const { rfc, password } = loginDto;
    const rfcUpper = rfc.toUpperCase();

    const user = await prisma.users_safs.findUnique({
      where: { rfc: rfcUpper },
    });

    if (!user) throw new UnauthorizedException('RFC o contraseña incorrectos');

    const storedPassword = (user.password ?? '').replace(/^\$2y\$/, '$2b$');
    const isBcrypt = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$');
    const isValid = isBcrypt
      ? await bcrypt.compare(password, storedPassword)
      : password === storedPassword;
    if (!isValid) throw new UnauthorizedException('RFC o contraseña incorrectos');

    const userRole = await prismaDirectorio.user_roles.findFirst({
      where: { rfc: rfcUpper, deleted_at: null },
    });

    if (!userRole) throw new UnauthorizedException('No tienes permisos para acceder al sistema');

    const role = userRole.role;

    const payload = {
      id: user.id.toString(),
      name: user.name || '',
      rfc: user.rfc || '',
      role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return { token, user: payload };
  }
}
