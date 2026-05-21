import { create } from 'zustand'

interface DashboardState {
  transactions: any[]
  balance: number
  setTransactions: (transactions: any[]) => void
  setBalance: (balance: number) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  transactions: [],
  balance: 0,
  setTransactions: (transactions) => set({ transactions }),
  setBalance: (balance) => set({ balance }),
}))
