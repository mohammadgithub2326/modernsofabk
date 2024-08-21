// models/Token.js
const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    email:{type:String,required:true,unique: true},
    refreshToken: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('Token', TokenSchema);
