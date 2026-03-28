import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const adminService = {
    getStats: async () => {
        const response = await axios.get(`${API_URL}/admin/stats`);
        return response.data;
    },

    getAllUsers: async () => {
        const response = await axios.get(`${API_URL}/admin/users`);
        return response.data;
    },

    getAllCharities: async () => {
        const response = await axios.get(`${API_URL}/admin/charities`);
        return response.data;
    },

    createCharity: async (charityData) => {
        const response = await axios.post(`${API_URL}/admin/charities`, charityData);
        return response.data;
    },

    updateCharity: async (charityId, charityData) => {
        const response = await axios.put(`${API_URL}/admin/charities/${charityId}`, charityData);
        return response.data;
    },

    deleteCharity: async (charityId) => {
        const response = await axios.delete(`${API_URL}/admin/charities/${charityId}`);
        return response.data;
    },

    getAllDraws: async () => {
        const response = await axios.get(`${API_URL}/admin/draws`);
        return response.data;
    },

    createDraw: async (drawData) => {
        const response = await axios.post(`${API_URL}/admin/draws`, drawData);
        return response.data;
    },

    runDraw: async (drawId) => {
        const response = await axios.post(`${API_URL}/admin/draws/${drawId}/run`);
        return response.data;
    },

    publishDraw: async (drawId) => {
        const response = await axios.post(`${API_URL}/admin/draws/${drawId}/publish`);
        return response.data;
    },

    getAllWinners: async () => {
        const response = await axios.get(`${API_URL}/admin/winners`);
        return response.data;
    },

    verifyWinner: async (winnerId, status, proofUrl) => {
        const response = await axios.put(`${API_URL}/admin/winners/${winnerId}`, {
            verification_status: status,
            proof_url: proofUrl
        });
        return response.data;
    },

    markPaid: async (winnerId) => {
        const response = await axios.post(`${API_URL}/admin/winners/${winnerId}/pay`);
        return response.data;
    }
};