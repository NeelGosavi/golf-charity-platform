const express = require('express');
const Charity = require('../models/Charity');
const router = express.Router();

// Get all charities
router.get('/', async (req, res) => {
    try {
        const charities = await Charity.find().sort({ is_featured: -1, name: 1 });
        res.json(charities);
    } catch (error) {
        console.error('Get charities error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get featured charities
router.get('/featured', async (req, res) => {
    try {
        const charities = await Charity.find({ is_featured: true }).sort({ name: 1 });
        res.json(charities);
    } catch (error) {
        console.error('Get featured charities error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single charity
router.get('/:id', async (req, res) => {
    try {
        const charity = await Charity.findById(req.params.id);
        if (!charity) {
            return res.status(404).json({ error: 'Charity not found' });
        }
        res.json(charity);
    } catch (error) {
        console.error('Get charity error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;