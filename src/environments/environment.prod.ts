const API = 'https://storehair.api.bugzilo.com';

export const environment = {
  production: true,
  appName: 'StorePoint',
  apiUrl: API,
  endpoints: {
    auth: {
      login: `${API}/auth/login`,
      register: `${API}/auth/register`,
    },
    supplier: `${API}/supplier`,
  },
  whatsappUrl: 'https://wa.me/1234567890',
  websiteUrl: 'https://storepoint.app',
  logoUrl: null as string | null,
};
