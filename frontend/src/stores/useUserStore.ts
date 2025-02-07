import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface UserStoreState {
  user: User | null;
  loading: boolean;
  checkingAuth: boolean;
  signup: (data: SignUpFormData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changeRole: (navigate: ReturnType<typeof useNavigate>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post<User>("/auth/signup", {
        name,
        email,
        password,
      });
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "An error occurred during signup"
      );
    }
  },

  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post<User>("/auth/login", { email, password });
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "An error occurred during login"
      );
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "An error occurred during logout"
      );
    }
  },

  changeRole: async (navigate: ReturnType<typeof useNavigate>) => {
    set({ loading: true });
    try {
      const res = await axios.post<User>("/auth/change-role");
      set({ user: res.data, loading: false });
      navigate("/secret-dashboard");
    } catch (error) {
      set({ loading: false });
      toast.error(
        (error as AxiosError)?.response?.data?.message ||
          "An error occurred during changing role"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get<User>("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      console.log("checkAuth error:", (error as AxiosError).message);
      set({ checkingAuth: false, user: null });
    }
  },
}));
