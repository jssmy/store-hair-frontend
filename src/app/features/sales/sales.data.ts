export enum SalePaymentMethod {
  CASH   = 'cash',
  CREDIT = 'credit',
}

export interface SaleProduct {
  id: number;
  po: string;
  name: string;
  type: string;
  color: string;
  price: string;
  length: string;
  weight: string;
  createdAt: string;
}

export interface SaleDetail {
  id: number;
  salePrice: string | number;
  product: SaleProduct;
}

export interface SaleCustomer {
  id: number;
  fullName?: string;
  businessName?: string;
  phone?: string;
  email?: string;
}

export interface Sale {
  id: number;
  vt: string;
  paymentMethod: SalePaymentMethod;
  customerId?: number;
  customer?: SaleCustomer;
  details: SaleDetail[];
  totalAmount: number;
  cashAmount: number;
  transferAmount: number;
  notes?: string;
  createdAt: string;
}
