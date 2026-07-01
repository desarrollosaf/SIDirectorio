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
  },
  {
    label: 'Servicios',
    icon: 'grid',
    link: '/servicios',
  },
  {
    label: 'Ubicaciones',
    icon: 'map-pin',
    link: '/ubicaciones',
  },
  {
    label: 'Dependencias',
    icon: 'briefcase',
    link: '/dependencias',
  },
  {
    label: 'Usuarios',
    icon: 'users',
    link: '/usuarios',
    roles: ['superuser'],
  },
];
