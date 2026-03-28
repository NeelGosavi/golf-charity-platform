import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const CharitiesManagement = () => {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCharity, setEditingCharity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    website: '',
    is_featured: false
  });

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const data = await adminService.getAllCharities();
      setCharities(data);
    } catch (error) {
      console.error('Error fetching charities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCharity) {
        await adminService.updateCharity(editingCharity._id, formData);
      } else {
        await adminService.createCharity(formData);
      }
      setShowForm(false);
      setEditingCharity(null);
      setFormData({ name: '', description: '', logo_url: '', website: '', is_featured: false });
      fetchCharities();
    } catch (error) {
      console.error('Error saving charity:', error);
      alert('Failed to save charity');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this charity?')) {
      try {
        await adminService.deleteCharity(id);
        fetchCharities();
      } catch (error) {
        alert('Failed to delete charity');
      }
    }
  };

  const handleEdit = (charity) => {
    setEditingCharity(charity);
    setFormData({
      name: charity.name,
      description: charity.description || '',
      logo_url: charity.logo_url || '',
      website: charity.website || '',
      is_featured: charity.is_featured
    });
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8">Loading charities...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Charity Management</h2>
        <button
          onClick={() => {
            setEditingCharity(null);
            setFormData({ name: '', description: '', logo_url: '', website: '', is_featured: false });
            setShowForm(!showForm);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showForm ? 'Cancel' : '+ Add Charity'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">{editingCharity ? 'Edit Charity' : 'Add New Charity'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Charity Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Logo URL</label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="mr-2"
              />
              <label className="text-gray-700">Featured Charity</label>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              {editingCharity ? 'Update' : 'Create'} Charity
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Featured</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {charities.map(charity => (
              <tr key={charity._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{charity.name}</td>
                <td className="px-6 py-4 text-gray-600 max-w-md truncate">{charity.description}</td>
                <td className="px-6 py-4 text-center">
                  {charity.is_featured ? '⭐' : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(charity)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(charity._id)}
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
    </div>
  );
};

export default CharitiesManagement;