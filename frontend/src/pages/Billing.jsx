import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BadgeCheck, Clock3, FileUp, Loader2, Receipt, ShieldCheck, UploadCloud } from 'lucide-react'
import Card from '../components/Card'
import Loading from '../components/Loading'
import { billingAPI } from '../services/api'

function badgeClasses(status) {
  switch (status) {
    case 'active_subscription':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'active_trial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'pending_payment_verification':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

export default function Billing() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [preview, setPreview] = useState('')
  const [formData, setFormData] = useState({
    proof_image: null,
    transaction_id: '',
    amount: '',
    notes: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [statusRes, historyRes] = await Promise.all([
        billingAPI.getMyStatus(),
        billingAPI.getHistory(),
      ])
      setStatus(statusRes.data)
      setHistory(historyRes.data || [])
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const accessBadge = useMemo(() => {
    if (!status?.access_status) return 'Unknown'
    return status.access_status.replace(/_/g, ' ')
  }, [status])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setFormData((prev) => ({ ...prev, proof_image: file || null }))
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.proof_image) {
      alert('Please select a payment proof image.')
      return
    }

    const payload = new FormData()
    payload.append('proof_image', formData.proof_image)
    payload.append('transaction_id', formData.transaction_id)
    payload.append('amount', formData.amount)
    payload.append('notes', formData.notes)

    setSubmitting(true)
    try {
      await billingAPI.submitPaymentProof(payload)
      setFormData({ proof_image: null, transaction_id: '', amount: '', notes: '' })
      setPreview('')
      await loadData()
      alert('Payment proof submitted successfully. Waiting for admin verification.')
    } catch (error) {
      console.error('Failed to submit payment proof:', error)
      alert(error.response?.data?.detail || 'Failed to submit payment proof')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading fullScreen />

  const currency = status?.currency || 'ZMW'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Access</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your trial, subscription, and payment verification status.</p>
        </div>
        <div className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-sm font-medium ${badgeClasses(status?.access_status)}`}>
          <ShieldCheck className="h-4 w-4" />
          <span>{accessBadge}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><div className="space-y-2"><p className="text-sm text-gray-500 dark:text-gray-400">Days Remaining</p><p className="text-3xl font-bold text-gray-900 dark:text-white">{status?.days_remaining ?? 0}</p></div></Card>
        <Card><div className="space-y-2"><p className="text-sm text-gray-500 dark:text-gray-400">Trial Ends</p><p className="text-lg font-semibold text-gray-900 dark:text-white">{status?.trial_end_date ? new Date(status.trial_end_date).toLocaleDateString() : 'Not provided'}</p></div></Card>
        <Card><div className="space-y-2"><p className="text-sm text-gray-500 dark:text-gray-400">Subscription Ends</p><p className="text-lg font-semibold text-gray-900 dark:text-white">{status?.subscription_end_date ? new Date(status.subscription_end_date).toLocaleDateString() : 'No active subscription'}</p></div></Card>
        <Card><div className="space-y-2"><p className="text-sm text-gray-500 dark:text-gray-400">Expiry Date</p><p className="text-lg font-semibold text-gray-900 dark:text-white">{status?.expiry_date ? new Date(status.expiry_date).toLocaleDateString() : 'Not provided'}</p></div></Card>
      </div>

      {status?.access_status === 'expired' && (
        <Card className="border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Access expired</h3>
              <p className="text-sm text-red-800 dark:text-red-300">Submit payment proof below to request a 30-day subscription activation after admin approval.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UploadCloud className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submit Payment Proof</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Transaction ID *</label>
              <input className="input" required value={formData.transaction_id} onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })} />
            </div>
            <div>
              <label className="label">Amount *</label>
              <input className="input" type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment Screenshot *</label>
              <input className="input" type="file" accept="image/*" onChange={handleFileChange} required />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows="3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            {preview && (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-navy-700">
                <img src={preview} alt="Payment proof preview" className="h-56 w-full object-cover" />
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              <span>{submitting ? 'Submitting...' : `Submit Proof (${currency})`}</span>
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Submission History</h2>
          </div>
          <div className="space-y-3">
            {history.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-navy-700 dark:text-gray-400">
                No payment submissions yet.
              </div>
            )}
            {history.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-navy-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.transaction_id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses(item.status)}`}>{item.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <p><span className="font-medium">Amount:</span> {currency} {Number(item.amount).toLocaleString()}</p>
                  <p><span className="font-medium">Reviewed:</span> {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'Pending'}</p>
                </div>
                {item.admin_notes && <p className="mt-3 text-sm text-gray-700 dark:text-gray-200"><span className="font-medium">Admin notes:</span> {item.admin_notes}</p>}
                {item.proof_image_url && (
                  <a href={item.proof_image_url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-lg border border-gray-200 dark:border-navy-700">
                    <img src={item.proof_image_url} alt="Proof" className="h-40 w-full object-cover" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
