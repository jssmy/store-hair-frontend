const API = 'https://storehair.api.bugzilo.com';

export const environment = {
  production: true,
  appName: 'StorePoint',
  apiUrl: API,
  endpoints: {
    auth: {
      login: `${API}/auth/login`,
      register: `${API}/auth/register`,
      refresh: `${API}/auth/refresh`,
    },
    supplier: `${API}/supplier`,
    product: `${API}/product`,
    lote: `${API}/lote`,
    purchaseOrder: `${API}/purchase-order`,
  },
  assets: 'https://storehair.api.bugzilo.com',
  whatsappUrl: 'https://wa.me/1234567890',
  websiteUrl: 'https://storepoint.app',
  logoUrl: null as string | null,
};
