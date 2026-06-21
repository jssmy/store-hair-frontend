import { HairColor, HairType } from "../../features/products/products.data";
import { PurchaseOrderStatus } from "../../features/purchase-order/purchase-order.data";
import { Supplier } from "../../features/suppliers/suppliers.data";


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
  exchangeRate?: number;
  exchangeCurrency?: string;
  tc_usd?: number;
  tc_converted_currency?: string;
  tc_converted_value?: number;
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
  tc_usd?: number;
  tc_converted_currency?: string;
  tc_converted_value?: number;
}

export interface UpdatePurchaseOrderDto {
  supplierId?: number;
  details?: CreatePurchaseOrderDetailDto[];
  tc_usd?: number;
  tc_converted_currency?: string;
  tc_converted_value?: number;
}

export interface PurchaseOrderQueryParams {
  page: number;
  limit: number;
  status?: PurchaseOrderStatus;
  search?: string;
}
