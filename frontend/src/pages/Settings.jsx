import { useState, useEffect } from 'react'
import { User, Building, Lock } from 'lucide-react'
import Card from '../components/Card'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { authAPI } from '../services/api'

export default function Settings() {
  const { user, updateProfile } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
    currency: 'ZMW',
  })

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        business_name: user.business_name || '',
        currency: user.currency || 'ZMW',
      })
    }
  }, [user])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })
      setMessage({ type: 'success', text: 'Password changed successfully' })
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.old_password?.[0] || 'Failed to change password' 
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'security', name: 'Security', icon: Lock },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-navy-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setMessage({ type: '', text: '' })
              }}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile Information
          </h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={user?.email || ''}
                disabled
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      )}

      {/* Business Tab */}
      {activeTab === 'business' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Business Settings
          </h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="label">Business Name</label>
              <input
                type="text"
                className="input"
                value={profileData.business_name}
                onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={profileData.currency}
                onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
              >
                <option value="ZMW">ZMW - Zambian Kwacha</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            <div>
              <label className="label">Theme</label>
              <select
                className="input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                required
                className="input"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
              />
            </div>

            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                required
                className="input"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                required
                className="input"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}
