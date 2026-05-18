import { Menu, Bell, Moon, Sun, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useState, useEffect } from 'react'
import { notificationsAPI } from '../services/api'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount()
      setUnreadCount(response.data.count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.business_name || 'Kapita'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Welcome back, {user?.first_name || user?.username}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {user?.access_status && !user?.is_staff && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-navy-700 dark:text-gray-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{user.access_status.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
