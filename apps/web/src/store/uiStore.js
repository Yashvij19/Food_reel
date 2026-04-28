import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // Drawers
  commentDrawerOpen: false,
  cartDrawerOpen: false,
  menuDrawerOpen: false,
  activeReelId: null,

  // Modals
  qrPaymentModalOpen: false,
  qrPayload: null,
  currentOrderId: null,

  // Toasts
  toasts: [],

  // Navigation
  showNavbar: true,

  // Actions
  openCommentDrawer: (reelId) => {
    set({ commentDrawerOpen: true, activeReelId: reelId });
  },

  closeCommentDrawer: () => {
    set({ commentDrawerOpen: false, activeReelId: null });
  },

  openCartDrawer: () => {
    set({ cartDrawerOpen: true });
  },

  closeCartDrawer: () => {
    set({ cartDrawerOpen: false });
  },

  openMenuDrawer: () => {
    set({ menuDrawerOpen: true });
  },

  closeMenuDrawer: () => {
    set({ menuDrawerOpen: false });
  },

  openQRPaymentModal: (orderId, qrPayload) => {
    set({
      qrPaymentModalOpen: true,
      qrPayload,
      currentOrderId: orderId
    });
  },

  closeQRPaymentModal: () => {
    set({
      qrPaymentModalOpen: false,
      qrPayload: null,
      currentOrderId: null
    });
  },

  setShowNavbar: (show) => {
    set({ showNavbar: show });
  },

  // Toast management
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };

    set({ toasts: [...get().toasts, toast] });

    // Auto remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, duration);

    return id;
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  // Convenience methods for toast types
  showSuccess: (message) => get().addToast(message, 'success'),
  showError: (message) => get().addToast(message, 'error'),
  showInfo: (message) => get().addToast(message, 'info')
}));