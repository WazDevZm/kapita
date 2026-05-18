export function badgeClass(status) {
  switch (status) {
    case 'active_subscription':
    case 'approved':
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'active_trial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'pending_payment_verification':
    case 'pending':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'expired':
    case 'rejected':
    case 'revoked':
    case 'inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

export function formatStatus(status) {
  return status ? status.replace(/_/g, ' ') : 'unknown'
}

export const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Active trial', value: 'active_trial' },
  { label: 'Active subscription', value: 'active_subscription' },
  { label: 'Expired', value: 'expired' },
  { label: 'Pending payment', value: 'pending_payment_verification' },
]
