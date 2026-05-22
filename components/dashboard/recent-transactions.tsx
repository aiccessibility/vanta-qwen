import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Transaction {
  id: string
  date: string | Date
  description: string
  amount: number
  category?: string
  status?: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  limit?: number
}

export function RecentTransactions({ transactions, limit = 5 }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {transaction.description}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(transaction.date)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {transaction.category && (
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {transaction.category}
                  </Badge>
                )}
                <span
                  className={`text-sm font-semibold ${
                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.amount >= 0 ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
