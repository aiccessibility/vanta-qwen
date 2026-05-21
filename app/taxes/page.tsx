export default function TaxesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tax Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Q4 2024 Estimated Tax</h3>
          <p className="text-3xl font-bold text-gray-900">$2,450.00</p>
          <p className="text-sm text-gray-500 mt-2">Due: Jan 15, 2025</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">YTD Tax Paid</h3>
          <p className="text-3xl font-bold text-gray-900">$7,350.00</p>
          <p className="text-sm text-gray-500 mt-2">Last payment: Dec 15, 2024</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Effective Tax Rate</h3>
          <p className="text-3xl font-bold text-gray-900">24.5%</p>
          <p className="text-sm text-gray-500 mt-2">Based on current income</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Tax Payments History</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Q3 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$2,450.00</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sep 15, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sep 14, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Q2 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$2,450.00</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jun 15, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jun 10, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Q1 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$2,450.00</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 15, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 12, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
