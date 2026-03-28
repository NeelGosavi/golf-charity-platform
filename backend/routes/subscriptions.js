const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const stripeService = require('../services/stripeService');
const Subscription = require('../models/Subscription');
const router = express.Router();

// Get user's subscription
router.get('/', authMiddleware, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            user_id: req.user._id,
            status: 'active'
        }).sort({ created_at: -1 });
        
        res.json(subscription || null);
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create subscription
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { planType } = req.body;
        
        if (!planType) {
            return res.status(400).json({ error: 'Plan type is required' });
        }
        
        // Get price ID from environment
        const priceId = planType === 'monthly' 
            ? process.env.STRIPE_MONTHLY_PRICE_ID 
            : process.env.STRIPE_YEARLY_PRICE_ID;
        
        if (!priceId) {
            return res.status(500).json({ error: 'Price ID not configured' });
        }
        
        const result = await stripeService.createSubscription(
            req.user,
            planType,
            priceId
        );
        
        res.json({
            success: true,
            clientSecret: result.clientSecret,
            subscriptionId: result.subscription.id
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            user_id: req.user._id,
            status: 'active'
        });
        
        if (!subscription) {
            return res.status(404).json({ error: 'No active subscription found' });
        }
        
        await stripeService.cancelSubscription(subscription.stripe_subscription_id);
        
        res.json({ success: true, message: 'Subscription will be canceled at period end' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get subscription plans
router.get('/plans', async (req, res) => {
    res.json({
        plans: [
            {
                id: 'monthly',
                name: 'Monthly Plan',
                price: 299,
                price_display: '₹299',
                currency: 'INR',
                interval: 'month',
                features: [
                    'Enter up to 5 scores',
                    'Monthly draw entry',
                    'Support charity of choice'
                ]
            },
            {
                id: 'yearly',
                name: 'Yearly Plan',
                price: 4999,
                price_display: '₹4,999',
                currency: 'INR',
                interval: 'year',
                savings: 'Save ₹1,589',
                features: [
                    'Enter up to 5 scores',
                    'Monthly draw entry',
                    'Support charity of choice',
                    'Priority support',
                    'Exclusive tournament access'
                ]
            }
        ]
    });
});

module.exports = router;