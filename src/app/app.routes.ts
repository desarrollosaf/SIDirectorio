import { Routes } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { authGuard } from './core/guards/auth.guard';
import { superuserGuard, adminGuard, tecnicoGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: 'landing',
    loadComponent: () => import('./views/pages/landing/landing.component').then(c => c.LandingComponent),
  },
  {
    path: 'directorio',
    loadComponent: () => import('./views/pages/directorio/directorio.component').then(c => c.DirectorioComponent),
  },
  {
    path: 'landing',
    loadComponent: () => import('./views/pages/landing/landing.component').then(c => c.LandingComponent),
  },
  { path: 'auth', loadChildren: () => import('./views/pages/auth/auth.routes')},
  {
    path: '',
    component: BaseComponent,
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./views/pages/dashboard/dashboard.routes')
      },
      {
        path: 'apps',
        loadChildren: () => import('./views/pages/apps/apps.routes')
      },
      {
        path: 'ui-components',
        loadChildren: () => import('./views/pages/ui-components/ui-components.routes')
      },
      {
        path: 'advanced-ui',
        loadChildren: () => import('./views/pages/advanced-ui/advanced-ui.routes')
      },
      {
        path: 'forms',
        loadChildren: () => import('./views/pages/forms/forms.routes')
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/pages/charts/charts.routes')
      },
      {
        path: 'tables',
        loadChildren: () => import('./views/pages/tables/tables.routes')
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/pages/icons/icons.routes')
      },
      {
        path: 'general',
        loadChildren: () => import('./views/pages/general/general.routes')
      },
      {
        path: 'extensiones',
        loadComponent: () => import('./views/pages/extensiones/extensiones.component').then(c => c.ExtensionesComponent),
      },
      {
        path: 'directorio-admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/pages/directorio-admin/directorio-admin.component').then(c => c.DirectorioAdminComponent),
      },
      {
        path: 'encargados-admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/pages/encargados-admin/encargados-admin.component').then(c => c.EncargadosAdminComponent),
      },
      {
        path: 'servicios',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/pages/servicios-admin/servicios-admin.component').then(c => c.ServiciosAdminComponent),
      },
      {
        path: 'ubicaciones',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/pages/ubicaciones/ubicaciones.component').then(c => c.UbicacionesComponent),
      },
      {
        path: 'dependencias',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/pages/dependencias-ubicaciones/dependencias-ubicaciones.component').then(c => c.DependenciasUbicacionesComponent),
      },
      {
        path: 'usuarios',
        canActivate: [superuserGuard],
        loadComponent: () => import('./views/pages/users-admin/users-admin.component').then(c => c.UsersAdminComponent),
      },
      {
        path: 'usuarios-saf',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/pages/usuarios-saf/usuarios-saf.component').then(c => c.UsuariosSafComponent),
      },
      {
        path: 'reportes',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/pages/reportes/reportes.component').then(c => c.ReportesComponent),
      },
    ]
  },
  {
    path: 'error',
    loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent),
  },
  {
    path: 'error/:type',
    loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent)
  },
  { path: '**', redirectTo: 'error/404', pathMatch: 'full' }
];
