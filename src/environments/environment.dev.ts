const API = 'http://localhost:3000';

export const environment = {
  production: false,
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
