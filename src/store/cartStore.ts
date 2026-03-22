import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { gtag } from '../lib/gtag';

export interface CartItem {
  product_id: string;
  name_ar: string;
  name_en: string;
  price_dzd: number;
  price_chargily?: number;
  image: string;
  variant: { group: string; option: string } | null;
  quantity: number;
  stock_limit: number;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  clearCart: () => void;
  getTotal: (paymentMethod?: string) => number;
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
        const existingItem = items.find((i) => i.product_id === item.product_id);
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;
          if (newQuantity > item.stock_limit) {
            toast.error(`عذراً، الكمية المطلوبة تتجاوز المتوفر في المخزون (${item.stock_limit})`);
            return;
          }
          
          set({
            items: items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: newQuantity }
                : i
            ),
          });
          toast.success("تم تحديث الكمية في السلة");
        } else {
          set({ items: [...items, item] });
          toast.success("تمت الإضافة إلى السلة");
          
          // Track add_to_cart for GA4
          gtag.trackEcommerce('add_to_cart', {
            currency: 'DZD',
            value: item.price_dzd * item.quantity,
            items: [{
              item_id: item.product_id,
              item_name: item.name_en,
              price: item.price_dzd,
              quantity: item.quantity
            }]
          });
        }
      },
      updateQuantity: (product_id, quantity) => {
        const { items } = get();
        const item = items.find(i => i.product_id === product_id);
        if (!item) return;

        if (quantity > item.stock_limit) {
          toast.error(`عذراً، المتوفر في المخزون هو ${item.stock_limit} قطع فقط`);
          return;
        }

        if (quantity < 1) return;

        set({
          items: items.map((i) =>
            i.product_id === product_id ? { ...i, quantity } : i
          ),
        });
      },
      removeItem: (product_id) => {
        set({ items: get().items.filter((i) => i.product_id !== product_id) });
      },
      clearCart: () => set({ items: [] }),
      getTotal: (paymentMethod?: string) => get().items.reduce((total, item) => {
        const price = (paymentMethod === 'chargily' && item.price_chargily && item.price_chargily > 0)
          ? item.price_chargily 
          : item.price_dzd;
        return total + (price * (item.quantity || 1));
      }, 0),
      getItemCount: () => get().items.reduce((total, item) => total + (item.quantity || 1), 0),
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
