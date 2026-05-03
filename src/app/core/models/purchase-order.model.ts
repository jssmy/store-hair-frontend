import { HairColor, HairType } from "../../features/products/products.data";
import { PurchaseOrderStatus } from "../../features/purchase-order/purchase-order.data";

export interface Supplier {
  id: number;
  name: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderDetail {
  id: number;
  color: HairColor;
  type: Exclude<HairType, 'todos'>;
  length: number;
  weight: number;
  price: number;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: number;
  status: PurchaseOrderStatus;
  oc: string;
  user: {
    id: string;
    name: string;
  };
  supplier: Supplier;
  details: PurchaseOrderDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderDetailDto {
  color: string;
  type: string;
  length: number;
  weight: number;
  price: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: number;
  details: CreatePurchaseOrderDetailDto[];
}

export interface UpdatePurchaseOrderDto {
  supplierId?: number;
  details?: CreatePurchaseOrderDetailDto[];
}

export interface PurchaseOrderQueryParams {
  page: number;
  limit: number;
}
