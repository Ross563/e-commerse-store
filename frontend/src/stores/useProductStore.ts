import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

interface ProductStoreState {
  products: Product[];
  loading: boolean;
  setProducts: (products: Product[]) => void;
  createProduct: (productData: CreateProductData) => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  fetchProductsByCategory: (category: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleFeaturedProduct: (productId: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
}

export const useProductStore = create<ProductStoreState>((set) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) =>
        formData.append(key, value)
      );

      const { data } = await axios.post<Product>("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((prevState) => ({
        products: [...prevState.products, data],
        loading: false,
      }));
    } catch (error) {
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "An error occurred while creating the product"
      );
      set({ loading: false });
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get<{ products: Product[] }>("/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "Failed to fetch products"
      );
    }
  },

  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const response = await axios.get<{ products: Product[] }>(
        `/products/category/${category}`
      );
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "Failed to fetch products"
      );
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      set((prevState) => ({
        products: prevState.products.filter(
          (product) => product.id !== productId
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "Failed to delete product"
      );
    }
  },

  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const response = await axios.patch<{ is_featured: boolean }>(
        `/products/${productId}`
      );

      set((prevState) => ({
        products: prevState.products.map((product) =>
          product.id === productId
            ? { ...product, is_featured: response.data.is_featured }
            : product
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "Failed to update product"
      );
    }
  },

  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get<Product[]>("/products/featured");
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.log("Error fetching featured products:", error);
    }
  },
}));
