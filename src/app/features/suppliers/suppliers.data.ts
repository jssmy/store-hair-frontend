export type SupplierCategory =
  | 'todos'
  | 'abarrotes'
  | 'bebidas'
  | 'lacteos'
  | 'snacks'
  | 'limpieza'
  | 'higiene'
  | 'panaderia'
  | 'carnes'
  | 'general';

export interface Supplier {
  id: number;
  name: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  todos:     'Todos',
  abarrotes: 'Abarrotes',
  bebidas:   'Bebidas',
  lacteos:   'Lácteos',
  snacks:    'Snacks',
  limpieza:  'Limpieza',
  higiene:   'Higiene',
  panaderia: 'Panadería',
  carnes:    'Carnes',
  general:   'General',
};

export const SUPPLIER_CATEGORY_ICONS: Record<SupplierCategory, string> = {
  todos:     '🏪',
  abarrotes: '🛒',
  bebidas:   '🥤',
  lacteos:   '🥛',
  snacks:    '🍿',
  limpieza:  '🧹',
  higiene:   '🧴',
  panaderia: '🍞',
  carnes:    '🥩',
  general:   '📦',
};

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'Distribuidora Norte SAC',
    dni: '20512345678',
    phone: '987654321',
    email: 'ventas@distnorte.com',
    address: 'Av. Industrial 234, Lima',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Industrias Lácteas del Sur',
    dni: '20487654321',
    phone: '976543210',
    email: 'pedidos@lacteosdelsur.pe',
    address: 'Jr. Los Pinos 567, Arequipa',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 3,
    name: 'Embotelladora Primavera EIRL',
    dni: '20398765432',
    phone: '965432109',
    email: '',
    address: 'Calle Libertad 890, Trujillo',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 4,
    name: 'Snacks & Más SRL',
    dni: '20312345678',
    phone: '954321098',
    email: 'info@snacksmás.com',
    address: '',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 5,
    name: 'Limpieza Total Distribuciones',
    dni: '20298765432',
    phone: '943210987',
    email: 'ventas@limpiezatotal.pe',
    address: 'Av. Los Olivos 123, Lima',
    active: false,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 6,
    name: 'Panadería Central SAC',
    dni: '20234567890',
    phone: '932109876',
    email: '',
    address: 'Jr. Comercio 456, Cusco',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 7,
    name: 'Frigorífico Los Andes EIRL',
    dni: '20198765432',
    phone: '921098765',
    email: 'pedidos@friglosandes.com',
    address: 'Parque Industrial Lot. 12, Huancayo',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 8,
    name: 'Higiene Express SRL',
    dni: '20187654321',
    phone: '910987654',
    email: '',
    address: '',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 9,
    name: 'Multidistribuciones Perú SAC',
    dni: '20176543210',
    phone: '999888777',
    email: 'contacto@multidist.pe',
    address: 'Av. República 789, Lima',
    active: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
];
