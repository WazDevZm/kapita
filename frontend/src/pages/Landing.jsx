import { Link } from 'react-router-dom'
import {
  BarChart3,
  Package,
  Users,
  TrendingUp,
  Shield,
  Smartphone,
  Check,
  ArrowRight,
  DollarSign,
  LineChart,
  MessageSquare,
} from 'lucide-react'

export default function Landing() {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Dashboard',
      description: 'Monitor your business performance with live metrics and analytics',
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, get low stock alerts, and manage products efficiently',
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Maintain customer database with purchase history and credit tracking',
    },
    {
      icon: DollarSign,
      title: 'Sales Tracking',
      description: 'Record sales with multiple payment types and automatic profit calculations',
    },
    {
      icon: TrendingUp,
      title: 'Financial Analytics',
      description: 'Track expenses, calculate capital, and monitor cashflow in real-time',
    },
    {
      icon: LineChart,
      title: 'Business Projections',
      description: '30-day revenue and profit forecasts based on your business trends',
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant',
      description: 'Ask questions about your business and get instant insights powered by AI',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your business data is encrypted and protected with enterprise-grade security',
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Access your business data anywhere, anytime from any device',
    },
  ]

  const benefits = [
    'Track inventory and prevent stockouts',
    'Monitor sales and profits in real-time',
    'Manage customer credits and payments',
    'Control expenses and cashflow',
    'Calculate business capital automatically',
    'Generate financial reports instantly',
    'Get AI-powered business insights',
    'Make data-driven decisions',
  ]

  const heroStats = [
    { label: 'Live sales', value: '24/7' },
    { label: 'Inventory alerts', value: 'Auto' },
    { label: 'Business insights', value: 'AI' },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900">

      <div className="relative">
        <nav className="sticky top-4 z-50 mx-auto mt-4 w-[calc(100%-1.5rem)] max-w-7xl rounded-full border border-slate-200 bg-white/80 px-4 shadow-lg shadow-slate-200/60 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src="/logo1.png"
                alt="Kapita Logo"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
              <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-primary-500">
                <span className="text-lg font-bold text-white">K</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                Sign In
              </Link>
              <Link to="/register" className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-700">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        <section className="relative px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Built for small businesses across Africa
              </div>
              <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
                Smart Business Tracking
                <span className="block text-primary-600">Made Simple</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                The complete business management solution for small businesses in Africa.
                Track inventory, sales, customers, and finances all in one place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/register" className="btn btn-primary text-lg px-8 py-3 flex items-center space-x-2">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                  Sign In
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {heroStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{item.value}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Only K20/month • No credit card required • Cancel anytime
              </p>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-xl">
                <div className="flex h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-white">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600 shadow-sm">
                      <BarChart3 className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Business dashboard preview</h3>
                    <p className="mt-3 text-slate-600">
                      Clean, modern interface for sales, customers, and inventory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-slate-900">
                Everything You Need to Run Your Business
              </h2>
              <p className="text-xl text-slate-600">
                Powerful features designed for small businesses
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-slate-900">
                Why Choose Kapita?
              </h2>
              <p className="mb-8 text-lg text-slate-600">
                Built specifically for small businesses in Zambia and Africa.
                Simple, affordable, and powerful.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-primary-500 to-primary-700 p-8 text-white shadow-2xl">
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                  <div className="mb-2 text-4xl font-bold">K20</div>
                  <div className="text-white/80">per month</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5" />
                    <span>Unlimited products</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5" />
                    <span>Unlimited sales tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5" />
                    <span>Customer management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5" />
                    <span>Financial reports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5" />
                    <span>AI business assistant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5" />
                    <span>Mobile app access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5" />
                    <span>24/7 support</span>
                  </div>
                </div>
                <Link to="/register" className="block w-full rounded-2xl bg-white py-3 text-center font-semibold text-primary-600 transition-colors hover:bg-gray-100">
                  Start Your Free Trial
                </Link>
                <p className="text-center text-sm text-white/80">
                  No credit card required • 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-4xl font-bold text-slate-900">
              Ready to Transform Your Business?
            </h2>
            <p className="mb-8 text-xl text-slate-600">
              Join hundreds of small businesses already using Kapita to grow their operations
            </p>
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary-600 transition-colors hover:bg-gray-100"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <div className="mb-4 flex items-center">
                  <img
                    src="/logo1.png"
                    alt="Kapita Logo"
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextElementSibling.style.display = 'flex'
                    }}
                  />
                  <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-primary-500">
                    <span className="text-xl font-bold text-white">K</span>
                  </div>
                </div>
                <p className="text-slate-600">
                  Smart business tracking made simple for African entrepreneurs
                </p>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">Product</h3>
                <ul className="space-y-2 text-slate-600">
                  <li><a href="#" className="hover:text-white">Features</a></li>
                  <li><a href="#" className="hover:text-white">Pricing</a></li>
                  <li><a href="#" className="hover:text-white">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">Company</h3>
                <ul className="space-y-2 text-slate-600">
                  <li><a href="#" className="hover:text-white">About</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                  <li><a href="#" className="hover:text-white">Support</a></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">Legal</h3>
                <ul className="space-y-2 text-slate-600">
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                  <li><a href="#" className="hover:text-white">Terms</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-8 text-center text-slate-500">
              <p>&copy; 2024 Kapita. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
