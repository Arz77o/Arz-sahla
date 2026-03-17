import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export interface CartItem {
  product_id: string;
  name_ar: string;
  name_en: string;
  price_dzd: number;
  image: string;
  variant: { group: string; option: string } | null;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isInCart: (product_id: string) => boolean;
  setHydrated: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      addItem: (item) => {
        const { items } = get();
        if (items.some((i) => i.product_id === item.product_id)) {
          toast.error("المنتج موجود في سلتك مسبقاً");
          return;
        }
        set({ items: [...items, item] });
        toast.success("تمت الإضافة إلى السلة");
      },
      removeItem: (product_id) => {
        set({ items: get().items.filter((i) => i.product_id !== product_id) });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((total, item) => total + item.price_dzd, 0),
      getItemCount: () => get().items.length,
      isInCart: (product_id) => get().items.some((i) => i.product_id === product_id),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'sahla_cart',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
