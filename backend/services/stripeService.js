const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Get or create customer
const getOrCreateCustomer = async (user) => {
    if (user.stripe_customer_id) {
        return await stripe.customers.retrieve(user.stripe_customer_id);
    }
    
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
            userId: user._id.toString()
        }
    });
    
    await User.findByIdAndUpdate(user._id, {
        stripe_customer_id: customer.id
    });
    
    return customer;
};

// Create subscription
const createSubscription = async (user, planType, priceId) => {
    // Get or create customer
    const customer = await getOrCreateCustomer(user);
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
    });
    
    // Save subscription in database
    const newSubscription = await Subscription.create({
        user_id: user._id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        plan_type: planType,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
    });
    
    return {
        subscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
    };
};

// Cancel subscription
const cancelSubscription = async (subscriptionId) => {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
    });
    
    await Subscription.findOneAndUpdate(
        { stripe_subscription_id: subscriptionId },
        { cancel_at_period_end: true }
    );
    
    return subscription;
};

// Webhook handlers
const handleWebhook = async (event) => {
    switch (event.type) {
        case 'invoice.payment_succeeded':
            await handlePaymentSuccess(event.data.object);
            break;
        case 'invoice.payment_failed':
            await handlePaymentFailure(event.data.object);
            break;
        case 'customer.subscription.updated':
            await handleSubscriptionUpdate(event.data.object);
            break;
        case 'customer.subscription.deleted':
            await handleSubscriptionDelete(event.data.object);
            break;
    }
};

const handlePaymentSuccess = async (invoice) => {
    const subscription = await Subscription.findOne({
        stripe_subscription_id: invoice.subscription
    });
    
    if (subscription) {
        subscription.status = 'active';
        subscription.current_period_start = new Date(invoice.period_start * 1000);
        subscription.current_period_end = new Date(invoice.period_end * 1000);
        await subscription.save();
        
        await User.findByIdAndUpdate(subscription.user_id, {
            subscription_status: 'active'
        });
        
        console.log(`✅ Subscription activated: ${subscription._id}`);
    }
};

const handlePaymentFailure = async (invoice) => {
    const subscription = await Subscription.findOne({
        stripe_subscription_id: invoice.subscription
    });
    
    if (subscription) {
        subscription.status = 'past_due';
        await subscription.save();
        console.log(`⚠️ Payment failed for subscription: ${subscription._id}`);
    }
};

const handleSubscriptionUpdate = async (stripeSubscription) => {
    const subscription = await Subscription.findOne({
        stripe_subscription_id: stripeSubscription.id
    });
    
    if (subscription) {
        subscription.status = stripeSubscription.status;
        subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
        subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
        subscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;
        await subscription.save();
        
        console.log(`📝 Subscription updated: ${subscription._id} - ${stripeSubscription.status}`);
    }
};

const handleSubscriptionDelete = async (stripeSubscription) => {
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
};

module.exports = {
    getOrCreateCustomer,
    createSubscription,
    cancelSubscription,
    handleWebhook
};