import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { AppRoutes } from '../constants/app-routes';

export const authGuard: CanActivateFn = async () => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const token = await storage.get<string>('access_token');
  if (token) return true;

  return router.createUrlTree([AppRoutes.login]);
};

export const noAuthGuard: CanActivateFn = async () => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const token = await storage.get<string>('access_token');
  if (!token) return true;

  return router.createUrlTree([AppRoutes.dashboard]);
};
