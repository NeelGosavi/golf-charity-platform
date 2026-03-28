const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const GolfScore = require('../models/GolfScore');
const Subscription = require('../models/Subscription'); // ← ADD THIS LINE
const router = express.Router();

// Get admin dashboard stats
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments();
        
        // Get active subscriptions
        const activeSubscriptions = await Subscription.countDocuments({ 
            status: 'active' 
        });
        
        // Get total prize pool from draws
        const prizePoolResult = await Draw.aggregate([
            { $group: { _id: null, total: { $sum: "$prize_pool" } } }
        ]);
        const totalPrizePool = prizePoolResult[0]?.total || 0;
        
        // Get total charity contributions from users
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
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password_hash')
            .sort({ created_at: -1 });
        
        // Add subscription status for each user
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const subscription = await Subscription.findOne({ 
                user_id: user._id, 
                status: 'active' 
            });
            return {
                ...user.toObject(),
                subscription_status: subscription ? 'active' : 'inactive',
                subscription_plan: subscription?.plan_type
            };
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
router.put('/charities/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, logo_url, website, is_featured } = req.body;
        
        const charity = await Charity.findByIdAndUpdate(
            id,
            { name, description, logo_url, website, is_featured },
            { new: true, runValidators: true }
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
            winning_numbers: []
        });
        
        res.status(201).json(draw);
    } catch (error) {
        console.error('Error creating draw:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Run draw
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
        
        // Generate random winning numbers
        const winningNumbers = [];
        while (winningNumbers.length < 5) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!winningNumbers.includes(num)) {
                winningNumbers.push(num);
            }
        }
        
        const users = await User.find();
        const winners = [];
        
        if (draw.draw_type === 'random') {
            const eligibleUsers = users.filter(() => true);
            const shuffled = [...eligibleUsers];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            const matchTypes = ['5-match', '4-match', '3-match'];
            const prizeAmounts = { '5-match': 500, '4-match': 200, '3-match': 100 };
            
            for (let i = 0; i < Math.min(3, shuffled.length); i++) {
                winners.push({
                    draw_id: draw._id,
                    user_id: shuffled[i]._id,
                    match_type: matchTypes[i],
                    prize_amount: prizeAmounts[matchTypes[i]],
                    verification_status: 'pending'
                });
            }
        }
        
        if (winners.length > 0) {
            await Winner.insertMany(winners);
        }
        
        draw.winning_numbers = winningNumbers;
        draw.status = 'simulated';
        await draw.save();
        
        const createdWinners = await Winner.find({ draw_id: draw._id }).populate('user_id', 'email full_name');
        
        res.json({
            draw,
            winners: createdWinners,
            winning_numbers: winningNumbers
        });
    } catch (error) {
        console.error('Error running draw:', error);
        res.status(500).json({ error: 'Server error' });
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

// Verify winner
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

// Debug subscriptions endpoint
router.get('/debug-subscriptions', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const allSubscriptions = await Subscription.find().populate('user_id', 'email full_name');
        const activeSubscriptions = await Subscription.find({ status: 'active' }).populate('user_id', 'email full_name');
        
        res.json({
            all_subscriptions: allSubscriptions,
            active_subscriptions: activeSubscriptions,
            active_count: activeSubscriptions.length,
            all_count: allSubscriptions.length
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Sync subscriptions endpoint
router.post('/sync-subscriptions', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subscriptions = await Subscription.find();
        let updated = 0;
        
        for (const sub of subscriptions) {
            if (sub.stripe_subscription_id && sub.status !== 'active') {
                try {
                    const Stripe = require('stripe');
                    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
                    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
                    
                    if (stripeSub.status === 'active') {
                        sub.status = 'active';
                        await sub.save();
                        updated++;
                        
                        await User.findByIdAndUpdate(sub.user_id, {
                            subscription_status: 'active',
                            subscription_plan: sub.plan_type
                        });
                    }
                } catch (err) {
                    console.error(`Error checking subscription ${sub._id}:`, err.message);
                }
            }
        }
        
        res.json({
            success: true,
            message: `Synced subscriptions, updated ${updated} to active`,
            total_subscriptions: subscriptions.length,
            updated
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;