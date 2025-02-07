export interface Coupon {
  id: number;
  code: string;
  user_id: number;
  discount_percentage: number;
  expiration_date: Date;
  is_active: boolean;
}
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image: string;
  category?: string;
  is_featured?: boolean;
  quantity?: number;
  created_at?: Date;
}

export interface AnalyticsData {
  users: number;
  products: number;
  totalSales: number;
  totalRevenue: number;
}

export interface DailySalesData {
  date: string;
  sales: number;
  revenue: number;
}
