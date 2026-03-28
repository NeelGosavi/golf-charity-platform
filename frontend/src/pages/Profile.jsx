import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    charity_id: '',
    charity_percentage: 10
  });
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/profile`);
      setProfile({
        full_name: profileRes.data.full_name || '',
        email: profileRes.data.email,
        charity_id: profileRes.data.charity_id || '',
        charity_percentage: profileRes.data.charity_percentage || 10
      });
      
      // Fetch subscription
      const subRes = await axios.get(`${import.meta.env.VITE_API_URL}/subscriptions`);
      setSubscription(subRes.data);
      
      // Fetch charities
      const charitiesRes = await axios.get(`${import.meta.env.VITE_API_URL}/charities`);
      setCharities(charitiesRes.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/users/profile`, {
        full_name: profile.full_name
      });
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCharityUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    if (!profile.charity_id) {
      setError('Please select a charity');
      setSaving(false);
      return;
    }
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/users/charity`, {
        charity_id: profile.charity_id,
        charity_percentage: profile.charity_percentage
      });
      setSuccess('Charity preference updated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update charity');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get subscription status display
  const getSubscriptionStatus = () => {
    if (!subscription) {
      return {
        text: 'No Active Subscription',
        class: 'bg-gray-100 text-gray-800',
        message: 'Subscribe to start enjoying benefits!'
      };
    }
    
    switch(subscription.status) {
      case 'active':
        return {
          text: 'Active',
          class: 'bg-green-100 text-green-800',
          message: `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
        };
      case 'canceled':
        return {
          text: 'Canceled',
          class: 'bg-red-100 text-red-800',
          message: 'Subscription has been canceled'
        };
      case 'past_due':
        return {
          text: 'Past Due',
          class: 'bg-yellow-100 text-yellow-800',
          message: 'Payment failed. Please update payment method.'
        };
      default:
        return {
          text: subscription.status || 'Pending',
          class: 'bg-yellow-100 text-yellow-800',
          message: 'Processing your subscription'
        };
    }
  };

  const status = getSubscriptionStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-3xl">⛳</span>
              <span className="text-xl font-bold text-gray-800">Golf Charity Hub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.full_name}</span>
              <Link to="/dashboard" className="text-gray-600 hover:text-green-600">Dashboard</Link>
              <Link to="/scores" className="text-gray-600 hover:text-green-600">Scores</Link>
              <Link to="/subscription" className="text-gray-600 hover:text-green-600">Subscription</Link>
              {user?.is_admin && (
                <Link to="/admin" className="text-purple-600 hover:text-purple-700">Admin</Link>
              )}
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

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>

          {/* Charity Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Charity Preferences</h2>
            <form onSubmit={handleCharityUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Support Charity
                </label>
                <select
                  value={profile.charity_id}
                  onChange={(e) => setProfile({ ...profile, charity_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a charity</option>
                  {charities.map(charity => (
                    <option key={charity._id} value={charity._id}>
                      {charity.name} {charity.is_featured ? '⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Charity Contribution (%)
                </label>
                <input
                  type="number"
                  value={profile.charity_percentage}
                  onChange={(e) => setProfile({ ...profile, charity_percentage: parseInt(e.target.value) })}
                  min="10"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 10% of your subscription goes to charity
                </p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Charity'}
              </button>
            </form>
          </div>
        </div>

        {/* Account Information - Updated */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Account Type</p>
              <p className="font-semibold">{user?.is_admin ? 'Administrator' : 'Standard User'}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Member Since</p>
              <p className="font-semibold">{new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Subscription Status</p>
              <div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                  {status.text}
                </span>
                <p className="text-sm text-gray-500 mt-1">{status.message}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Charity Contribution</p>
              <p className="font-semibold">{profile.charity_percentage}% of subscription</p>
            </div>
            {subscription?.plan_type && (
              <>
                <div>
                  <p className="text-gray-600 text-sm">Current Plan</p>
                  <p className="font-semibold capitalize">{subscription.plan_type} Plan</p>
                </div>
                {subscription.current_period_end && (
                  <div>
                    <p className="text-gray-600 text-sm">Next Billing Date</p>
                    <p className="font-semibold">{new Date(subscription.current_period_end).toLocaleDateString()}</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {!subscription && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                💡 You don't have an active subscription. 
                <Link to="/subscription" className="ml-2 text-green-600 font-semibold hover:underline">
                  Subscribe now
                </Link>
                to start enjoying benefits!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;