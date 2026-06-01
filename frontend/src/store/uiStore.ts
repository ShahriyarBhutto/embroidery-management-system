import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      isSidebarOpen: true,
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.isDarkMode;
          document.documentElement.classList.toggle("dark", next);
          return { isDarkMode: next };
        }),
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    }),
    {
      name: "ui-storage",
      onRehydrateStorage: () => (state) => {
        if (state?.isDarkMode) document.documentElement.classList.add("dark");
      },
    }
  )
);
