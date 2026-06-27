// ── Product categories (coletas de pelo) ─────────────────────────────


export type HairType =
  'lote'
  | 'viethanmita'
  | 'golden'
  | 'premium'

export const HAIR_TYPE_LABELS: Record<HairType, string> = {
  lote: 'Lote',
  viethanmita: 'Viethanmita',
  golden: 'Golden',
  premium: 'Premium',

};

export const HAIR_TYPE_ICONS: Record<HairType, string> = {
  lote: '📦',
  viethanmita: '📏',
  golden: '✨',
  premium: '🌟',
};

// ── Hair colors ──────────────────────────────────────────────────────

export const HAIR_COLOR_HEX = {
  'natural': '#3b1c0f',
  'pintado': '#d4a853',
} as const;

export type HairColor = keyof typeof HAIR_COLOR_HEX;

export const HAIR_COLORS: HairColor[] = Object.keys(HAIR_COLOR_HEX) as HairColor[];

export const HAIR_COLOR_LABELS: Record<HairColor, string> = {
  'natural': 'Natural',
  'pintado': 'Pintado',
};

export const HAIR_TYPE_OPTIONS: Exclude<HairType, 'todos'>[] = [
  'lote', 'viethanmita', 'golden', 'premium',
];

export const HAIR_LENGTH_OPTIONS: number[] = [
  18, 20, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 37,
];

// ── Product model (única interfaz) ───────────────────────────────────

export interface Product {
  // Identificación
  id: number;
  name: string;
  price: number;       // API devuelve string → parseFloat en ProductService

  // Imágenes
  imageUrl?: string;    // singular — backward compat (cart-item)
  imageUrls?: string[]; // array   — respuesta de API ([] cuando no tiene)

  // Atributos físicos
  color?: HairColor;
  weight?: number;  // gramos  — API devuelve string → parseFloat
  length?: number;  // cm      — API devuelve string → parseFloat
  type?: string;    // tipo de cabello: lote, golden, viethanmita, premium

  // Estado
  active?: boolean;  // API: true/false

  // Comercio
  unit?: string;
  supplier?: string;

  // Inventario / lote
  po?: string;  // número de orden de compra

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** Precio real de venta definido por el usuario. Por defecto = price × weight. */
  salePrice: number;
}

export interface InventoryUser {
  id: string;
  name: string;
}

export interface InventoryPurchaseOrder {
  id?: number;
  oc: string;
  supplier?: { fullName?: string; businessName?: string };
  createdAt?: string;
}

export interface Inventory {
  id: number;
  lt: string
  products: Product[];
  user?: InventoryUser;
  purchaseOrder?: InventoryPurchaseOrder;
  status: LoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FindAllLoteQuery {
  userId?: string;
  page?: number;
  limit?: number;
  status?: LoteStatus;
  search?: string;
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
    id?: string;
    type: string;
    color: string;
    price: number;
    length: number;
    weight: number;
    images: string[];
}

export interface CreateProductApiDto {
  loteId: number;
  type: string;
  color: string;
  price: number;
  length: number;
  weight: number;
  images: string[];
}

export interface CreateLoteDto {
  purchaseOrderId: number;
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


export enum LoteStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

// ── Mock products ────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Coleta Lisa 30cm', price: 45.00, unit: 'unidad', color: 'natural', weight: 80, length: 30 },
  { id: 2, name: 'Coleta Lisa 40cm', price: 58.00, unit: 'unidad', color: 'natural', weight: 100, length: 40 },
  { id: 3, name: 'Coleta Lisa 50cm', price: 72.00, unit: 'unidad', color: 'pintado', weight: 120, length: 50 },
  { id: 4, name: 'Coleta Ondulada 35cm', price: 55.00, unit: 'unidad', color: 'natural', weight: 90, length: 35 },
  { id: 5, name: 'Coleta Ondulada 45cm', price: 68.00, unit: 'unidad', color: 'pintado', weight: 110, length: 45 },
  { id: 6, name: 'Coleta Rizada 30cm', price: 50.00, unit: 'unidad', color: 'natural', weight: 85, length: 30 },
  { id: 7, name: 'Coleta Rizada 40cm', price: 65.00, unit: 'unidad', color: 'pintado', weight: 105, length: 40 },
  { id: 8, name: 'Coleta Cortina 25cm', price: 35.00, unit: 'unidad', color: 'natural', weight: 60, length: 25 },
  { id: 9, name: 'Extensión Lisa 60cm', price: 95.00, unit: 'unidad', color: 'pintado', weight: 150, length: 60 },
  { id: 10, name: 'Extensión Clip 50cm', price: 85.00, unit: 'unidad', color: 'pintado', weight: 130, length: 50 },
  { id: 11, name: 'Peluca Natural Corta', price: 180.00, unit: 'unidad', color: 'natural', weight: 200, length: 20 },
  { id: 12, name: 'Peluca Natural Larga', price: 250.00, unit: 'unidad', color: 'natural', weight: 280, length: 50 },
];

