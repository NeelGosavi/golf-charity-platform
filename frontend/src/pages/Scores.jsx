import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scoreService } from '../services/scoreService';
import { format } from 'date-fns';

const Scores = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [formData, setFormData] = useState({
    score: '',
    score_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const data = await scoreService.getScores();
      setScores(data);
    } catch (error) {
      console.error('Error fetching scores:', error);
      setError('Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const scoreNum = parseInt(formData.score);
    if (scoreNum < 1 || scoreNum > 45) {
      setError('Score must be between 1 and 45');
      return;
    }

    try {
      if (editingScore) {
        await scoreService.updateScore(editingScore._id, formData);
      } else {
        await scoreService.addScore(formData);
      }
      
      setShowForm(false);
      setEditingScore(null);
      setFormData({ score: '', score_date: new Date().toISOString().split('T')[0] });
      fetchScores();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save score');
    }
  };

  const handleEdit = (score) => {
    setEditingScore(score);
    setFormData({
      score: score.score,
      score_date: new Date(score.score_date).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this score?')) {
      try {
        await scoreService.deleteScore(id);
        fetchScores();
      } catch (error) {
        setError('Failed to delete score');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate stats
  const totalScores = scores.length;
  const averageScore = totalScores > 0 
    ? (scores.reduce((sum, s) => sum + s.score, 0) / totalScores).toFixed(1)
    : 0;
  const bestScore = totalScores > 0 
    ? Math.max(...scores.map(s => s.score))
    : 0;
  const worstScore = totalScores > 0 
    ? Math.min(...scores.map(s => s.score))
    : 0;

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
                <Link to="/profile" className="text-gray-600 hover:text-green-600">Profile</Link>
                {/* ADMIN LINK */}
                {user?.is_admin && (
                    <Link to="/admin" className="text-purple-600 hover:text-purple-700 font-medium">
                    Admin
                    </Link>
                )}
                <Link to="/subscription" className="text-gray-600 hover:text-green-600">
                  Subscription
                </Link>
                <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
                    Logout
                </button>
                </div>
            </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Golf Scores</h1>
          <button
            onClick={() => {
              setEditingScore(null);
              setFormData({ score: '', score_date: new Date().toISOString().split('T')[0] });
              setShowForm(!showForm);
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            {showForm ? 'Cancel' : '+ Add Score'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Total Scores</p>
            <p className="text-2xl font-bold">{totalScores}/5</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Average Score</p>
            <p className="text-2xl font-bold">{averageScore}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Best Score</p>
            <p className="text-2xl font-bold text-green-600">{bestScore}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Worst Score</p>
            <p className="text-2xl font-bold text-red-600">{worstScore}</p>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4">
              {editingScore ? 'Edit Score' : 'Add New Score'}
            </h2>
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Score (1-45)
                </label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleInputChange}
                  min="1"
                  max="45"
                  required
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Stableford format score (1-45 points)
                </p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Score Date
                </label>
                <input
                  type="date"
                  name="score_date"
                  value={formData.score_date}
                  onChange={handleInputChange}
                  required
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                {editingScore ? 'Update Score' : 'Save Score'}
              </button>
            </form>
          </div>
        )}

        {/* Scores List */}
        {loading ? (
          <div className="text-center py-8">Loading scores...</div>
        ) : scores.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No scores yet</p>
            <p className="text-gray-400 mt-2">
              Click "Add Score" to start tracking your golf performance
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scores.map((score, index) => (
                  <tr key={score._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-semibold ${
                        score.score >= 40 ? 'text-green-600' :
                        score.score >= 30 ? 'text-blue-600' :
                        score.score >= 20 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {score.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(score.score_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(score)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(score._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            📊 <strong>Note:</strong> Only your last 5 scores are stored. Adding a new score will automatically remove the oldest one.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scores;