const API = 'https://storehair.api.bugzilo.com';

export const environment = {
  production: false,
  appName: 'Louvre Extensiones',
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
  assets: 'https://storehair.api.bugzilo.com',
  whatsappUrl: 'https://wa.me/1234567890',
  websiteUrl: 'https://storehair.bugzilo.com',
  logoUrl: null as string | null,
};
