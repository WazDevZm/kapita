import { useEffect, useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  CreditCard, 
  AlertTriangle,
  ShoppingCart,
  Database,
  Loader2,
} from 'lucide-react'
import { StatCard } from '../components/Card'
import Card from '../components/Card'
import Loading from '../components/Loading'
import { analyticsAPI, salesAPI, expensesAPI } from '../services/api'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [demoLoading, setDemoLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [dailySales, setDailySales] = useState([])
  const [expensesByCategory, setExpensesByCategory] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [dashboardRes, salesRes, expensesRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        salesAPI.getDailySales(),
        expensesAPI.getByCategory(),
      ])

      setDashboardData(dashboardRes.data)
      setDailySales(salesRes.data)
      setExpensesByCategory(expensesRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = async () => {
    setDemoLoading(true)
    try {
      const response = await analyticsAPI.seedDemoData()
      await fetchDashboardData()
      alert(`${response.data.message}. Total records: ${response.data.counts?.total || 0}`)
    } catch (error) {
      console.error('Failed to seed demo data:', error)
      alert(error.response?.data?.detail || 'Failed to load demo data')
    } finally {
      setDemoLoading(false)
    }
  }

  if (loading) return <Loading fullScreen />

  const { summary, recent_activity, alerts } = dashboardData || {}
  const recordCounts = summary?.record_counts || {}

  const nonAiSuggestions = [
    {
      title: 'Invoice generation',
      description: 'Generate and download printable invoices for sales and credits.',
    },
    {
      title: 'Low stock workflows',
      description: 'Create restock thresholds and reminders for fast-moving products.',
    },
    {
      title: 'Multi-user roles',
      description: 'Allow staff accounts with limited permissions for sales or stock entry.',
    },
    {
      title: 'CSV / Excel export',
      description: 'Export products, sales, and expenses for offline accounting reviews.',
    },
  ]

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const formatChartDay = (value) => {
    if (!value) return 'No date'

    const rawValue = String(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
      const [year, month, day] = rawValue.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[Number(month) - 1]} ${Number(day)}`
    }

    const parsedDate = new Date(rawValue)
    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsedDate)
    }

    return rawValue
  }
  const dailySalesChartData = Array.isArray(dailySales)
    ? dailySales.map((item) => ({
        ...item,
        dayLabel: formatChartDay(item?.day),
        total: Number(item?.total || 0),
      }))
    : []
  const expensesChartData = Array.isArray(expensesByCategory)
    ? expensesByCategory.map((item) => ({
        ...item,
        categoryLabel: String(item?.category || '').replace(/_/g, ' '),
        total: Number(item?.total || 0),
      }))
    : []
  const hasDailySalesData = dailySalesChartData.length > 0
  const hasExpenseData = expensesChartData.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your business performance</p>
        </div>
        <button
          onClick={loadDemoData}
          disabled={demoLoading}
          className="btn btn-secondary inline-flex items-center gap-2 self-start md:self-auto"
        >
          {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          <span>{demoLoading ? 'Loading demo data...' : 'Load demo data'}</span>
        </button>
      </div>

      {/* Alerts */}
      {(alerts?.low_stock_count > 0 || alerts?.overdue_credits > 0 || alerts?.negative_cashflow) && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Alerts</h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                {alerts.low_stock_count > 0 && (
                  <li>• {alerts.low_stock_count} product(s) are low on stock</li>
                )}
                {alerts.overdue_credits > 0 && (
                  <li>• {alerts.overdue_credits} overdue credit(s) need attention</li>
                )}
                {alerts.negative_cashflow && (
                  <li>• Negative cashflow detected - review your expenses</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`ZMW ${summary?.total_revenue?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={`ZMW ${summary?.total_expenses?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Net Profit"
          value={`ZMW ${summary?.net_profit?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Current Capital"
          value={`ZMW ${summary?.current_capital?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="primary"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demo record count</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This shows how much business data is currently powering the dashboard.
            </p>
          </div>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {recordCounts.total || 0}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl bg-gray-50 dark:bg-navy-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sales</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{recordCounts.sales || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-navy-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Products</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{recordCounts.products || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-navy-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Customers</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{recordCounts.customers || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-navy-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{recordCounts.expenses || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-navy-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Credits</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{recordCounts.credits || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-navy-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reinvestments</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{recordCounts.reinvestments || 0}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Cash Available"
          value={`ZMW ${summary?.cash_available?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Inventory Value"
          value={`ZMW ${summary?.inventory_value?.toLocaleString() || 0}`}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Credit Outstanding"
          value={`ZMW ${summary?.credit_outstanding?.toLocaleString() || 0}`}
          icon={CreditCard}
          color="yellow"
        />
        <StatCard
          title="Reinvestments"
          value={`ZMW ${summary?.total_reinvestment?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Trend (Last 30 Days)
          </h3>
          {hasDailySalesData ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySalesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dayLabel" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-navy-700 text-sm text-gray-500 dark:text-gray-400">
              No sales data yet. Add sales to populate this chart.
            </div>
          )}
        </Card>

        {/* Expenses by Category */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Expenses by Category
          </h3>
          {hasExpenseData ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoryLabel, percent }) => `${categoryLabel}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {expensesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-navy-700 text-sm text-gray-500 dark:text-gray-400">
              No expense categories yet. Add expenses to populate this chart.
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Sales
          </h3>
          <div className="space-y-3">
            {recent_activity?.sales?.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-navy-700 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">

                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Next non-AI features</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Practical additions that improve daily operations without adding AI yet.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nonAiSuggestions.map((item) => (
                      <div key={item.title} className="rounded-xl border border-gray-200 dark:border-navy-700 p-4 bg-gray-50 dark:bg-navy-800/50">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                      {sale.product_details?.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +ZMW {sale.total_amount}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Expenses
          </h3>
          <div className="space-y-3">
            {recent_activity?.expenses?.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-navy-700 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {expense.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -ZMW {expense.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
