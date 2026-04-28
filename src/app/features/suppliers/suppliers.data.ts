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
  ruc: string;
  phone: string;
  email?: string;
  address?: string;
  category: Exclude<SupplierCategory, 'todos'>;
  active: boolean;
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
    ruc: '20512345678',
    phone: '987654321',
    email: 'ventas@distnorte.com',
    address: 'Av. Industrial 234, Lima',
    category: 'abarrotes',
    active: true,
  },
  {
    id: 2,
    name: 'Industrias Lácteas del Sur',
    ruc: '20487654321',
    phone: '976543210',
    email: 'pedidos@lacteosdelsur.pe',
    address: 'Jr. Los Pinos 567, Arequipa',
    category: 'lacteos',
    active: true,
  },
  {
    id: 3,
    name: 'Embotelladora Primavera EIRL',
    ruc: '20398765432',
    phone: '965432109',
    address: 'Calle Libertad 890, Trujillo',
    category: 'bebidas',
    active: true,
  },
  {
    id: 4,
    name: 'Snacks & Más SRL',
    ruc: '20312345678',
    phone: '954321098',
    email: 'info@snacksmás.com',
    category: 'snacks',
    active: true,
  },
  {
    id: 5,
    name: 'Limpieza Total Distribuciones',
    ruc: '20298765432',
    phone: '943210987',
    email: 'ventas@limpiezatotal.pe',
    address: 'Av. Los Olivos 123, Lima',
    category: 'limpieza',
    active: false,
  },
  {
    id: 6,
    name: 'Panadería Central SAC',
    ruc: '20234567890',
    phone: '932109876',
    address: 'Jr. Comercio 456, Cusco',
    category: 'panaderia',
    active: true,
  },
  {
    id: 7,
    name: 'Frigorífico Los Andes EIRL',
    ruc: '20198765432',
    phone: '921098765',
    email: 'pedidos@friglosandes.com',
    address: 'Parque Industrial Lot. 12, Huancayo',
    category: 'carnes',
    active: true,
  },
  {
    id: 8,
    name: 'Higiene Express SRL',
    ruc: '20187654321',
    phone: '910987654',
    category: 'higiene',
    active: true,
  },
  {
    id: 9,
    name: 'Multidistribuciones Perú SAC',
    ruc: '20176543210',
    phone: '999888777',
    email: 'contacto@multidist.pe',
    address: 'Av. República 789, Lima',
    category: 'general',
    active: true,
  },
];
