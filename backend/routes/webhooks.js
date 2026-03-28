const express = require('express');
const Stripe = require('stripe');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const router = express.Router();

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ==================== TEST ENDPOINTS ====================

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Webhook route is working!', 
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            webhook: '/api/webhooks/stripe',
            test: '/api/webhooks/test',
            testPost: '/api/webhooks/test-post'
        }
    });
});

// Test POST endpoint without Stripe signature
router.post('/test-post', (req, res) => {
    console.log('Test POST received:', req.body);
    res.json({ 
        success: true,
        received: true, 
        body: req.body,
        timestamp: new Date().toISOString()
    });
});

// ==================== STRIPE WEBHOOK ENDPOINT ====================

// Stripe webhook endpoint
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    console.log('🔔 Webhook received at /stripe endpoint');
    console.log('   Signature present:', sig ? 'Yes' : 'No');
    console.log('   Content-Type:', req.headers['content-type']);
    console.log('   Body length:', req.body ? req.body.length : 0);

    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('❌ STRIPE_WEBHOOK_SECRET is not set in environment variables');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`✅ Received event: ${event.type}`);

    try {
        switch (event.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDelete(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSuccess(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handlePaymentFailure(event.data.object);
                break;
            default:
                console.log(`📝 Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// ==================== EVENT HANDLERS ====================

// Handle subscription created
async function handleSubscriptionCreated(stripeSubscription) {
    console.log('📝 Processing subscription created:', stripeSubscription.id);
    
    // Find subscription by stripe_subscription_id
    const subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
    });
    
    if (subscription) {
        // Update existing subscription
        subscription.status = stripeSubscription.status;
        if (stripeSubscription.current_period_start && stripeSubscription.current_period_end) {
            subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
            subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
        }
        await subscription.save();
        
        // Update user
        if (stripeSubscription.status === 'active') {
            await User.findByIdAndUpdate(subscription.user_id, {
                subscription_status: 'active'
            });
        }
        
        console.log(`✅ Subscription created/updated: ${subscription._id}`);
    } else {
        console.log('⚠️ Subscription not found in database:', stripeSubscription.id);
    }
}

// Handle subscription update
async function handleSubscriptionUpdate(stripeSubscription) {
    console.log('📝 Processing subscription update:', stripeSubscription.id);
    
    // First try to find by stripe_subscription_id
    let subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
    });
    
    // If not found, try to find by customer ID and create
    if (!subscription) {
        console.log('   Subscription not found, looking up by customer...');
        
        // Find user by stripe_customer_id
        const user = await User.findOne({ stripe_customer_id: stripeSubscription.customer });
        
        if (user) {
            // Get plan type from price ID
            const planType = stripeSubscription.items.data[0]?.price?.recurring?.interval === 'month' ? 'monthly' : 'yearly';
            
            // Create new subscription record
            subscription = new Subscription({
                user_id: user._id,
                stripe_subscription_id: stripeSubscription.id,
                stripe_customer_id: stripeSubscription.customer,
                plan_type: planType,
                status: stripeSubscription.status,
                current_period_start: new Date(stripeSubscription.current_period_start * 1000),
                current_period_end: new Date(stripeSubscription.current_period_end * 1000)
            });
            await subscription.save();
            console.log(`✅ Created new subscription record: ${subscription._id}`);
        }
    }
    
    if (subscription) {
        subscription.status = stripeSubscription.status;
        if (stripeSubscription.current_period_start && stripeSubscription.current_period_end) {
            subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
            subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
        }
        subscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;
        await subscription.save();
        
        // Update user status
        if (stripeSubscription.status === 'active') {
            await User.findByIdAndUpdate(subscription.user_id, {
                subscription_status: 'active'
            });
        } else if (stripeSubscription.status === 'canceled') {
            await User.findByIdAndUpdate(subscription.user_id, {
                subscription_status: 'inactive'
            });
        }
        
        console.log(`📝 Subscription updated: ${subscription._id} - ${stripeSubscription.status}`);
    } else {
        console.log('❌ Could not find or create subscription for:', stripeSubscription.id);
    }
}

// Handle subscription deletion
async function handleSubscriptionDelete(stripeSubscription) {
    console.log('📝 Processing subscription deletion:', stripeSubscription.id);
    
    const subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
    });
    
    if (subscription) {
        subscription.status = 'canceled';
        await subscription.save();
        
        await User.findByIdAndUpdate(subscription.user_id, {
            subscription_status: 'inactive'
        });
        
        console.log(`❌ Subscription canceled: ${subscription._id}`);
    }
}

// Handle successful payment
async function handlePaymentSuccess(invoice) {
    console.log('💰 Processing payment success for invoice:', invoice.id);
    console.log('   Subscription ID from invoice:', invoice.subscription);
    
    // Find subscription by stripe_subscription_id
    let subscription = await Subscription.findOne({
        stripe_subscription_id: invoice.subscription
    });
    
    if (subscription) {
        subscription.status = 'active';
        if (invoice.period_start && invoice.period_end) {
            subscription.current_period_start = new Date(invoice.period_start * 1000);
            subscription.current_period_end = new Date(invoice.period_end * 1000);
        }
        await subscription.save();
        
        // Update user
        await User.findByIdAndUpdate(subscription.user_id, {
            subscription_status: 'active'
        });
        
        console.log(`✅ Subscription activated: ${subscription._id}`);
    } else {
        console.log('⚠️ Subscription not found for invoice:', invoice.subscription);
        
        // Try to find by customer ID
        if (invoice.customer) {
            const user = await User.findOne({ stripe_customer_id: invoice.customer });
            if (user) {
                console.log(`   Found user by customer ID: ${user.email}`);
            }
        }
    }
}

// Handle payment failure
async function handlePaymentFailure(invoice) {
    console.log('⚠️ Payment failed for invoice:', invoice.id);
    
    const subscription = await Subscription.findOne({
        stripe_subscription_id: invoice.subscription
    });
    
    if (subscription) {
        subscription.status = 'past_due';
        await subscription.save();
        console.log(`⚠️ Subscription marked as past_due: ${subscription._id}`);
    }
}

module.exports = router;