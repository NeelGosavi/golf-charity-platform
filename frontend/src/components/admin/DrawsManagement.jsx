import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const DrawsManagement = () => {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    draw_date: new Date().toISOString().split('T')[0],
    draw_type: 'random'
  });

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const data = await adminService.getAllDraws();
      setDraws(data);
    } catch (error) {
      console.error('Error fetching draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraw = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDraw(formData);
      setShowForm(false);
      setFormData({ draw_date: new Date().toISOString().split('T')[0], draw_type: 'random' });
      fetchDraws();
      alert('Draw created successfully!');
    } catch (error) {
      console.error('Error creating draw:', error);
      alert('Failed to create draw');
    }
  };

  const handleRunDraw = async (drawId) => {
    if (window.confirm('Run this draw? This will generate winners.')) {
      try {
        await adminService.runDraw(drawId);
        fetchDraws();
        alert('Draw completed successfully!');
      } catch (error) {
        alert('Failed to run draw');
      }
    }
  };

  const handlePublishDraw = async (drawId) => {
    if (window.confirm('Publish this draw? Winners will be notified.')) {
      try {
        await adminService.publishDraw(drawId);
        fetchDraws();
        alert('Draw published successfully!');
      } catch (error) {
        alert('Failed to publish draw');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading draws...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Draw Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showForm ? 'Cancel' : '+ Create Draw'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Create New Draw</h3>
          <form onSubmit={handleCreateDraw} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Draw Date</label>
              <input
                type="date"
                value={formData.draw_date}
                onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                required
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Draw Type</label>
              <select
                value={formData.draw_type}
                onChange={(e) => setFormData({ ...formData, draw_type: e.target.value })}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="random">Random (Lottery Style)</option>
                <option value="algorithmic">Algorithmic (Weighted by Scores)</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Create Draw
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Draw Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winners</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {draws.map(draw => (
              <tr key={draw._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{new Date(draw.draw_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 capitalize">{draw.draw_type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    draw.status === 'published' ? 'bg-green-100 text-green-800' :
                    draw.status === 'simulated' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {draw.status}
                  </span>
                </td>
                <td className="px-6 py-4">{draw.winners_count || 0}</td>
                <td className="px-6 py-4 text-right">
                  {draw.status === 'pending' && (
                    <button
                      onClick={() => handleRunDraw(draw._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2"
                    >
                      Run Draw
                    </button>
                  )}
                  {draw.status === 'simulated' && (
                    <button
                      onClick={() => handlePublishDraw(draw._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DrawsManagement;