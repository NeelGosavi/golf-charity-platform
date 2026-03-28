import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
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
                <Link 
                  to="/dashboard" 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center animate-fadeIn">
          <div className="mb-6">
            <span className="text-6xl inline-block animate-bounce">🏌️‍♂️</span>
            <span className="text-6xl mx-4">❤️</span>
            <span className="text-6xl inline-block animate-pulse">🎯</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Golf for a Cause
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your scores, support charities, and win amazing prizes every month!
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/register"
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition transform hover:scale-105 shadow-lg"
            >
              Start Your Journey
            </Link>
            <Link 
              to="/learn-more" 
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition duration-300">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Track Scores</h3>
            <p className="text-gray-600">Enter your Stableford scores (1-45) and track your progress</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition duration-300">
            <div className="text-4xl mb-4">🎁</div>
            <h3 className="text-xl font-bold mb-2">Win Prizes</h3>
            <p className="text-gray-600">Monthly draws with prizes up to 40% of the prize pool!</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition duration-300">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-2">Support Charities</h3>
            <p className="text-gray-600">10% of your subscription goes to your chosen charity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;