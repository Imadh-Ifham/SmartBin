import { Link } from 'react-router-dom'
import { Calendar, Recycle, TrendingUp, MapPin, Users, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-6xl font-bold text-slate-900 leading-tight mb-4">
                  SmartBin
                </h1>
                <p className="text-2xl text-slate-700 font-semibold">Your Eco-Friendly Hub</p>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">
                Manage waste collection efficiently with our smart, eco-friendly platform. Track collections, 
                optimize routes, and reduce environmental impact in real-time.
              </p>
              <div className="flex gap-4 pt-4">
                <Link
                  to="/scan"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Schedule Collection
                </Link>
                <Link
                  to="/reports"
                  className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  View Stats
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-600">Next Collection</p>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">Tomorrow</p>
                <p className="text-slate-600 text-sm mt-2">8:00 AM - 10:00 AM</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-600">Recycling Rate</p>
                  <Recycle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">87%</p>
                <p className="text-slate-600 text-sm mt-2">This month</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-600">Collections Done</p>
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">243</p>
                <p className="text-slate-600 text-sm mt-2">This year</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-600">Active Users</p>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">1.2K</p>
                <p className="text-slate-600 text-sm mt-2">Community</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">Why Choose SmartBin?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <MapPin className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Tracking</h3>
              <p className="text-slate-600">
                Track waste collections in real-time with GPS monitoring and instant notifications. Know exactly when your collection will arrive.
              </p>
            </div>

            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <TrendingUp className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Optimize Impact</h3>
              <p className="text-slate-600">
                Reduce carbon footprint with optimized collection routes. See your environmental impact measured and tracked.
              </p>
            </div>

            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <Zap className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Scheduling</h3>
              <p className="text-slate-600">
                AI-powered scheduling ensures efficient collections. Schedule pickups anytime, anywhere with our mobile app.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8 text-white">
            <div className="text-center">
              <p className="text-5xl font-bold mb-2">1.2K+</p>
              <p className="text-blue-100">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold mb-2">87%</p>
              <p className="text-blue-100">Recycling Rate</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold mb-2">243</p>
              <p className="text-blue-100">Collections</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold mb-2">56</p>
              <p className="text-blue-100">Active Policies</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of users managing waste efficiently with SmartBin. Start your journey today.
          </p>
          <Link
            to="/admin/policies"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Explore Policies
          </Link>
        </div>
      </div>
    </div>
  )
}