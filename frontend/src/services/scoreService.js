import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const scoreService = {
    // Get all scores
    getScores: async () => {
        const response = await axios.get(`${API_URL}/scores`);
        return response.data;
    },

    // Add new score
    addScore: async (scoreData) => {
        const response = await axios.post(`${API_URL}/scores`, scoreData);
        return response.data;
    },

    // Update score
    updateScore: async (id, scoreData) => {
        const response = await axios.put(`${API_URL}/scores/${id}`, scoreData);
        return response.data;
    },

    // Delete score
    deleteScore: async (id) => {
        const response = await axios.delete(`${API_URL}/scores/${id}`);
        return response.data;
    }
};