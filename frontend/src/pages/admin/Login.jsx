import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import PasswordInput from '../../components/PasswordInput'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, logout, loading } = useAuthStore()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const result = await login(formData)

    if (result.success && result.user?.is_staff) {
      navigate('/admin/overview')
      return
    }

    logout()
    setError('Admin access required. Please use an admin account.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-900 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src="/logo1.png"
              alt="Kapita Logo"
              className="h-24 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'flex'
              }}
            />
            <div className="hidden h-24 w-24 items-center justify-center rounded-2xl bg-primary-600">
              <span className="text-4xl font-bold text-white">K</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Login</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to manage users, subscriptions, and payment verifications.
          </p>
        </div>

        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
          <p className="font-semibold">Default admin credentials (local dev)</p>
          <p className="mt-1">
            Username: <code className="font-mono">admin</code>
          </p>
          <p>
            Password: <code className="font-mono">admin12345</code>
          </p>
          <p className="mt-2 text-xs text-primary-800/80 dark:text-primary-300/80">
            Create or reset with: <code className="font-mono">python manage.py create_admin</code>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="label">Username</label>
              <input
                type="text"
                required
                className="input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <PasswordInput
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Regular user?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Go to user login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
