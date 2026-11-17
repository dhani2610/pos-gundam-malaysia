"use client";

import { create } from "zustand";
import { SessionUser } from "@/lib/auth";

export interface BranchItem {
  id: number;
  idCabang: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  isMain?: boolean;
}

export interface WebsiteSettingsData {
  idCabang: number;
  siteName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  secondaryBanks?: Array<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }>;
  receiptFooter?: string;
  taxEnabled?: boolean | number;
  taxPercentage?: number;
  taxName?: string;
}

interface AppState {
  user: SessionUser | null;
  activeBranchId: number;
  branches: BranchItem[];
  settings: WebsiteSettingsData | null;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  setUser: (user: SessionUser | null) => void;
  setActiveBranchId: (id: number) => void;
  setBranches: (branches: BranchItem[]) => void;
  setSettings: (settings: WebsiteSettingsData | null) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  activeBranchId: 1,
  branches: [],
  settings: null,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  setUser: (user) =>
    set((state) => ({
      user,
      activeBranchId: user ? user.idCabang : state.activeBranchId,
    })),
  setActiveBranchId: (id) => set({ activeBranchId: id }),
  setBranches: (branches) => set({ branches }),
  setSettings: (settings) => set({ settings }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
}));
