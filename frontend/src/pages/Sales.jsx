import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { salesAPI, productsAPI, customersAPI } from '../services/api'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    product: '',
    customer: '',
    quantity: '',
    unit_price: '',
    payment_type: 'cash',
    deposit_amount: '0',
    due_date: '',
    notes: '',
  })

  const buildSalePayload = () => ({
    product: Number(formData.product),
    customer: formData.customer ? Number(formData.customer) : null,
    quantity: Number(formData.quantity),
    unit_price: Number(formData.unit_price),
    payment_type: formData.payment_type,
    deposit_amount: formData.payment_type === 'credit' ? Number(formData.deposit_amount || 0) : 0,
    due_date: formData.payment_type === 'credit' && formData.due_date ? formData.due_date : null,
    notes: formData.notes?.trim() || '',
  })

  const getErrorMessage = (error) => {
    const data = error.response?.data

    if (!data) return 'Failed to create sale'
    if (typeof data.detail === 'string') return data.detail

    const fieldMessages = Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(', ')}`
        }

        if (typeof value === 'string') {
          return `${key}: ${value}`
        }

        return null
      })
      .filter(Boolean)

    return fieldMessages.length > 0 ? fieldMessages.join(' | ') : 'Failed to create sale'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [salesRes, productsRes, customersRes] = await Promise.all([
        salesAPI.getAll(),
        productsAPI.getAll(),
        customersAPI.getAll(),
      ])
      setSales(salesRes.data.results || salesRes.data)
      setProducts(productsRes.data.results || productsRes.data)
      setCustomers(customersRes.data.results || customersRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await salesAPI.create(buildSalePayload())
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to create sale:', error)
      alert(getErrorMessage(error))
    }
  }

  const resetForm = () => {
    setFormData({
      product: '',
      customer: '',
      quantity: '',
      unit_price: '',
      payment_type: 'cash',
      deposit_amount: '0',
      due_date: '',
      notes: '',
    })
  }

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    setFormData({
      ...formData,
      product: productId,
      unit_price: product ? product.selling_price : '',
    })
  }

  const columns = [
    { 
      header: 'Date', 
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    { 
      header: 'Product', 
      render: (row) => row.product_details?.name || 'N/A'
    },
    { 
      header: 'Customer', 
      render: (row) => row.customer_details?.name || 'Walk-in'
    },
    { header: 'Quantity', accessor: 'quantity' },
    { 
      header: 'Total Amount', 
      render: (row) => `ZMW ${parseFloat(row.total_amount).toLocaleString()}`
    },
    { 
      header: 'Profit', 
      render: (row) => `ZMW ${parseFloat(row.profit).toLocaleString()}`
    },
    { 
      header: 'Payment', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.payment_type === 'cash' ? 'bg-green-100 text-green-800' :
          row.payment_type === 'mobile_money' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.payment_type.replace('_', ' ')}
        </span>
      )
    },
  ]

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-gray-600 dark:text-gray-400">Track all your sales transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Sale</span>
        </button>
      </div>

      {/* Sales Table */}
      <Card>
        <Table columns={columns} data={sales} />
      </Card>

      {/* Add Sale Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title="Record New Sale"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Product *</label>
              <select
                required
                className="input"
                value={formData.product}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Customer</label>
              <select
                className="input"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              >
                <option value="">Walk-in customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                className="input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Unit Price *</label>
              <input
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Payment Type *</label>
              <select
                required
                className="input"
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {formData.payment_type === 'credit' && (
              <>
                <div>
                  <label className="label">Deposit Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Due Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {formData.quantity && formData.unit_price && (
            <div className="p-4 bg-gray-50 dark:bg-navy-700 rounded-lg">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Total: ZMW {(formData.quantity * formData.unit_price).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Sale
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
