const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
    contestName: String,
    description: String,
    milliSecond: Number,
    endingDate: Date,
    coverUrl: String,
    expire: {
        type: Boolean,
        default: false,
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        username: String,
        url: String,
    },
    participant: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
    }],
});

// Virtual for this contest instance URL.
ContestSchema
    .virtual('url')
    .get(function () {
        return `/contests/${this._id}`; //eslint-disable-line
    });

module.exports = mongoose.model('Contest', ContestSchema);
