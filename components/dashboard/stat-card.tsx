import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  type: 'currency' | 'number'
  trend?: 'up' | 'down' | 'neutral'
  icon: 'balance' | 'revenue' | 'expenses' | 'documents'
}

const iconMap = {
  balance: DollarSign,
  revenue: TrendingUp,
  expenses: TrendingDown,
  documents: FileText,
}

export function StatCard({ title, value, type, trend, icon }: StatCardProps) {
  const Icon = iconMap[icon]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {type === 'currency' ? formatCurrency(value) : value.toLocaleString()}
        </div>
        {trend && (
          <p className="text-xs text-gray-500 mt-1">
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
            {' '}from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}
