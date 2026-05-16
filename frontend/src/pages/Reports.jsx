import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import Card from '../components/Card'
import Loading from '../components/Loading'
import { analyticsAPI } from '../services/api'

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('daily')
  const [reportData, setReportData] = useState(null)
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: '',
  })

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = { type: reportType }
      if (reportType === 'custom') {
        params.start_date = dateRange.start_date
        params.end_date = dateRange.end_date
      }
      
      const response = await analyticsAPI.getReports(params)
      setReportData(response.data)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    // In a real app, you'd use a library like jsPDF
    alert('PDF export would be implemented here')
  }

  const exportToCSV = () => {
    // In a real app, you'd generate and download CSV
    alert('CSV export would be implemented here')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate business performance reports</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generate Report
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="label">Report Type</label>
            <select
              className="input"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {reportType === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                />
              </div>
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </Card>

      {/* Report Results */}
      {reportData && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {reportData.report_type.charAt(0).toUpperCase() + reportData.report_type.slice(1)} Report
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={exportToPDF}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Period */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Report Period</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(reportData.period.start).toLocaleDateString()} - {new Date(reportData.period.end).toLocaleDateString()}
                </p>
              </div>

              {/* Sales Summary */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Sales Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                    <p className="text-2xl font-bold text-green-600">
                      ZMW {reportData.sales.total_sales.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ZMW {reportData.sales.total_profit.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {reportData.sales.transaction_count}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expenses Summary */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Expenses Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ZMW {reportData.expenses.total_expenses.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expense Count</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {reportData.expenses.expense_count}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credits Summary */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Credits Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-navy-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Issued</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ZMW {reportData.credits.total_issued.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ZMW {reportData.credits.total_collected.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Credit Count</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reportData.credits.credit_count}
                    </p>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Net Profit</h4>
                <p className={`text-3xl font-bold ${
                  reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ZMW {reportData.net_profit.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
