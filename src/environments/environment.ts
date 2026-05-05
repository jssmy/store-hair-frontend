const API = 'http://localhost:3000';

export const environment = {
  production: false,
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
    country: `${API}/country`,
  },
  assets: 'http://localhost:3000',
  whatsappUrl: 'https://wa.me/1234567890',
  websiteUrl: 'https://storepoint.app',
  logoUrl: null as string | null,
};
