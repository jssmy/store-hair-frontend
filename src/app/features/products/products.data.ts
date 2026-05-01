// ── Product categories (coletas de pelo) ─────────────────────────────

export type ProductCategory =
  | 'todos'
  | 'lisa'
  | 'ondulada'
  | 'rizada'
  | 'cortina'
  | 'extensiones'
  | 'peluca';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  todos:       'Todos',
  lisa:        'Lisa',
  ondulada:    'Ondulada',
  rizada:      'Rizada',
  cortina:     'Cortina',
  extensiones: 'Extensiones',
  peluca:      'Peluca',
};

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  todos:       '💇',
  lisa:        '📏',
  ondulada:    '〰️',
  rizada:      '🌀',
  cortina:     '✂️',
  extensiones: '💈',
  peluca:      '👑',
};

// ── Hair colors ──────────────────────────────────────────────────────

export type HairColor =
  | 'negro'
  | 'negro-azabache'
  | 'marron-oscuro'
  | 'marron-medio'
  | 'marron-claro'
  | 'castano'
  | 'rubio-oscuro'
  | 'rubio-medio'
  | 'rubio-ceniza'
  | 'borgona'
  | 'rojo'
  | 'cobre'
  | 'gris'
  | 'blanco';

export const HAIR_COLORS: HairColor[] = [
  'negro', 'negro-azabache', 'marron-oscuro', 'marron-medio', 'marron-claro',
  'castano', 'rubio-oscuro', 'rubio-medio', 'rubio-ceniza', 'borgona', 'rojo',
  'cobre', 'gris', 'blanco',
];

export const HAIR_COLOR_LABELS: Record<HairColor, string> = {
  'negro':          'Negro',
  'negro-azabache': 'Negro Azabache',
  'marron-oscuro':  'Marrón Oscuro',
  'marron-medio':   'Marrón Medio',
  'marron-claro':   'Marrón Claro',
  'castano':        'Castaño',
  'rubio-oscuro':   'Rubio Oscuro',
  'rubio-medio':    'Rubio Medio',
  'rubio-ceniza':   'Rubio Ceniza',
  'borgona':        'Borgoña',
  'rojo':           'Rojo',
  'cobre':          'Cobre',
  'gris':           'Gris/Plateado',
  'blanco':         'Blanco/Platino',
};

export const HAIR_COLOR_HEX: Record<HairColor, string> = {
  'negro':          '#1a1a1a',
  'negro-azabache': '#050505',
  'marron-oscuro':  '#3b1c0f',
  'marron-medio':   '#6b3a2a',
  'marron-claro':   '#a0522d',
  'castano':        '#7b3f20',
  'rubio-oscuro':   '#c19a6b',
  'rubio-medio':    '#d4a853',
  'rubio-ceniza':   '#c9b89a',
  'borgona':        '#722f37',
  'rojo':           '#8b0000',
  'cobre':          '#b87333',
  'gris':           '#9e9e9e',
  'blanco':         '#f0e6d3',
};

// ── Product model ────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  category: Exclude<ProductCategory, 'todos'>;
  imageUrl?: string;
  images?: string[];
  price: number;
  stock: number;
  unit: string;
  supplier?: string;
  color?: HairColor;
  weight?: number;    // grams
  length?: number;    // cm
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ── Lote (batch) model ───────────────────────────────────────────────

export interface LoteProduct {
  id: string;
  name: string;
  color: HairColor;
  weight: number;
  length: number;
  price: number;
  quantity: number;
  category: Exclude<ProductCategory, 'todos'>;
  images: string[];
}

export interface Lote {
  id?: string;
  purchaseOrderNumber: string;
  registeredBy: string;
  registeredAt: string;
  supplierId: number;
  supplierName: string;
  products: LoteProduct[];
}

// ── Purchase Orders (mock data) ──────────────────────────────────────

export interface PurchaseOrder {
  number: string;
  supplierName: string;
  supplierId: number;
  date: string;
}

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  { number: 'OC-2025-001', supplierName: 'Distribuidora Norte SAC',      supplierId: 1, date: '2025-01-15' },
  { number: 'OC-2025-002', supplierName: 'Multidistribuciones Perú SAC', supplierId: 9, date: '2025-02-10' },
  { number: 'OC-2025-003', supplierName: 'Distribuidora Norte SAC',      supplierId: 1, date: '2025-03-05' },
  { number: 'OC-2025-004', supplierName: 'Multidistribuciones Perú SAC', supplierId: 9, date: '2025-04-01' },
  { number: 'OC-2025-005', supplierName: 'Distribuidora Norte SAC',      supplierId: 1, date: '2025-04-20' },
];

// ── Mock products ────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  { id: 1,  name: 'Coleta Lisa 30cm',      category: 'lisa',        price: 45.00,  stock: 12, unit: 'unidad', color: 'negro',         weight: 80,  length: 30 },
  { id: 2,  name: 'Coleta Lisa 40cm',      category: 'lisa',        price: 58.00,  stock: 8,  unit: 'unidad', color: 'marron-oscuro', weight: 100, length: 40 },
  { id: 3,  name: 'Coleta Lisa 50cm',      category: 'lisa',        price: 72.00,  stock: 5,  unit: 'unidad', color: 'rubio-medio',   weight: 120, length: 50 },
  { id: 4,  name: 'Coleta Ondulada 35cm',  category: 'ondulada',    price: 55.00,  stock: 10, unit: 'unidad', color: 'castano',       weight: 90,  length: 35 },
  { id: 5,  name: 'Coleta Ondulada 45cm',  category: 'ondulada',    price: 68.00,  stock: 7,  unit: 'unidad', color: 'marron-medio',  weight: 110, length: 45 },
  { id: 6,  name: 'Coleta Rizada 30cm',    category: 'rizada',      price: 50.00,  stock: 6,  unit: 'unidad', color: 'negro',         weight: 85,  length: 30 },
  { id: 7,  name: 'Coleta Rizada 40cm',    category: 'rizada',      price: 65.00,  stock: 4,  unit: 'unidad', color: 'borgona',       weight: 105, length: 40 },
  { id: 8,  name: 'Coleta Cortina 25cm',   category: 'cortina',     price: 35.00,  stock: 15, unit: 'unidad', color: 'negro-azabache',weight: 60,  length: 25 },
  { id: 9,  name: 'Extensión Lisa 60cm',   category: 'extensiones', price: 95.00,  stock: 3,  unit: 'unidad', color: 'rubio-ceniza',  weight: 150, length: 60 },
  { id: 10, name: 'Extensión Clip 50cm',   category: 'extensiones', price: 85.00,  stock: 5,  unit: 'unidad', color: 'marron-claro',  weight: 130, length: 50 },
  { id: 11, name: 'Peluca Natural Corta',  category: 'peluca',      price: 180.00, stock: 2,  unit: 'unidad', color: 'negro',         weight: 200, length: 20 },
  { id: 12, name: 'Peluca Natural Larga',  category: 'peluca',      price: 250.00, stock: 1,  unit: 'unidad', color: 'castano',       weight: 280, length: 50 },
];
