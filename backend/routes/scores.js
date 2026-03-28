const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const GolfScore = require('../models/GolfScore');
const router = express.Router();

// Get user's scores (last 5)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const scores = await GolfScore.find({ user_id: req.user._id })
            .sort({ score_date: -1 })
            .limit(5);
        
        res.json(scores);
    } catch (error) {
        console.error('Get scores error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new score
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { score, score_date } = req.body;
        
        if (!score || score < 1 || score > 45) {
            return res.status(400).json({ error: 'Score must be between 1 and 45' });
        }
        
        if (!score_date) {
            return res.status(400).json({ error: 'Score date is required' });
        }
        
        // Check current score count
        const scoreCount = await GolfScore.countDocuments({ user_id: req.user._id });
        
        // If user has 5 scores, delete the oldest
        if (scoreCount >= 5) {
            const oldestScore = await GolfScore.findOne({ user_id: req.user._id })
                .sort({ score_date: 1 });
            
            if (oldestScore) {
                await oldestScore.deleteOne();
            }
        }
        
        // Create new score
        const newScore = await GolfScore.create({
            user_id: req.user._id,
            score,
            score_date: new Date(score_date)
        });
        
        res.status(201).json({
            success: true,
            message: 'Score added successfully',
            score: newScore
        });
    } catch (error) {
        console.error('Add score error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update score
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { score, score_date } = req.body;
        
        if (score < 1 || score > 45) {
            return res.status(400).json({ error: 'Score must be between 1 and 45' });
        }
        
        // Fix: Use returnDocument: 'after'
        const updatedScore = await GolfScore.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            { score, score_date: new Date(score_date) },
            { returnDocument: 'after' } // This replaces { new: true }
        );
        
        if (!updatedScore) {
            return res.status(404).json({ error: 'Score not found' });
        }
        
        res.json({
            success: true,
            message: 'Score updated successfully',
            score: updatedScore
        });
    } catch (error) {
        console.error('Update score error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete score
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await GolfScore.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user._id
        });
        
        if (!result) {
            return res.status(404).json({ error: 'Score not found' });
        }
        
        res.json({ 
            success: true,
            message: 'Score deleted successfully' 
        });
    } catch (error) {
        console.error('Delete score error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;