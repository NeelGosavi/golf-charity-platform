const mongoose = require('mongoose');

const drawSchema = new mongoose.Schema({
    draw_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'simulated', 'published'],
        default: 'pending'
    },
    draw_type: {
        type: String,
        enum: ['random', 'algorithmic'],
        required: true
    },
    winning_numbers: {
        type: [Number],
        default: [], // Allow empty array for pending draws
        validate: {
            validator: function(v) {
                // Only validate if draw is simulated or published
                if (this.status === 'pending') {
                    return true; // Pending draws can have empty winning_numbers
                }
                return v.length === 5; // Non-pending draws must have 5 numbers
            },
            message: 'Must have exactly 5 winning numbers for non-pending draws'
        }
    },
    prize_pool: {
        type: Number,
        default: 0
    },
    published_at: Date,
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Draw', drawSchema);