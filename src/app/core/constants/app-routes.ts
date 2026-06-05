export const AppRoutes = {
  login:         'login',
  dashboard:     'dashboard',
  notices:       'notices',
  products:      'products',
  sale:          'sale',
  sales:         'sales',
  caja:          'caja',
  profile:       'profile',
  suppliers:     'suppliers',
  credits:       'credits',
  purchaseOrder: 'purchase-order',
  demo:          'demo',
} as const;

export type AppRoute = (typeof AppRoutes)[keyof typeof AppRoutes];
