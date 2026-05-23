export interface Country {
  id: string;
  name: string;
  prefix: string;
  currency: string;
  currencyName: string;
  active: boolean;
}

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

export enum SupplierType {
  NATURAL = 'NATURAL',
  JURIDICA = 'JURIDICA',
}
export interface Supplier {
   id: number;
   type: SupplierType;
   fullName: string | null;
   businessName: string | null;
   dni: string;
   ruc: string | null;
   contactFullName: string | null;
   contactDni: string | null;
   phone: string;
   email: string;
   address: string;
   country: Country | null;
   active: boolean;
   user: {
     id: number;
     name: string;
   } | null;
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
    id: 1, type: SupplierType.JURIDICA,
    fullName: null, businessName: 'Distribuidora Norte SAC',
    dni: '', ruc: '20512345678',
    contactFullName: 'Carlos Ríos', contactDni: '41234567',
    phone: '987654321', email: 'ventas@distnorte.com',
    address: 'Av. Industrial 234, Lima',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 2, type: SupplierType.JURIDICA,
    fullName: null, businessName: 'Industrias Lácteas del Sur',
    dni: '', ruc: '20487654321',
    contactFullName: 'María Torres', contactDni: '43456789',
    phone: '976543210', email: 'pedidos@lacteosdelsur.pe',
    address: 'Jr. Los Pinos 567, Arequipa',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 3, type: SupplierType.NATURAL,
    fullName: 'Jorge Primavera Vega', businessName: null,
    dni: '45678901', ruc: null,
    contactFullName: null, contactDni: null,
    phone: '965432109', email: '',
    address: 'Calle Libertad 890, Trujillo',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 4, type: SupplierType.JURIDICA,
    fullName: null, businessName: 'Snacks & Más SRL',
    dni: '', ruc: '20312345678',
    contactFullName: 'Ana Gutiérrez', contactDni: '47890123',
    phone: '954321098', email: 'info@snacksmás.com',
    address: '',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 5, type: SupplierType.JURIDICA,
    fullName: null, businessName: 'Limpieza Total Distribuciones',
    dni: '', ruc: '20298765432',
    contactFullName: 'Pedro Mamani', contactDni: '48901234',
    phone: '943210987', email: 'ventas@limpiezatotal.pe',
    address: 'Av. Los Olivos 123, Lima',
    country: null, active: false, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 6, type: SupplierType.NATURAL,
    fullName: 'Rosa Central Huamán', businessName: null,
    dni: '46789012', ruc: null,
    contactFullName: null, contactDni: null,
    phone: '932109876', email: '',
    address: 'Jr. Comercio 456, Cusco',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 7, type: SupplierType.JURIDICA,
    fullName: null, businessName: 'Frigorífico Los Andes EIRL',
    dni: '', ruc: '20198765432',
    contactFullName: 'Luis Ccama', contactDni: '44567890',
    phone: '921098765', email: 'pedidos@friglosandes.com',
    address: 'Parque Industrial Lot. 12, Huancayo',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 8, type: SupplierType.JURIDICA,
    fullName: null, businessName: 'Higiene Express SRL',
    dni: '', ruc: '20187654321',
    contactFullName: 'Sandra López', contactDni: '49012345',
    phone: '910987654', email: '',
    address: '',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 9, type: SupplierType.JURIDICA,
    fullName: null, businessName: 'Multidistribuciones Perú SAC',
    dni: '', ruc: '20176543210',
    contactFullName: 'Roberto Quispe', contactDni: '40123456',
    phone: '999888777', email: 'contacto@multidist.pe',
    address: 'Av. República 789, Lima',
    country: null, active: true, user: null,
    createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z',
  },
];
