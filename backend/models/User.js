const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password_hash: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        trim: true
    },
    charity_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Charity'
    },
    charity_percentage: {
        type: Number,
        default: 10,
        min: 10,
        max: 100
    },
    stripe_customer_id: String,
    is_admin: {
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

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);