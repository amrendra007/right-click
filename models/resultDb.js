const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    contestName: String,
    description: String,
    milliSecond: Number,
    endingDate: Date,
    coverUrl: String,
    key: String,
    author: {
        id: String,
        username: String,
        url: String,
    },
    participant: [
        new mongoose.Schema({
            name: String,
            email: String,
            photoUrl: String,
            voteCount: Number,
        }),
    ],
});

// Virtual url
ResultSchema
    .virtual('url')
    .get(function () {
        return `/results/${this._id}`;
    });

module.exports = mongoose.model('Result', ResultSchema);
