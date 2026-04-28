const API = 'https://api.storepoint.app';

export const environment = {
  production: true,
  appName: 'StorePoint',
  apiUrl: API,
  endpoints: {
    auth: {
      login: `${API}/auth/login`,
    },
  },
  whatsappUrl: 'https://wa.me/1234567890',
  websiteUrl: 'https://storepoint.app',
  logoUrl: null as string | null,
};
