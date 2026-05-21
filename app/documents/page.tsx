export default function DocumentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Invoice_001.pdf', type: 'Invoice', date: 'Dec 20, 2024', status: 'Processed' },
          { name: 'Receipt_AWS_Dec.pdf', type: 'Receipt', date: 'Dec 19, 2024', status: 'Processed' },
          { name: 'Contract_ClientA.pdf', type: 'Contract', date: 'Dec 15, 2024', status: 'Pending' },
          { name: 'Tax_Form_Q3.pdf', type: 'Tax Document', date: 'Sep 15, 2024', status: 'Processed' },
          { name: 'Bank_Statement_Nov.pdf', type: 'Bank Statement', date: 'Nov 30, 2024', status: 'Processed' },
          { name: 'Expense_Report_Dec.pdf', type: 'Expense Report', date: 'Dec 18, 2024', status: 'Processing' },
        ].map((doc, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                  <p className="text-sm text-gray-500">{doc.type}</p>
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                doc.status === 'Processed' ? 'bg-green-100 text-green-800' :
                doc.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {doc.status}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">Uploaded {doc.date}</p>
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
