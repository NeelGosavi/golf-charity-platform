const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Charity = require('../models/Charity');
const mongoose = require('mongoose');
const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password_hash')
            .populate('charity_id', 'name logo_url description');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { full_name } = req.body;
        
        if (!full_name) {
            return res.status(400).json({ error: 'Full name is required' });
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { full_name, updated_at: Date.now() },
            { returnDocument: 'after' } // Changed from { new: true }
        ).select('-password_hash');
        
        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user charity
router.put('/charity', authMiddleware, async (req, res) => {
    try {
        const { charity_id, charity_percentage } = req.body;
        
        if (charity_id === undefined || charity_percentage === undefined) {
            return res.status(400).json({ error: 'Charity ID and charity percentage are required' });
        }
        
        if (charity_percentage < 10 || charity_percentage > 100) {
            return res.status(400).json({ error: 'Charity percentage must be between 10 and 100' });
        }
        
        // Validate if charity_id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(charity_id)) {
            return res.status(400).json({ error: 'Invalid charity ID format' });
        }
        
        // Check if charity exists
        const charity = await Charity.findById(charity_id);
        if (!charity) {
            return res.status(404).json({ error: 'Charity not found' });
        }
        
        // Update user - Fix: Use returnDocument: 'after'
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { charity_id, charity_percentage, updated_at: Date.now() },
            { returnDocument: 'after' } // This replaces { new: true }
        );
        
        res.json({ 
            success: true,
            message: 'Charity updated successfully',
            charity_id: user.charity_id,
            charity_percentage: user.charity_percentage,
            charity_name: charity.name
        });
    } catch (error) {
        console.error('Update charity error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get user's selected charity
router.get('/charity', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('charity_id', 'name description logo_url website');
        
        if (!user.charity_id) {
            return res.json({ 
                charity_id: null, 
                charity_percentage: 10,
                message: 'No charity selected' 
            });
        }
        
        res.json({
            charity_id: user.charity_id._id,
            charity_percentage: user.charity_percentage,
            name: user.charity_id.name,
            description: user.charity_id.description,
            logo_url: user.charity_id.logo_url,
            website: user.charity_id.website
        });
    } catch (error) {
        console.error('Get user charity error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;