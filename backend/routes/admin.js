const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const GolfScore = require('../models/GolfScore');
const router = express.Router();

// Get admin dashboard stats
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments();
        
        // Get active subscriptions - FIX THIS
        const activeSubscriptions = await Subscription.countDocuments({ 
            status: 'active' 
        });
        
        // Get total prize pool from draws (if any)
        const prizePoolResult = await Draw.aggregate([
            { $group: { _id: null, total: { $sum: "$prize_pool" } } }
        ]);
        const totalPrizePool = prizePoolResult[0]?.total || 0;
        
        // Get total charity contributions
        const charityResult = await User.aggregate([
            { $group: { _id: null, total: { $sum: "$charity_percentage" } } }
        ]);
        const totalCharityContributions = charityResult[0]?.total || 0;
        
        console.log('Stats calculated:', {
            totalUsers,
            activeSubscriptions,
            totalPrizePool,
            totalCharityContributions
        });
        
        res.json({
            total_users: totalUsers,
            active_subscriptions: activeSubscriptions,
            total_prize_pool: totalPrizePool,
            total_charity_contributions: totalCharityContributions
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password_hash')
            .sort({ created_at: -1 });
        
        // Add subscription status placeholder
        const usersWithStatus = users.map(user => ({
            ...user.toObject(),
            subscription_status: 'inactive' // Will be updated with Stripe integration
        }));
        
        res.json(usersWithStatus);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all charities
router.get('/charities', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const charities = await Charity.find().sort({ created_at: -1 });
        res.json(charities);
    } catch (error) {
        console.error('Error fetching charities:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create charity
router.post('/charities', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, description, logo_url, website, is_featured } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Charity name is required' });
        }
        
        const charity = await Charity.create({
            name,
            description: description || '',
            logo_url: logo_url || '',
            website: website || '',
            is_featured: is_featured || false
        });
        
        res.status(201).json(charity);
    } catch (error) {
        console.error('Error creating charity:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update charity
// Update charity
router.put('/charities/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, logo_url, website, is_featured } = req.body;
        
        const charity = await Charity.findByIdAndUpdate(
            id,
            { name, description, logo_url, website, is_featured },
            { returnDocument: 'after', runValidators: true } // Changed from { new: true }
        );
        
        if (!charity) {
            return res.status(404).json({ error: 'Charity not found' });
        }
        
        res.json(charity);
    } catch (error) {
        console.error('Error updating charity:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete charity
router.delete('/charities/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if charity is being used by any user
        const usersWithCharity = await User.findOne({ charity_id: id });
        if (usersWithCharity) {
            return res.status(400).json({ error: 'Cannot delete charity that is being used by users' });
        }
        
        const charity = await Charity.findByIdAndDelete(id);
        
        if (!charity) {
            return res.status(404).json({ error: 'Charity not found' });
        }
        
        res.json({ message: 'Charity deleted successfully' });
    } catch (error) {
        console.error('Error deleting charity:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all draws
router.get('/draws', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const draws = await Draw.find().sort({ draw_date: -1 });
        
        // Get winner counts for each draw
        const drawsWithCounts = await Promise.all(draws.map(async (draw) => {
            const winnerCount = await Winner.countDocuments({ draw_id: draw._id });
            return {
                ...draw.toObject(),
                winners_count: winnerCount
            };
        }));
        
        res.json(drawsWithCounts);
    } catch (error) {
        console.error('Error fetching draws:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create draw
// Create draw
router.post('/draws', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { draw_date, draw_type } = req.body;
        
        if (!draw_date || !draw_type) {
            return res.status(400).json({ error: 'Draw date and type are required' });
        }
        
        const draw = await Draw.create({
            draw_date: new Date(draw_date),
            draw_type,
            status: 'pending',
            winning_numbers: [] // Empty array for pending draws
        });
        
        res.status(201).json(draw);
    } catch (error) {
        console.error('Error creating draw:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Run draw (generate winners)
router.post('/draws/:id/run', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const draw = await Draw.findById(id);
        if (!draw) {
            return res.status(404).json({ error: 'Draw not found' });
        }
        
        if (draw.status !== 'pending') {
            return res.status(400).json({ error: 'Draw already processed' });
        }
        
        // Generate random winning numbers (5 numbers between 1-45)
        const winningNumbers = [];
        while (winningNumbers.length < 5) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!winningNumbers.includes(num)) {
                winningNumbers.push(num);
            }
        }
        
        // Get all users with scores
        const users = await User.find();
        
        // Generate winners based on draw type
        const winners = [];
        
        if (draw.draw_type === 'random') {
            // Random winner selection
            const eligibleUsers = users.filter(user => {
                // Add eligibility logic here (e.g., has subscription, has scores)
                return true;
            });
            
            if (eligibleUsers.length > 0) {
                // Create a copy of eligible users to modify
                let remainingUsers = [...eligibleUsers];
                
                // Select winners for each match type
                const matchTypes = ['5-match', '4-match', '3-match'];
                const prizeAmounts = { '5-match': 500, '4-match': 200, '3-match': 100 };
                
                for (const matchType of matchTypes) {
                    if (remainingUsers.length > 0) {
                        const randomIndex = Math.floor(Math.random() * remainingUsers.length);
                        const winner = remainingUsers[randomIndex];
                        
                        winners.push({
                            draw_id: draw._id,
                            user_id: winner._id,
                            match_type: matchType,
                            prize_amount: prizeAmounts[matchType],
                            verification_status: 'pending'
                        });
                        
                        // Remove selected user from remaining
                        remainingUsers.splice(randomIndex, 1);
                    }
                }
            }
        } else {
            // Algorithmic selection based on highest scores
            const usersWithScores = await Promise.all(users.map(async (user) => {
                const scores = await GolfScore.find({ user_id: user._id }).sort({ score_date: -1 });
                const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
                const averageScore = scores.length > 0 ? totalScore / scores.length : 0;
                return { user, averageScore };
            }));
            
            // Sort by average score (highest first) and filter those with scores
            const eligibleUsers = usersWithScores
                .filter(item => item.averageScore > 0)
                .sort((a, b) => b.averageScore - a.averageScore);
            
            // Select top 3 as winners
            const matchTypes = ['5-match', '4-match', '3-match'];
            const prizeAmounts = { '5-match': 500, '4-match': 200, '3-match': 100 };
            
            for (let i = 0; i < Math.min(3, eligibleUsers.length); i++) {
                const item = eligibleUsers[i];
                winners.push({
                    draw_id: draw._id,
                    user_id: item.user._id,
                    match_type: matchTypes[i],
                    prize_amount: prizeAmounts[matchTypes[i]],
                    verification_status: 'pending'
                });
            }
        }
        
        // Save winners to database
        if (winners.length > 0) {
            await Winner.insertMany(winners);
        }
        
        // Update draw with winning numbers and status
        draw.winning_numbers = winningNumbers;
        draw.status = 'simulated';
        await draw.save();
        
        // Get created winners with user details
        const createdWinners = await Winner.find({ draw_id: draw._id })
            .populate('user_id', 'email full_name');
        
        res.json({
            success: true,
            draw,
            winners: createdWinners,
            winning_numbers: winningNumbers,
            total_winners: createdWinners.length
        });
    } catch (error) {
        console.error('Error running draw:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Publish draw
router.post('/draws/:id/publish', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const draw = await Draw.findById(id);
        if (!draw) {
            return res.status(404).json({ error: 'Draw not found' });
        }
        
        if (draw.status !== 'simulated') {
            return res.status(400).json({ error: 'Draw must be simulated first' });
        }
        
        draw.status = 'published';
        draw.published_at = new Date();
        await draw.save();
        
        res.json({ message: 'Draw published successfully', draw });
    } catch (error) {
        console.error('Error publishing draw:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all winners
router.get('/winners', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const winners = await Winner.find()
            .populate('user_id', 'email full_name')
            .populate('draw_id', 'draw_date')
            .sort({ created_at: -1 });
        
        const formattedWinners = winners.map(winner => ({
            _id: winner._id,
            full_name: winner.user_id?.full_name || 'Unknown',
            email: winner.user_id?.email || 'Unknown',
            draw_date: winner.draw_id?.draw_date,
            match_type: winner.match_type,
            prize_amount: winner.prize_amount,
            verification_status: winner.verification_status,
            paid_at: winner.paid_at,
            proof_url: winner.proof_url
        }));
        
        res.json(formattedWinners);
    } catch (error) {
        console.error('Error fetching winners:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify winner (approve/reject)
router.put('/winners/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { verification_status, proof_url } = req.body;
        
        const winner = await Winner.findByIdAndUpdate(
            id,
            { 
                verification_status, 
                proof_url: proof_url || '',
                updated_at: new Date()
            },
            { new: true }
        );
        
        if (!winner) {
            return res.status(404).json({ error: 'Winner not found' });
        }
        
        res.json(winner);
    } catch (error) {
        console.error('Error verifying winner:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark winner as paid
router.post('/winners/:id/pay', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const winner = await Winner.findByIdAndUpdate(
            id,
            { 
                paid_at: new Date(),
                verification_status: 'approved'
            },
            { new: true }
        );
        
        if (!winner) {
            return res.status(404).json({ error: 'Winner not found' });
        }
        
        res.json({ message: 'Winner marked as paid', winner });
    } catch (error) {
        console.error('Error marking winner as paid:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;