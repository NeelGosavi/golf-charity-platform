const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
    draw_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Draw',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    match_type: {
        type: String,
        enum: ['5-match', '4-match', '3-match'],
        required: true
    },
    prize_amount: {
        type: Number,
        required: true
    },
    verification_status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    proof_url: String,
    paid_at: Date,
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Winner', winnerSchema);