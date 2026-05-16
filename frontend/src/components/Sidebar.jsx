import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Settings,
  LineChart,
  MessageSquare,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/app/products', icon: Package },
  { name: 'Sales', href: '/app/sales', icon: ShoppingCart },
  { name: 'Customers', href: '/app/customers', icon: Users },
  { name: 'Credits', href: '/app/credits', icon: CreditCard },
  { name: 'Expenses', href: '/app/expenses', icon: Receipt },
  { name: 'Reinvestments', href: '/app/reinvestments', icon: TrendingUp },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Projections', href: '/app/projections', icon: LineChart },
  { name: 'Reports', href: '/app/reports', icon: FileText },
  { name: 'AI Assistant', href: '/app/chat', icon: MessageSquare },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-navy-800 border-r border-gray-200 dark:border-navy-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-navy-700">
            <Link to="/app/dashboard" className="flex items-center">
              <img 
                src="/logo1.png" 
                alt="Kapita Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
              <div className="w-10 h-10 bg-primary-600 rounded-lg items-center justify-center hidden">
                <span className="text-white font-bold text-xl">K</span>
              </div>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-navy-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Smart business tracking made simple
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
