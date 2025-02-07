/// <reference types="vite/client" />

interface AxiosError extends Error {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  isAxiosError?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface CreateProductData {
  id?: string;
  image: File | null;
  name: string;
  description?: string;
  price: string;
  category?: string;
}

interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  is_featured?: boolean;
  quantity?: number;
  created_at?: Date;
}

interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
}
