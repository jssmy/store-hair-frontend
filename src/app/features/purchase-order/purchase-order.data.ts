import type { HairColor, ProductCategory } from '../products/products.data';

// ── Status ────────────────────────────────────────────────────────────

export type POStatus = 'pendiente' | 'recibida' | 'cancelada';

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  pendiente: 'Pendiente',
  recibida:  'Recibida',
  cancelada: 'Cancelada',
};

// ── Detail model (lo que se compra: por kilo/lote) ────────────────────
// Constraint: no two details with same (color + type + length) in one PO

export interface PurchaseOrderDetail {
  id: string;
  color: HairColor;
  type: Exclude<ProductCategory, 'todos'>;
  length: number;      // largo en cm
  kilo: number;        // kg del lote
  totalPrice: number;  // precio total del detalle
}

// ── Purchase Order model ──────────────────────────────────────────────

export interface PurchaseOrderFull {
  id: string;
  number: string;
  supplierId: number;
  supplierName: string;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
  status: POStatus;
  details: PurchaseOrderDetail[];
}

// ── Drawer types ──────────────────────────────────────────────────────

export interface PurchaseOrderDrawerData {
  purchaseOrder?: PurchaseOrderFull;
}

export type PurchaseOrderDrawerResult = PurchaseOrderFull;

// ── Mock data ─────────────────────────────────────────────────────────

export const MOCK_PURCHASE_ORDERS_FULL: PurchaseOrderFull[] = [
  {
    id: 'po-001',
    number: 'OC-2025-001',
    supplierId: 1,
    supplierName: 'Distribuidora Norte SAC',
    registeredBy: 'Admin',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    status: 'recibida',
    details: [
      { id: 'd1-1', color: 'negro',        type: 'lisa',     length: 30, kilo: 2.5, totalPrice: 375.00 },
      { id: 'd1-2', color: 'marron-oscuro', type: 'ondulada', length: 40, kilo: 1.8, totalPrice: 306.00 },
      { id: 'd1-3', color: 'rubio-medio',   type: 'lisa',     length: 50, kilo: 3.0, totalPrice: 690.00 },
    ],
  },
  {
    id: 'po-002',
    number: 'OC-2025-002',
    supplierId: 9,
    supplierName: 'Multidistribuciones Perú SAC',
    registeredBy: 'Vendedor1',
    createdAt: '2025-02-10T09:00:00Z',
    updatedAt: '2025-02-10T09:00:00Z',
    status: 'pendiente',
    details: [
      { id: 'd2-1', color: 'castano', type: 'rizada',  length: 35, kilo: 2.0, totalPrice: 480.00 },
      { id: 'd2-2', color: 'negro',   type: 'cortina', length: 25, kilo: 1.5, totalPrice: 202.50 },
    ],
  },
  {
    id: 'po-003',
    number: 'OC-2025-003',
    supplierId: 1,
    supplierName: 'Distribuidora Norte SAC',
    registeredBy: 'Admin',
    createdAt: '2025-03-05T11:00:00Z',
    updatedAt: '2025-03-06T14:00:00Z',
    status: 'recibida',
    details: [
      { id: 'd3-1', color: 'borgona', type: 'rizada',      length: 40, kilo: 2.2, totalPrice: 528.00 },
      { id: 'd3-2', color: 'castano', type: 'extensiones', length: 60, kilo: 1.5, totalPrice: 525.00 },
    ],
  },
  {
    id: 'po-004',
    number: 'OC-2025-004',
    supplierId: 9,
    supplierName: 'Multidistribuciones Perú SAC',
    registeredBy: 'Vendedor2',
    createdAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-01T10:00:00Z',
    status: 'cancelada',
    details: [
      { id: 'd4-1', color: 'rubio-ceniza', type: 'extensiones', length: 60, kilo: 1.0, totalPrice: 350.00 },
    ],
  },
  {
    id: 'po-005',
    number: 'OC-2025-005',
    supplierId: 1,
    supplierName: 'Distribuidora Norte SAC',
    registeredBy: 'Admin',
    createdAt: '2025-04-20T08:30:00Z',
    updatedAt: '2025-04-20T08:30:00Z',
    status: 'pendiente',
    details: [
      { id: 'd5-1', color: 'negro',          type: 'lisa',        length: 40, kilo: 3.5, totalPrice: 612.50 },
      { id: 'd5-2', color: 'marron-claro',   type: 'extensiones', length: 50, kilo: 2.0, totalPrice: 580.00 },
      { id: 'd5-3', color: 'negro-azabache', type: 'cortina',     length: 25, kilo: 1.0, totalPrice: 120.00 },
    ],
  },
];
