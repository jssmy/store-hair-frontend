import { Routes } from '@angular/router';
import { AppRoutes } from './core/constants/app-routes';

export const routes: Routes = [
    {
        path: AppRoutes.login,
        loadComponent: () =>
            import('./features/auth/login/login.component').then(m => m.LoginComponent),
    },
    {
        path: '',
        loadComponent: () =>
            import('./shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
            {
                path: AppRoutes.dashboard,
                loadComponent: () =>
                    import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
            },
            {
                path: AppRoutes.notices,
                loadComponent: () =>
                    import('./features/notices/notices.component').then(m => m.NoticesComponent),
            },
            {
                path: AppRoutes.products,
                loadComponent: () =>
                    import('./features/products/products.component').then(m => m.ProductsComponent),
            },
            {
                path: AppRoutes.sale,
                loadComponent: () =>
                    import('./features/sale/sale.component').then(m => m.SaleComponent),
            },
            {
                path: AppRoutes.caja,
                loadComponent: () =>
                    import('./features/caja/caja.component').then(m => m.CajaComponent),
            },
            {
                path: AppRoutes.profile,
                loadComponent: () =>
                    import('./features/profile/profile.component').then(m => m.ProfileComponent),
            },
            {
                path: AppRoutes.suppliers,
                loadComponent: () =>
                    import('./features/suppliers/suppliers.component').then(m => m.SuppliersComponent),
            },
            {
                path: AppRoutes.credits,
                loadComponent: () =>
                    import('./features/credits/credits.component').then(m => m.CreditsComponent),
            },
            {
                path: AppRoutes.demo,
                loadComponent: () =>
                    import('./features/demo/demo.component').then(m => m.DemoComponent),
            },
            {
                path: '',
                redirectTo: AppRoutes.dashboard,
                pathMatch: 'full',
            },
        ],
    },
    {
        path: '**',
        redirectTo: AppRoutes.login,
    },
];
