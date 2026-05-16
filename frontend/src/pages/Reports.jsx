import { useState } from 'react'
import { FileText, Download, Calendar } from 'lucide-react'
import Card from '../components/Card'
import Loading from '../components/Loading'
import { analyticsAPI } from '../services/api'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('monthly')
  const [reportData, setReportData] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = { type: reportType }
      
      if (reportType === 'monthly') {
        params.month = selectedMonth
        params.year = selectedYear
      } else if (reportType === 'yearly') {
        params.year = selectedYear
      }
      
      const response = await analyticsAPI.getComprehensiveReport(params)
      setReportData(response.data)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    const { report_info, executive_summary, sales_analysis, expense_analysis, credit_analysis, inventory_analysis, customer_analysis, recommendations } = reportData

    // Title Page
    doc.setFontSize(24)
    doc.setFont(undefined, 'bold')
    doc.text('KAPITA', 105, 30, { align: 'center' })
    
    doc.setFontSize(18)
    doc.text('Business Report', 105, 45, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(report_info.business_name, 105, 60, { align: 'center' })
    doc.text(report_info.period.label, 105, 70, { align: 'center' })
    doc.text(`Generated: ${new Date(report_info.generated_at).toLocaleDateString()}`, 105, 80, { align: 'center' })

    // Executive Summary
    doc.addPage()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Executive Summary', 14, 20)
    
    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Sales', `${report_info.currency} ${executive_summary.total_sales.toLocaleString()}`],
        ['Total Profit', `${report_info.currency} ${executive_summary.total_profit.toLocaleString()}`],
        ['Total Expenses', `${report_info.currency} ${executive_summary.total_expenses.toLocaleString()}`],
        ['Net Profit', `${report_info.currency} ${executive_summary.net_profit.toLocaleString()}`],
        ['Profit Margin', `${executive_summary.profit_margin.toFixed(2)}%`],
        ['Transactions', executive_summary.transaction_count],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    })

    // Sales Analysis
    doc.addPage()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Sales Analysis', 14, 20)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Total Sales: ${report_info.currency} ${sales_analysis.total_sales.toLocaleString()}`, 14, 35)
    doc.text(`Daily Average: ${report_info.currency} ${sales_analysis.daily_average.toLocaleString()}`, 14, 45)
    
    doc.autoTable({
      startY: 55,
      head: [['Payment Type', 'Amount']],
      body: Object.entries(sales_analysis.by_payment_type).map(([type, amount]) => [
        type.replace('_', ' ').toUpperCase(),
        `${report_info.currency} ${amount.toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    })

    // Top Products
    if (sales_analysis.top_products.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Top Products', 'Quantity', 'Revenue']],
        body: sales_analysis.top_products.map(p => [
          p.name,
          p.quantity,
          `${report_info.currency} ${p.revenue.toLocaleString()}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
      })
    }

    // Expense Analysis
    doc.addPage()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Expense Analysis', 14, 20)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Total Expenses: ${report_info.currency} ${expense_analysis.total_expenses.toLocaleString()}`, 14, 35)
    
    doc.autoTable({
      startY: 45,
      head: [['Category', 'Amount']],
      body: Object.entries(expense_analysis.by_category)
        .filter(([_, amount]) => amount > 0)
        .map(([category, amount]) => [
          category.replace('_', ' ').toUpperCase(),
          `${report_info.currency} ${amount.toLocaleString()}`
        ]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
    })

    // Largest Expenses
    if (expense_analysis.largest_expenses.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Largest Expenses', 'Category', 'Amount', 'Date']],
        body: expense_analysis.largest_expenses.slice(0, 10).map(e => [
          e.title,
          e.category,
          `${report_info.currency} ${e.amount.toLocaleString()}`,
          new Date(e.date).toLocaleDateString()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
      })
    }

    // Credit Analysis
    doc.addPage()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Credit Analysis', 14, 20)
    
    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Credit Issued', `${report_info.currency} ${credit_analysis.total_issued.toLocaleString()}`],
        ['Total Collected', `${report_info.currency} ${credit_analysis.total_collected.toLocaleString()}`],
        ['Outstanding', `${report_info.currency} ${credit_analysis.outstanding.toLocaleString()}`],
        ['Collection Rate', `${credit_analysis.collection_rate.toFixed(2)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [251, 191, 36] },
    })

    // Top Debtors
    if (credit_analysis.top_debtors.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Top Debtors', 'Amount Owed', 'Status', 'Due Date']],
        body: credit_analysis.top_debtors.map(d => [
          d.customer,
          `${report_info.currency} ${d.amount_owed.toLocaleString()}`,
          d.status.toUpperCase(),
          d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [251, 191, 36] },
      })
    }

    // Inventory Analysis
    doc.addPage()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Inventory Analysis', 14, 20)
    
    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Products', inventory_analysis.total_products],
        ['Inventory Value', `${report_info.currency} ${inventory_analysis.inventory_value.toLocaleString()}`],
        ['Low Stock Items', inventory_analysis.low_stock_count],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Low Stock Products
    if (inventory_analysis.low_stock_products.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Low Stock Products', 'Current', 'Minimum']],
        body: inventory_analysis.low_stock_products.map(p => [
          p.name,
          p.quantity,
          p.minimum_stock
        ]),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
      })
    }

    // Customer Analysis
    doc.addPage()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Customer Analysis', 14, 20)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Total Customers: ${customer_analysis.total_customers}`, 14, 35)
    
    if (customer_analysis.top_customers.length > 0) {
      doc.autoTable({
        startY: 45,
        head: [['Top Customers', 'Total Purchases', 'Transactions']],
        body: customer_analysis.top_customers.map(c => [
          c.name,
          `${report_info.currency} ${c.total_purchases.toLocaleString()}`,
          c.transaction_count
        ]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
      })
    }

    // Recommendations
    if (recommendations.length > 0) {
      doc.addPage()
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('Recommendations', 14, 20)
      
      let yPos = 35
      recommendations.forEach((rec, index) => {
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text(`${index + 1}. ${rec.title}`, 14, yPos)
        doc.setFont(undefined, 'normal')
        doc.text(rec.message, 14, yPos + 7, { maxWidth: 180 })
        yPos += 20
        
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
      })
    }

    // Save PDF
    const filename = `Kapita_Report_${report_info.period.label.replace(/ /g, '_')}.pdf`
    doc.save(filename)
  }

  const exportToCSV = () => {
    if (!reportData) return

    const { report_info, executive_summary, sales_analysis, expense_analysis } = reportData
    
    let csv = `Kapita Business Report\n`
    csv += `${report_info.business_name}\n`
    csv += `Period: ${report_info.period.label}\n`
    csv += `Generated: ${new Date(report_info.generated_at).toLocaleDateString()}\n\n`
    
    csv += `Executive Summary\n`
    csv += `Metric,Value\n`
    csv += `Total Sales,${executive_summary.total_sales}\n`
    csv += `Total Profit,${executive_summary.total_profit}\n`
    csv += `Total Expenses,${executive_summary.total_expenses}\n`
    csv += `Net Profit,${executive_summary.net_profit}\n`
    csv += `Profit Margin,${executive_summary.profit_margin}%\n`
    csv += `Transactions,${executive_summary.transaction_count}\n\n`
    
    csv += `Sales by Payment Type\n`
    csv += `Payment Type,Amount\n`
    Object.entries(sales_analysis.by_payment_type).forEach(([type, amount]) => {
      csv += `${type},${amount}\n`
    })
    csv += `\n`
    
    csv += `Expenses by Category\n`
    csv += `Category,Amount\n`
    Object.entries(expense_analysis.by_category).forEach(([category, amount]) => {
      csv += `${category},${amount}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Kapita_Report_${report_info.period.label.replace(/ /g, '_')}.csv`
    a.click()
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
              <option value="monthly">Monthly Report</option>
              <option value="yearly">Yearly Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {reportType === 'monthly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Month</label>
                <select
                  className="input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select
                  className="input"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {reportType === 'yearly' && (
            <div>
              <label className="label">Year</label>
              <select
                className="input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2 w-full justify-center"
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
