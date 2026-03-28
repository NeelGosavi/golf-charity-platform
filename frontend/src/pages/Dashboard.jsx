import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalScores: 0,
    averageScore: 0,
    bestScore: 0,
    charityName: 'Not selected',
    charityPercentage: 10,
    recentScores: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch scores
      const scoresRes = await axios.get(`${import.meta.env.VITE_API_URL}/scores`);
      const scores = scoresRes.data;
      
      const totalScores = scores.length;
      const averageScore = totalScores > 0 
        ? (scores.reduce((sum, s) => sum + s.score, 0) / totalScores).toFixed(1)
        : 0;
      const bestScore = totalScores > 0 
        ? Math.max(...scores.map(s => s.score))
        : 0;
      const recentScores = scores.slice(0, 3);
      
      // Fetch charity info
      const charityRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/charity`);
      const charityName = charityRes.data.name || 'Not selected';
      const charityPercentage = charityRes.data.charity_percentage || 10;
      
      setStats({
        totalScores,
        averageScore,
        bestScore,
        charityName,
        charityPercentage,
        recentScores
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-3xl">⛳</span>
              <span className="text-xl font-bold text-gray-800">Golf Charity Hub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.full_name}</span>
              <Link to="/scores" className="text-gray-600 hover:text-green-600">Scores</Link>
              <Link to="/profile" className="text-gray-600 hover:text-green-600">Profile</Link>
              {/* ADMIN LINK - ADDED HERE */}
              {user?.is_admin && (
                <Link to="/admin" className="text-purple-600 hover:text-purple-700 font-medium">
                  Admin
                </Link>
              )}
              <Link to="/subscription" className="text-gray-600 hover:text-green-600">
                Subscription
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}! 👋</h1>
          <p className="text-green-100">Keep tracking your scores and making a difference</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 transform hover:scale-105 transition">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-gray-600 text-sm">Total Scores</h3>
            <p className="text-3xl font-bold">{stats.totalScores}/5</p>
            <p className="text-xs text-gray-500 mt-1">Last 5 scores tracked</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 transform hover:scale-105 transition">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="text-gray-600 text-sm">Average Score</h3>
            <p className="text-3xl font-bold">{stats.averageScore}</p>
            <p className="text-xs text-gray-500 mt-1">Stableford points</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 transform hover:scale-105 transition">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-gray-600 text-sm">Best Score</h3>
            <p className="text-3xl font-bold text-green-600">{stats.bestScore}</p>
            <p className="text-xs text-gray-500 mt-1">Personal best</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 transform hover:scale-105 transition">
            <div className="text-3xl mb-2">💚</div>
            <h3 className="text-gray-600 text-sm">Supporting</h3>
            <p className="text-lg font-semibold truncate">{stats.charityName}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.charityPercentage}% contribution</p>
          </div>
        </div>

        {/* Recent Scores */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Scores</h2>
            <Link to="/scores" className="text-green-600 hover:text-green-700">
              View All →
            </Link>
          </div>
          {stats.recentScores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No scores yet</p>
              <Link to="/scores" className="text-green-600 mt-2 inline-block">
                Add your first score
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentScores.map((score, index) => (
                <div key={score._id} className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500">#{index + 1}</span>
                    <span className={`text-xl font-bold ${
                      score.score >= 40 ? 'text-green-600' :
                      score.score >= 30 ? 'text-blue-600' :
                      score.score >= 20 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {score.score}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    {new Date(score.score_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            to="/scores" 
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition transform hover:scale-105"
          >
            <div className="text-4xl mb-2">⛳</div>
            <h3 className="text-xl font-bold mb-2">Add Your Scores</h3>
            <p className="text-green-100">Track your last 5 Stableford scores</p>
            <div className="mt-3 text-sm font-semibold">+ Add New Score →</div>
          </Link>
          <Link 
            to="/profile" 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition transform hover:scale-105"
          >
            <div className="text-4xl mb-2">🤝</div>
            <h3 className="text-xl font-bold mb-2">Support a Charity</h3>
            <p className="text-blue-100">Choose a charity to support with your subscription</p>
            <div className="mt-3 text-sm font-semibold">Update Charity →</div>
          </Link>
        </div>

        {/* Upcoming Draw Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-semibold text-yellow-800">Monthly Draw Coming Soon!</p>
              <p className="text-sm text-yellow-700">Stay tuned for the next prize draw. Keep tracking your scores to be eligible!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;