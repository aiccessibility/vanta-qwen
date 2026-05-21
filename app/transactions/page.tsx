export default function TransactionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
          Import Transactions
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search transactions..."
              className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
              <option>All Types</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
              <option>All Categories</option>
              <option>Sales</option>
              <option>Services</option>
              <option>Office</option>
              <option>Software</option>
            </select>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 20, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Stripe Payment</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sales</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">+$1,250.00</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 19, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">AWS Services</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Software</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">-$320.00</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 18, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Office Supplies</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Office</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">-$85.50</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
