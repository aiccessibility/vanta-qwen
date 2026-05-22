import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface TaxOverviewProps {
  estimatedQuarterlyTax?: number
  paidThisYear?: number
  nextPaymentDue?: string
}

export function TaxOverview({
  estimatedQuarterlyTax = 2450,
  paidThisYear = 7350,
  nextPaymentDue = 'Jan 15, 2025',
}: TaxOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estimated Quarterly Tax</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(estimatedQuarterlyTax)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Paid This Year</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(paidThisYear)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Next Payment Due</span>
            <span className="text-sm font-semibold text-gray-900">
              {nextPaymentDue}
            </span>
          </div>
          <div className="pt-4 border-t">
            <Button className="w-full" variant="default">
              View Tax Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
