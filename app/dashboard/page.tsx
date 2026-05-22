'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { TaxOverview } from '@/components/dashboard/tax-overview'

// Mock data - will be replaced with real data from API
const mockTransactions = [
  { id: '1', date: new Date('2024-12-20'), description: 'Stripe Payment', amount: 1250, category: 'Sales' },
  { id: '2', date: new Date('2024-12-19'), description: 'AWS Services', amount: -320, category: 'Software' },
  { id: '3', date: new Date('2024-12-18'), description: 'Office Supplies', amount: -85.50, category: 'Office' },
  { id: '4', date: new Date('2024-12-17'), description: 'Client Payment', amount: 2500, category: 'Services' },
  { id: '5', date: new Date('2024-12-16'), description: 'Software License', amount: -199, category: 'Software' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your financial overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={24500}
          type="currency"
          trend="up"
          icon="balance"
        />
        <StatCard
          title="Monthly Revenue"
          value={8250}
          type="currency"
          trend="up"
          icon="revenue"
        />
        <StatCard
          title="Monthly Expenses"
          value={3180}
          type="currency"
          trend="down"
          icon="expenses"
        />
        <StatCard
          title="Pending Documents"
          value={5}
          type="number"
          icon="documents"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={mockTransactions} limit={5} />
        <TaxOverview />
      </div>
    </div>
  )
}
