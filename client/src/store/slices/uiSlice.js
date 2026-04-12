import { createSlice } from '@reduxjs/toolkit';

// Transient UI state (mobile menu, cart drawer, etc.) lives here so it
// doesn't pollute the auth/product caches.
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    cartDrawerOpen: false,
    filterDrawerOpen: false,
  },
  reducers: {
    toggleMobileMenu(state) {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    closeMobileMenu(state) {
      state.mobileMenuOpen = false;
    },
    toggleCartDrawer(state) {
      state.cartDrawerOpen = !state.cartDrawerOpen;
    },
    closeCartDrawer(state) {
      state.cartDrawerOpen = false;
    },
    toggleFilterDrawer(state) {
      state.filterDrawerOpen = !state.filterDrawerOpen;
    },
  },
});

export const {
  toggleMobileMenu,
  closeMobileMenu,
  toggleCartDrawer,
  closeCartDrawer,
  toggleFilterDrawer,
} = uiSlice.actions;
export default uiSlice.reducer;
