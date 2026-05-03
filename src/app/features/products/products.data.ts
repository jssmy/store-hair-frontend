// ── Product categories (coletas de pelo) ─────────────────────────────


export type HairType =
  | 'todos'
  | 'lisa'
  | 'ondulada'
  | 'rizada'
  | 'cortina'
  | 'extensiones'
  | 'peluca';

export const HAIR_TYPE_LABELS: Record<HairType, string> = {
  todos: 'Todos',
  lisa: 'Lisa',
  ondulada: 'Ondulada',
  rizada: 'Rizada',
  cortina: 'Cortina',
  extensiones: 'Extensiones',
  peluca: 'Peluca',
};

export const HAIR_TYPE_ICONS: Record<HairType, string> = {
  todos: '💇',
  lisa: '📏',
  ondulada: '〰️',
  rizada: '🌀',
  cortina: '✂️',
  extensiones: '💈',
  peluca: '👑',
};

// ── Hair colors ──────────────────────────────────────────────────────

export const HAIR_COLOR_HEX = {
  'negro': '#1a1a1a',
  'negro-azabache': '#050505',
  'marron-oscuro': '#3b1c0f',
  'marron-medio': '#6b3a2a',
  'marron-claro': '#a0522d',
  'castano': '#7b3f20',
  'rubio-oscuro': '#c19a6b',
  'rubio-medio': '#d4a853',
  'rubio-ceniza': '#c9b89a',
  'borgona': '#722f37',
  'rojo': '#8b0000',
  'cobre': '#b87333',
  'gris': '#9e9e9e',
  'blanco': '#f0e6d3',
} as const;

export type HairColor = keyof typeof HAIR_COLOR_HEX;

export const HAIR_COLORS: HairColor[] = Object.keys(HAIR_COLOR_HEX) as HairColor[];

export const HAIR_COLOR_LABELS: Record<HairColor, string> = {
  'negro': 'Negro',
  'negro-azabache': 'Negro Azabache',
  'marron-oscuro': 'Marrón Oscuro',
  'marron-medio': 'Marrón Medio',
  'marron-claro': 'Marrón Claro',
  'castano': 'Castaño',
  'rubio-oscuro': 'Rubio Oscuro',
  'rubio-medio': 'Rubio Medio',
  'rubio-ceniza': 'Rubio Ceniza',
  'borgona': 'Borgoña',
  'rojo': 'Rojo',
  'cobre': 'Cobre',
  'gris': 'Gris/Plateado',
  'blanco': 'Blanco/Platino',
};

// ── Product model ────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  imageUrl?: string;
  images?: string[];
  price: number;
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

export type InventoryStatus = 'pending' | 'completed' | 'cancelled';

export interface InventoryProduct {
  id: string;
  type: string;
  color: HairColor;
  name: string;
  price: number;
  length: number;
  weight: number;
  status: InventoryStatus;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryUser {
  id: string;
  name: string;
}

export interface Inventory {
  id: string;
  products: InventoryProduct[];
  user?: InventoryUser;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FindAllLoteQuery {
  userId?: string;
  page?: number;
  limit?: number;
}

// ── Lote (batch) model ───────────────────────────────────────────────

export interface LoteProduct {
  id: string;
  name: string;
  type: string;
  color: HairColor;
  weight: number;
  length: number;
  price: number;
  images: string[];
}

export interface CreateProductDto {
    type: string;
    color: string;
    price: number;
    length: number;
    weight: number;
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

// ── Mock products ────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Coleta Lisa 30cm', price: 45.00, unit: 'unidad', color: 'negro', weight: 80, length: 30 },
  { id: 2, name: 'Coleta Lisa 40cm', price: 58.00, unit: 'unidad', color: 'marron-oscuro', weight: 100, length: 40 },
  { id: 3, name: 'Coleta Lisa 50cm', price: 72.00, unit: 'unidad', color: 'rubio-medio', weight: 120, length: 50 },
  { id: 4, name: 'Coleta Ondulada 35cm', price: 55.00, unit: 'unidad', color: 'castano', weight: 90, length: 35 },
  { id: 5, name: 'Coleta Ondulada 45cm', price: 68.00, unit: 'unidad', color: 'marron-medio', weight: 110, length: 45 },
  { id: 6, name: 'Coleta Rizada 30cm', price: 50.00, unit: 'unidad', color: 'negro', weight: 85, length: 30 },
  { id: 7, name: 'Coleta Rizada 40cm', price: 65.00, unit: 'unidad', color: 'borgona', weight: 105, length: 40 },
  { id: 8, name: 'Coleta Cortina 25cm', price: 35.00, unit: 'unidad', color: 'negro-azabache', weight: 60, length: 25 },
  { id: 9, name: 'Extensión Lisa 60cm', price: 95.00, unit: 'unidad', color: 'rubio-ceniza', weight: 150, length: 60 },
  { id: 10, name: 'Extensión Clip 50cm', price: 85.00, unit: 'unidad', color: 'marron-claro', weight: 130, length: 50 },
  { id: 11, name: 'Peluca Natural Corta', price: 180.00, unit: 'unidad', color: 'negro', weight: 200, length: 20 },
  { id: 12, name: 'Peluca Natural Larga', price: 250.00, unit: 'unidad', color: 'castano', weight: 280, length: 50 },
];

export const MOCK_INVENTORIES: Inventory[] = [
  {
    id: '9349f8b0-125e-480b-912d-a87c58b009d6',
    products: [
      {
        id: '13a82db0-7fd1-4d9b-bb1c-327f50d8e9c3',
        type: 'lisa',
        color: 'marron-oscuro',
        name: 'Coleta lisa marron-oscuro 1 cm 1 g',
        price: 1,
        length: 1,
        weight: 1,
        status: 'pending',
        imageUrls: [
          'images/products/product-1777756581669-0-0-890055331.png',
          'images/products/product-1777756581673-0-1-273681809.png',
          'images/products/product-1777756581688-0-2-198380898.png',
        ],
        createdAt: '2026-05-03T02:16:21.694Z',
        updatedAt: '2026-05-03T02:16:21.694Z',
      },
    ],
    status: 'pending',
    createdAt: '2026-05-03T02:16:21.694Z',
    updatedAt: '2026-05-03T02:16:21.694Z',
  },
  {
    id: 'd102f4a2-c67f-45be-b87e-b60b2d80a3cb',
    products: [
      {
        id: 'f95aa503-ecb8-4fb0-bf53-3cce8f9cb041',
        type: 'ondulada',
        color: 'negro',
        name: 'Coleta ondulada negro 45 cm 110 g',
        price: 68,
        length: 45,
        weight: 110,
        status: 'completed',
        imageUrls: [],
        createdAt: '2026-05-04T09:33:10.000Z',
        updatedAt: '2026-05-04T09:33:10.000Z',
      },
      {
        id: 'b0f7f3f3-d7da-4f1f-8ca1-6b6cd0095f53',
        type: 'rizada',
        color: 'castano',
        name: 'Coleta rizada castano 35 cm 90 g',
        price: 55,
        length: 35,
        weight: 90,
        status: 'completed',
        imageUrls: [],
        createdAt: '2026-05-04T09:33:10.000Z',
        updatedAt: '2026-05-04T09:33:10.000Z',
      },
    ],
    status: 'completed',
    createdAt: '2026-05-04T09:33:10.000Z',
    updatedAt: '2026-05-04T09:33:10.000Z',
  },
];
