import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

interface CartStoreState {
  cart: Product[];
  coupon: Coupon | null;
  total: number;
  subtotal: number;
  isCouponApplied: boolean;
  getMyCoupon: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  getCartItems: () => Promise<void>;
  clearCart: () => void;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  calculateTotals: () => void;
}

export const useCartStore = create<CartStoreState>((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const response = await axios.get<Coupon>("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", (error as AxiosError).message);
    }
  },

  applyCoupon: async (code) => {
    try {
      const response = await axios.post<Coupon>("/coupons/validate", { code });
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "Failed to apply coupon"
      );
    }
  },

  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  getCartItems: async () => {
    try {
      const res = await axios.get<Product[]>("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "An error occurred in fetching cart items"
      );
    }
  },

  clearCart: () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
  },

  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product.id });
      toast.success("Product added to cart");

      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item.id === product.id
        );
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity! + 1 }
                : item
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "An error occurred in adding to cart"
      );
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete(`/cart/${productId}`);
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item.id !== productId),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "Failed to remove product"
      );
    }
  },

  updateQuantity: async (productId, quantity) => {
    console.log("quantity: ", quantity);
    if (quantity === 0) {
      await get().removeFromCart(productId);
      return;
    }

    try {
      await axios.put(`/cart/${productId}`, { quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "Failed to update quantity"
      );
    }
  },

  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity!,
      0
    );

    if (!coupon) {
      set({ subtotal, total: subtotal });
    } else {
      const discount = subtotal * (coupon.discount_percentage / 100);
      const _total = subtotal - discount;
      set({ subtotal, total: _total });
    }
  },
}));
