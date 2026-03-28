const express = require('express');
const Stripe = require('stripe');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Test endpoints
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Webhook route is working!', 
        timestamp: new Date().toISOString()
    });
});

router.post('/test-post', (req, res) => {
    console.log('Test POST received:', req.body);
    res.json({ success: true, received: true, body: req.body });
});

// Main webhook endpoint
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    console.log('🔔 Webhook received at /stripe endpoint');
    console.log('   Signature present:', sig ? 'Yes' : 'No');

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
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
            default:
                console.log(`📝 Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// Handle subscription created
async function handleSubscriptionCreated(stripeSubscription) {
    console.log('📝 Processing subscription created:', stripeSubscription.id);
    console.log('   Customer ID:', stripeSubscription.customer);
    console.log('   Status:', stripeSubscription.status);
    
    // Find user by stripe_customer_id
    const user = await User.findOne({ stripe_customer_id: stripeSubscription.customer });
    
    if (!user) {
        console.log('❌ User not found for customer:', stripeSubscription.customer);
        return;
    }
    
    // Get plan type from price
    const planType = stripeSubscription.items.data[0]?.price?.recurring?.interval === 'month' ? 'monthly' : 'yearly';
    
    // Check if subscription already exists
    let subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
    });
    
    if (subscription) {
        // Update existing
        subscription.status = stripeSubscription.status;
        subscription.plan_type = planType;
        subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
        subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
        await subscription.save();
        console.log(`✅ Updated subscription: ${subscription._id}`);
    } else {
        // Create new
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
        console.log(`✅ Created new subscription: ${subscription._id}`);
    }
    
    // Update user's subscription status
    if (stripeSubscription.status === 'active') {
        await User.findByIdAndUpdate(user._id, {
            subscription_status: 'active',
            subscription_plan: planType
        });
        console.log(`✅ User ${user.email} subscription activated (${planType})`);
    }
}

// Handle subscription update (this handles upgrades, cancellations, etc)
async function handleSubscriptionUpdate(stripeSubscription) {
    console.log('📝 Processing subscription update:', stripeSubscription.id);
    console.log('   New Status:', stripeSubscription.status);
    console.log('   New Plan:', stripeSubscription.items.data[0]?.price?.recurring?.interval);
    
    // Find existing subscription
    let subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
    });
    
    if (!subscription) {
        // Try to find by customer ID and create
        const user = await User.findOne({ stripe_customer_id: stripeSubscription.customer });
        if (user) {
            const planType = stripeSubscription.items.data[0]?.price?.recurring?.interval === 'month' ? 'monthly' : 'yearly';
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
            console.log(`✅ Created new subscription from update: ${subscription._id}`);
        } else {
            console.log('❌ No subscription found and no user found');
            return;
        }
    }
    
    // Update subscription
    const planType = stripeSubscription.items.data[0]?.price?.recurring?.interval === 'month' ? 'monthly' : 'yearly';
    subscription.status = stripeSubscription.status;
    subscription.plan_type = planType;
    subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
    subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;
    await subscription.save();
    
    // Update user
    if (stripeSubscription.status === 'active') {
        await User.findByIdAndUpdate(subscription.user_id, {
            subscription_status: 'active',
            subscription_plan: planType
        });
        console.log(`✅ User subscription updated to ${planType}`);
    } else if (stripeSubscription.status === 'canceled') {
        await User.findByIdAndUpdate(subscription.user_id, {
            subscription_status: 'inactive'
        });
        console.log(`❌ User subscription canceled`);
    }
    
    // IMPORTANT: If this is an upgrade, deactivate old subscriptions
    // Find and deactivate any other active subscriptions for this user
    const otherSubscriptions = await Subscription.find({
        user_id: subscription.user_id,
        stripe_subscription_id: { $ne: stripeSubscription.id },
        status: 'active'
    });
    
    for (const oldSub of otherSubscriptions) {
        oldSub.status = 'canceled';
        await oldSub.save();
        console.log(`📝 Deactivated old subscription: ${oldSub._id}`);
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

// Handle payment success
async function handlePaymentSuccess(invoice) {
    console.log('💰 Processing payment success for invoice:', invoice.id);
    console.log('   Subscription ID:', invoice.subscription);
    
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
        
        await User.findByIdAndUpdate(subscription.user_id, {
            subscription_status: 'active'
        });
        
        console.log(`✅ Payment succeeded for subscription: ${subscription._id}`);
    } else {
        console.log('⚠️ Subscription not found for invoice:', invoice.subscription);
    }
}

module.exports = router;