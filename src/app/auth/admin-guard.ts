import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.currentUser()?.role === 'admin') {
    return true;
  }
  return router.createUrlTree(['/members']); // หรือหน้าหลัก
};
