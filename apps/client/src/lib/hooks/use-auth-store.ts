import { User } from "@myorg/api-client";
import { StoreApi, create } from "zustand";

export type AuthStore = {
  status: "authenticated" | "loading" | "unauthenticated";
  user: User | null;
  clear: () => void;
  set: StoreApi<AuthStore>["setState"];
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: "loading",
  clear: () => set({ user: null, status: "unauthenticated" }),
  set: (newData) => {
    set(newData);
  },
}));
