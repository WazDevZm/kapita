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
  MessageSquare
} from 'lucide-react'

export default function Landing() {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Dashboard',
      description: 'Monitor your business performance with live metrics and analytics'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, get low stock alerts, and manage products efficiently'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Maintain customer database with purchase history and credit tracking'
    },
    {
      icon: DollarSign,
      title: 'Sales Tracking',
      description: 'Record sales with multiple payment types and automatic profit calculations'
    },
    {
      icon: TrendingUp,
      title: 'Financial Analytics',
      description: 'Track expenses, calculate capital, and monitor cashflow in real-time'
    },
    {
      icon: LineChart,
      title: 'Business Projections',
      description: '30-day revenue and profit forecasts based on your business trends'
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant',
      description: 'Ask questions about your business and get instant insights powered by AI'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your business data is encrypted and protected with enterprise-grade security'
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Access your business data anywhere, anytime from any device'
    }
  ]

  const benefits = [
    'Track inventory and prevent stockouts',
    'Monitor sales and profits in real-time',
    'Manage customer credits and payments',
    'Control expenses and cashflow',
    'Calculate business capital automatically',
    'Generate financial reports instantly',
    'Get AI-powered business insights',
    'Make data-driven decisions'
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-navy-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Kapita</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Smart Business Tracking
              <span className="block text-primary-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              The complete business management solution for small businesses in Africa. 
              Track inventory, sales, customers, and finances all in one place.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-3 flex items-center space-x-2">
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Only K20/month • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-navy-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Powerful features designed for small businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-navy-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose Kapita?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Built specifically for small businesses in Zambia and Africa. 
                Simple, affordable, and powerful.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <div className="text-4xl font-bold mb-2">K20</div>
                  <div className="text-white/80">per month</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>Unlimited products</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>Unlimited sales tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>Customer management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>Financial reports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>AI business assistant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>Mobile app access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>24/7 support</span>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="block w-full bg-white text-primary-600 text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Start Your Free Trial
                </Link>
                <p className="text-sm text-white/80 text-center">
                  No credit card required • 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join hundreds of small businesses already using Kapita to grow their operations
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-xl font-bold">Kapita</span>
              </div>
              <p className="text-gray-400">
                Smart business tracking made simple for African entrepreneurs
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Kapita. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
