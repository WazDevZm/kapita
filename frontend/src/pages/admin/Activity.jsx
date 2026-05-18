import { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'
import { formatStatus } from './utils'

export default function AdminActivity() {
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState([])

  useEffect(() => {
    billingAPI.getActivityLogs()
      .then((res) => setActivity(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Audit trail for trials, payments, and subscription changes.</p>
      </div>

      <Card>
        <div className="space-y-3">
          {activity.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
          )}
          {activity.map((log) => (
            <div key={log.id} className="rounded-xl border border-gray-200 p-4 dark:border-navy-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900 dark:text-white">{formatStatus(log.action)}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Actor: <span className="font-medium">{log.actor_username || 'system'}</span>
                {' · '}
                Target: <span className="font-medium">{log.target_username || 'N/A'}</span>
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-2 text-xs text-gray-700 dark:bg-navy-900 dark:text-gray-300">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
