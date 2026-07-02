import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Extensiones',
    icon: 'phone',
    link: '/extensiones',
  },
  {
    label: 'Encargados',
    icon: 'user-check',
    link: '/encargados-admin',
    roles: ['superuser', 'admin'],
  },
  {
    label: 'Servicios',
    icon: 'grid',
    link: '/servicios',
    roles: ['superuser', 'admin'],
  },
  {
    label: 'Ubicaciones',
    icon: 'map-pin',
    link: '/ubicaciones',
    roles: ['superuser', 'admin'],
  },
  {
    label: 'Dependencias',
    icon: 'briefcase',
    link: '/dependencias',
    roles: ['superuser', 'admin'],
  },
  {
    label: 'Reportes',
    icon: 'printer',
    link: '/reportes',
    roles: ['superuser', 'admin'],
  },
  {
    label: 'Corrección de Nombres',
    icon: 'user-check',
    link: '/usuarios-saf',
    roles: ['superuser', 'admin'],
  },
  {
    label: 'Gestión de Roles',
    icon: 'shield',
    link: '/usuarios',
    roles: ['superuser'],
  },
];
