const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    local: {
        username: {
            type: String,
            trim: true,
        },
        password: String,
        url: String,
    },
    facebook: {
        id: String,
        username: String,
        url: String,
    },
    google: {
        id: String,
        username: String,
        url: String,
    },
});

module.exports = mongoose.model('User', UserSchema);
