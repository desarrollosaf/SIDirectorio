import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const requiredRole = route.data['role'] as string | undefined;

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    router.navigate(['/error/403']);
    return false;
  }

  return true;
};

export const guardRoles = (allowed: string[]): CanActivateFn =>
  (_route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    if (!auth.isLoggedIn()) { router.navigate(['/auth/login']); return false; }

    const user = auth.getUser();
    if (user && allowed.includes(user.role)) return true;

    router.navigate(['/extensiones']);
    return false;
  };

export const superuserGuard: CanActivateFn = guardRoles(['superuser']);
export const adminGuard: CanActivateFn = guardRoles(['superuser', 'admin']);
export const tecnicoGuard: CanActivateFn = guardRoles(['superuser', 'admin', 'tecnico']);
