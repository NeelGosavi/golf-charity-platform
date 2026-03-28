const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    logo_url: String,
    website: String,
    is_featured: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Charity', charitySchema);