import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],
      reelId: null, // For attribution tracking

      // Computed
      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.foodItem.price * item.quantity,
          0
        );
      },

      // Actions
      addItem: (foodItem, restaurant, reelId = null) => {
        const state = get();

        // If adding from different restaurant, clear cart first
        if (state.restaurantId && state.restaurantId !== restaurant.id) {
          set({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            items: [{ foodItem, quantity: 1 }],
            reelId
          });
          return { cleared: true };
        }

        // Check if item already exists
        const existingIndex = state.items.findIndex(
          (item) => item.foodItem.id === foodItem.id
        );

        if (existingIndex >= 0) {
          // Increment quantity
          const newItems = [...state.items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          // Add new item
          set({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            items: [...state.items, { foodItem, quantity: 1 }],
            reelId: reelId || state.reelId
          });
        }

        return { cleared: false };
      },

      removeItem: (foodItemId) => {
        const state = get();
        const newItems = state.items.filter(
          (item) => item.foodItem.id !== foodItemId
        );

        if (newItems.length === 0) {
          set({
            restaurantId: null,
            restaurantName: null,
            items: [],
            reelId: null
          });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (foodItemId, quantity) => {
        const state = get();

        if (quantity <= 0) {
          get().removeItem(foodItemId);
          return;
        }

        const newItems = state.items.map((item) =>
          item.foodItem.id === foodItemId
            ? { ...item, quantity }
            : item
        );

        set({ items: newItems });
      },

      clearCart: () => {
        set({
          restaurantId: null,
          restaurantName: null,
          items: [],
          reelId: null
        });
      },

      getOrderPayload: () => {
        const state = get();
        return {
          restaurantId: state.restaurantId,
          items: state.items.map((item) => ({
            foodItemId: item.foodItem.id,
            quantity: item.quantity
          })),
          reelId: state.reelId
        };
      }
    }),
    {
      name: 'foodreels-cart'
    }
  )
);