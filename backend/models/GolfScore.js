const mongoose = require('mongoose');

const golfScoreSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        max: 45
    },
    score_date: {
        type: Date,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for faster queries
golfScoreSchema.index({ user_id: 1, score_date: -1 });

module.exports = mongoose.model('GolfScore', golfScoreSchema);