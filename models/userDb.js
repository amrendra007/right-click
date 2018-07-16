const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    local: {
        username: {
            type: String,
            trim: true,
        },
        password: String,
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

const User = mongoose.model('User', UserSchema);
module.exports = User;
