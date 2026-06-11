import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  vendorName?: string;
}

interface CartState {
  items: CartItem[];
  deliveryAddress: string;
  customInstructions: string;
  paymentMethod: 'CASH' | 'RAZORPAY';

  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryAddress: (address: string) => void;
  setCustomInstructions: (instructions: string) => void;
  setPaymentMethod: (method: 'CASH' | 'RAZORPAY') => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  deliveryAddress: '',
  customInstructions: '',
  paymentMethod: 'CASH',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }));
  },

  clearCart: () => {
    set({ items: [], deliveryAddress: '', customInstructions: '' });
  },

  setDeliveryAddress: (address) => set({ deliveryAddress: address }),
  setCustomInstructions: (instructions) => set({ customInstructions: instructions }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
