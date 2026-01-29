import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

console.log('env directorio'+{
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD ? '*****' : undefined,
  database: process.env.DATABASE_NAME
})

console.log('HOST:', process.env.DATABASE_HOST)

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME2,
  connectionLimit: 5
});
const prismaDirectorio = new PrismaClient({ adapter });

export { prismaDirectorio }