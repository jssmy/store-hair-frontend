export enum SalePaymentMethod {
  CASH   = 'cash',
  CREDIT = 'credit',
}

export enum SalePaymentType {
  CASH     = 'cash',
  TRANSFER = 'transfer',
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
  names: string;
  phone?: string;
  dni?: string;
  email?: string;
}

export interface SaleUser {
  id: string;
  email: string;
  name: string;
}

export interface SalePayment {
  id: number;
  amount: string | number;
  type: SalePaymentType;
  imageUrl: string | null;
  createdAt: string;
}

export interface Sale {
  id: number;
  vt: string;
  paymentMethod: SalePaymentMethod;
  customerId?: number;
  customer?: SaleCustomer;
  user?: SaleUser;
  details: SaleDetail[];
  payments: SalePayment[];
  totalAmount: string | number;
  cashAmount: string | number;
  transferAmount: string | number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
