import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../../prisma-users-database/prisma/prisma';
import { LoginDto } from './dto/login.dto';

const JWT_SECRET = process.env.JWT_SECRET || 'directorio-secret-key-2024';
const ADMIN_RFCS = (process.env.ADMIN_RFCS || '')
  .split(',')
  .map(r => r.trim().toUpperCase())
  .filter(r => r.length > 0);

@Injectable()
export class AuthService {
  async login(loginDto: LoginDto) {
    const { rfc, password } = loginDto;

    const user = await prisma.users_safs.findUnique({
      where: { rfc: rfc.toUpperCase() },
    });

    if (!user) {
      throw new UnauthorizedException('RFC o contraseña incorrectos');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('RFC o contraseña incorrectos');
    }

    const role = ADMIN_RFCS.includes(rfc.toUpperCase()) ? 'admin' : 'user';

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
