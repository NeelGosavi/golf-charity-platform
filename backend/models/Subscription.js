const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stripe_subscription_id: {
        type: String,
        unique: true,
        sparse: true
    },
    stripe_customer_id: {
        type: String
    },
    plan_type: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'past_due', 'incomplete', 'trialing'],
        default: 'incomplete'
    },
    current_period_start: {
        type: Date,
        default: null
    },
    current_period_end: {
        type: Date,
        default: null
    },
    cancel_at_period_end: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);