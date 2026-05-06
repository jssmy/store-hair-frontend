import { PurchaseOrder } from '../../core/models/purchase-order.model';
import type { HairColor, HairType } from '../products/products.data';

// ── Status ────────────────────────────────────────────────────────────

export enum PurchaseOrderStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    CANCELED = 'canceled',
    COMPLETED = 'completed',
}

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.PENDING]: 'Pendiente',
  [PurchaseOrderStatus.APPROVED]: 'Aprobada',
  [PurchaseOrderStatus.CANCELED]: 'Cancelada',
  [PurchaseOrderStatus.COMPLETED]: 'Completada',
};

// ── Detail model (lo que se compra: por kilo/lote) ────────────────────
// Constraint: no two details with same (color + type + length) in one PO

export interface PurchaseOrderDetail {
  id: string;
  color: HairColor;
  type: Exclude<HairType, 'todos'>;
  length: number;      // largo en cm
  kilo: number;        // kg del lote
  totalPrice: number;  // precio total del detalle
}

// ── Purchase Order model ──────────────────────────────────────────────


// ── Drawer types ──────────────────────────────────────────────────────

export interface PurchaseOrderDrawerData {
  purchaseOrder?: PurchaseOrder;
}

export type PurchaseOrderDrawerResult = PurchaseOrder;


