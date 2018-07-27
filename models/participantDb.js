const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    name: String,
    email: String,
    photoUrl: String,
    voteCount: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model('Participant', ParticipantSchema);
