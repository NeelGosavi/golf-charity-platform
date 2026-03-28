import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import UsersManagement from '../components/admin/UsersManagement';
import CharitiesManagement from '../components/admin/CharitiesManagement';
import DrawsManagement from '../components/admin/DrawsManagement';
import WinnersManagement from '../components/admin/WinnersManagement';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_users: 0,
    active_subscriptions: 0,
    total_prize_pool: 0,
    total_charity_contributions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user?.is_admin) {
    return null;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'charities', name: 'Charities', icon: '💚' },
    { id: 'draws', name: 'Draws', icon: '🎲' },
    { id: 'winners', name: 'Winners', icon: '🏆' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-3xl">⛳</span>
              <span className="text-xl font-bold">Admin Dashboard</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.full_name}</span>
              <Link to="/dashboard" className="text-gray-300 hover:text-white">User Dashboard</Link>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-gray-600 text-sm">Total Users</h3>
                <p className="text-3xl font-bold">{stats.total_users}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl mb-2">💳</div>
                <h3 className="text-gray-600 text-sm">Active Subscriptions</h3>
                <p className="text-3xl font-bold">{stats.active_subscriptions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-gray-600 text-sm">Total Prize Pool</h3>
                <p className="text-3xl font-bold">${stats.total_prize_pool}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl mb-2">🤝</div>
                <h3 className="text-gray-600 text-sm">Charity Contributions</h3>
                <p className="text-3xl font-bold">${stats.total_charity_contributions}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveTab('draws')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-2">🎲</div>
                <h3 className="text-xl font-bold mb-2">Run Monthly Draw</h3>
                <p className="text-purple-100">Execute the monthly prize draw</p>
              </button>
              <button
                onClick={() => setActiveTab('winners')}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-xl font-bold mb-2">Verify Winners</h3>
                <p className="text-yellow-100">Review and approve winners</p>
              </button>
              <button
                onClick={() => setActiveTab('charities')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-2">💚</div>
                <h3 className="text-xl font-bold mb-2">Manage Charities</h3>
                <p className="text-green-100">Add or update charities</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'charities' && <CharitiesManagement />}
        {activeTab === 'draws' && <DrawsManagement />}
        {activeTab === 'winners' && <WinnersManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;