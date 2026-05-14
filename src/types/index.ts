export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  phone?: string;
  [key: string]: unknown;
}

export interface Deposit {
  _id: string;
  user?: { name: string; role?: string };
  amount: number;
  method: string;
  paymentProof: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Dispute {
  _id: string;
  buyer?: { name: string };
  farmer?: { name: string };
  product?: { title: string };
  reason?: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Order {
  _id: string;
  buyer?: { name: string };
  farmer?: { name: string };
  product?: { title: string };
  totalPrice?: number;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Product {
  _id: string;
  title: string;
  farmer?: { name: string };
  price: number;
  stock: number;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Transaction {
  _id: string;
  user?: { name: string };
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Verification {
  _id: string;
  user?: { name: string };
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Withdrawal {
  _id: string;
  user?: { name: string; role?: string };
  amount: number;
  method: string;
  accountDetails?: {
    accountTitle?: string;
    accountNumber?: string;
    bankName?: string;
  };
  adminNotes?: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}
