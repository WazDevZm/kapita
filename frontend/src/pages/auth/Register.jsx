import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    business_name: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (formData.password !== formData.password2) {
      setErrors({ password2: ['Passwords do not match'] })
      return
    }

    const result = await register(formData)
    if (result.success) {
      navigate('/login')
    } else {
      setErrors(result.error || {})
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-900 px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Start tracking your business today
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username[0]}</p>
                )}
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
                )}
              </div>

              <div>
                <label className="label">Business Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  required
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
                )}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="input"
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                />
                {errors.password2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.password2[0]}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
