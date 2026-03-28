import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LearnMore = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-3xl">⛳</span>
              <span className="text-xl font-bold text-gray-800">Golf Charity Hub</span>
            </Link>
            <div className="space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-green-600 transition">
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition transform hover:scale-105"
                  >
                    Subscribe
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-green-600">Dashboard</Link>
                  <Link to="/subscription" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Upgrade Plan
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">How Golf Charity Hub Works</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A revolutionary platform combining your passion for golf with meaningful charitable impact
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Simple 4-Step Process</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600 mx-auto mb-4 shadow-lg">1</div>
              <h3 className="text-xl font-bold mb-2">Subscribe</h3>
              <p className="text-gray-600">Choose monthly or yearly plan that suits your needs</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600 mx-auto mb-4 shadow-lg">2</div>
              <h3 className="text-xl font-bold mb-2">Select a Charity</h3>
              <p className="text-gray-600">Choose from our partner charities to support</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600 mx-auto mb-4 shadow-lg">3</div>
              <h3 className="text-xl font-bold mb-2">Track Scores</h3>
              <p className="text-gray-600">Enter your last 5 Stableford scores</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600 mx-auto mb-4 shadow-lg">4</div>
              <h3 className="text-xl font-bold mb-2">Win & Give</h3>
              <p className="text-gray-600">Participate in monthly draws while supporting charity</p>
            </div>
          </div>
        </div>

        {/* Scoring System Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4">📊 Stableford Scoring System</h2>
          <p className="text-gray-600 mb-4">
            The Stableford scoring system rewards consistent play. Scores range from 1 to 45 points:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <span className="text-3xl block mb-2">🏆</span>
              <span className="font-bold text-green-600">40+ points</span>
              <p className="text-sm text-gray-600">Excellent round!</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <span className="text-3xl block mb-2">👍</span>
              <span className="font-bold text-blue-600">30-39 points</span>
              <p className="text-sm text-gray-600">Great performance</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <span className="text-3xl block mb-2">📈</span>
              <span className="font-bold text-yellow-600">20-29 points</span>
              <p className="text-sm text-gray-600">Room for improvement</p>
            </div>
          </div>
        </div>

        {/* Prize Draw Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white mb-16">
          <h2 className="text-2xl font-bold mb-4">🎁 Monthly Prize Draws</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-bold text-xl">5-Number Match</h3>
              <p className="text-2xl font-bold mt-2">40%</p>
              <p className="text-sm">of prize pool + Jackpot rollover</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">✨</div>
              <h3 className="font-bold text-xl">4-Number Match</h3>
              <p className="text-2xl font-bold mt-2">35%</p>
              <p className="text-sm">of prize pool</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">💫</div>
              <h3 className="font-bold text-xl">3-Number Match</h3>
              <p className="text-2xl font-bold mt-2">25%</p>
              <p className="text-sm">of prize pool</p>
            </div>
          </div>
          <p className="text-center mt-6 text-white/80">
            Prizes are split equally among multiple winners in the same tier
          </p>
        </div>

        {/* Charity Impact Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4">🤝 Your Impact Matters</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-4">
                When you subscribe, <strong className="text-green-600">minimum 10%</strong> of your subscription goes directly to your chosen charity. 
                You can increase this percentage anytime from your profile settings!
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Support causes you care about
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Track your charitable contributions
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Featured charities spotlighted monthly
                </li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <p className="text-lg font-semibold text-green-800 mb-2">Our Partner Charities</p>
              <ul className="space-y-2">
                <li>🏌️‍♂️ Golf For Good - Youth golf programs</li>
                <li>🌱 Green Earth Initiative - Environmental conservation</li>
                <li>❤️ Health Through Golf - Mental health awareness</li>
                <li>👩‍🦱 Women in Golf - Empowering women golfers</li>
                <li>👦 Junior Golf Academy - Young talent development</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-green-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
          <p className="text-green-100 mb-6">Join thousands of golfers who are playing for a cause</p>
          <Link
            to="/register"
            className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
          >
            Start Your Journey Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LearnMore;