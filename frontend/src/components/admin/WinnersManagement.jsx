import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const WinnersManagement = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const data = await adminService.getAllWinners();
      setWinners(data);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (winnerId, status) => {
    try {
      let proofUrl = '';
      if (status === 'approved') {
        proofUrl = prompt('Enter proof URL (screenshot link):');
        if (!proofUrl) return;
      }
      await adminService.verifyWinner(winnerId, status, proofUrl);
      fetchWinners();
      alert(`Winner ${status} successfully!`);
    } catch (error) {
      alert('Failed to update winner status');
    }
  };

  const handleMarkPaid = async (winnerId) => {
    if (window.confirm('Mark this winner as paid?')) {
      try {
        await adminService.markPaid(winnerId);
        fetchWinners();
        alert('Winner marked as paid!');
      } catch (error) {
        alert('Failed to mark as paid');
      }
    }
  };

  const filteredWinners = winners.filter(winner => {
    if (filter === 'all') return true;
    return winner.verification_status === filter;
  });

  if (loading) return <div className="text-center py-8">Loading winners...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Winner Verification</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Draw Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredWinners.map(winner => (
              <tr key={winner._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{winner.full_name}</div>
                  <div className="text-sm text-gray-500">{winner.email}</div>
                </td>
                <td className="px-6 py-4">{new Date(winner.draw_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    winner.match_type === '5-match' ? 'bg-yellow-100 text-yellow-800' :
                    winner.match_type === '4-match' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {winner.match_type}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-green-600">${winner.prize_amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    winner.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                    winner.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {winner.verification_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {winner.verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleVerify(winner._id, 'approved')}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mr-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerify(winner._id, 'rejected')}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {winner.verification_status === 'approved' && !winner.paid_at && (
                    <button
                      onClick={() => handleMarkPaid(winner._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Mark Paid
                    </button>
                  )}
                  {winner.paid_at && (
                    <span className="text-green-600 text-sm">Paid on {new Date(winner.paid_at).toLocaleDateString()}</span>
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

export default WinnersManagement;