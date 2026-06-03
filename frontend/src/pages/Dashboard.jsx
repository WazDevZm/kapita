import { useEffect, useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  CreditCard, 
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react'
import { StatCard } from '../components/Card'
import Card from '../components/Card'
import Loading from '../components/Loading'
import { analyticsAPI, salesAPI, expensesAPI } from '../services/api'
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
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

  if (loading) return <Loading fullScreen />

  const { summary, recent_activity, alerts } = dashboardData || {}
  const recordCounts = summary?.record_counts || {}

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const toDateKey = (dateObj) => {
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
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

  const salesByDay = new Map(
    (Array.isArray(dailySales) ? dailySales : []).map((item) => {
      const rawDay = String(item?.day || '')
      const dayKey = /^\d{4}-\d{2}-\d{2}/.test(rawDay)
        ? rawDay.slice(0, 10)
        : toDateKey(new Date(rawDay))

      return [
        dayKey,
        {
          total: Number(item?.total || 0),
          count: Number(item?.count || 0),
        },
      ]
    })
  )

  const baseTrendData = Array.from({ length: 30 }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (29 - index))

    const dayKey = toDateKey(day)
    const values = salesByDay.get(dayKey) || { total: 0, count: 0 }

    return {
      day: dayKey,
      dayLabel: formatChartDay(dayKey),
      total: Number(values.total || 0),
      count: Number(values.count || 0),
    }
  })

  const dailySalesChartData = Array.isArray(dailySales)
    ? baseTrendData.map((item, index, arr) => {
        const recentWindow = arr.slice(Math.max(0, index - 6), index + 1)
        const rollingAvg =
          recentWindow.reduce((sum, point) => sum + point.total, 0) / recentWindow.length

        return {
          ...item,
          rollingAvg: Number(rollingAvg.toFixed(2)),
        }
      })
    : []
  const expensesChartData = Array.isArray(expensesByCategory)
    ? expensesByCategory.map((item) => ({
        ...item,
        categoryLabel: String(item?.category || '').replace(/_/g, ' '),
        total: Number(item?.total || 0),
      }))
    : []
  const hasDailySalesData = dailySalesChartData.some((item) => item.total > 0 || item.count > 0)
  const hasExpenseData = expensesChartData.length > 0
  const totalRevenue30 = dailySalesChartData.reduce((sum, item) => sum + item.total, 0)
  const totalTransactions30 = dailySalesChartData.reduce((sum, item) => sum + item.count, 0)
  const avgRevenue30 = dailySalesChartData.length
    ? totalRevenue30 / dailySalesChartData.length
    : 0
  const peakDay = dailySalesChartData.reduce(
    (peak, item) => (item.total > peak.total ? item : peak),
    { dayLabel: 'N/A', total: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your business performance</p>
        </div>
      </div>

      {/* Alerts */}
      {(alerts?.low_stock_count > 0 || alerts?.overdue_credits > 0 || alerts?.negative_cashflow) && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Alerts</h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800">
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
            <h3 className="text-lg font-semibold text-gray-900">Live business records</h3>
            <p className="text-sm text-gray-500">
              This shows how much real business data is currently powering the dashboard.
            </p>
          </div>
          <div className="text-3xl font-bold text-primary-600">
            {recordCounts.total || 0}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Sales</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{recordCounts.sales || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Products</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{recordCounts.products || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Customers</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{recordCounts.customers || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Expenses</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{recordCounts.expenses || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Credits</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{recordCounts.credits || 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Reinvestments</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{recordCounts.reinvestments || 0}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          {hasDailySalesData ? (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={dailySalesChartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dayLabel" stroke="#9ca3af" minTickGap={20} tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="revenue"
                    stroke="#10b981"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `ZMW ${(Number(value) / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="transactions"
                    orientation="right"
                    stroke="#6366f1"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#111827',
                    }}
                    formatter={(value, name) => {
                      if (name === 'Revenue' || name === '7-day Avg') {
                        return [`ZMW ${Number(value).toLocaleString()}`, name]
                      }
                      return [Number(value).toLocaleString(), name]
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    fill="url(#revenueTrendFill)"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="rollingAvg"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    name="7-day Avg"
                  />
                  <Bar
                    yAxisId="transactions"
                    dataKey="count"
                    fill="#6366f1"
                    opacity={0.35}
                    barSize={12}
                    radius={[4, 4, 0, 0]}
                    name="Transactions"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">30-day Revenue</p>
                  <p className="mt-1 font-semibold text-gray-900">ZMW {totalRevenue30.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Avg / Day</p>
                  <p className="mt-1 font-semibold text-gray-900">ZMW {avgRevenue30.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Peak Day</p>
                  <p className="mt-1 font-semibold text-gray-900">{peakDay.dayLabel}</p>
                  <p className="text-xs text-gray-600">ZMW {Number(peakDay.total || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Transactions</p>
                  <p className="mt-1 font-semibold text-gray-900">{totalTransactions30.toLocaleString()}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No sales data yet. Add sales to populate this chart.
            </div>
          )}
        </Card>

        {/* Expenses by Category */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#111827',
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No expense categories yet. Add expenses to populate this chart.
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Sales
          </h3>
          <div className="space-y-3">
            {recent_activity?.sales?.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {sale.product_details?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">
                  +ZMW {sale.total_amount}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Expenses
          </h3>
          <div className="space-y-3">
            {recent_activity?.expenses?.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">
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
