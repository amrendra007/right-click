const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const router = express.Router();
const Contest = require('../models/contestDb');
const Participant = require('../models/participantDb');

router.get('/', (req, res) => {
    res.render('home', { title: 'right-click' });
});

//!  middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please login to create Contest');
    res.redirect('/login');
}


function coverUrlGenerator() {
    const urlArray = ['https://s3.ap-south-1.amazonaws.com/justchill/award.png',
        'https://s3.ap-south-1.amazonaws.com/justchill/alone.jpg',
        'https://s3.ap-south-1.amazonaws.com/justchill/cool.jpg',
        'https://s3.ap-south-1.amazonaws.com/justchill/lens.jpg',
        'https://s3.ap-south-1.amazonaws.com/justchill/night.jpg',
        'https://s3.ap-south-1.amazonaws.com/justchill/photo.jpg'];

    return urlArray[Math.floor((Math.random() * urlArray.length))];
}

// live contest
router.get('/contests', (req, res, next) => {
    Contest.find({}, (err, allContests) => {
        if (err) {
            return next(err);
        }
        res.render('contests', { title: 'contests', contests: allContests });
    });
});

//  create a contest
router.get('/contests/new', isLoggedIn, (req, res) => {
    res.render('new', { title: 'new', errors: '', timeError: false });
});

//  show one contest n variable to grab id for ajax
let contestId;
router.get('/contests/:id', (req, res, next) => {
    contestId = req.params.id; //eslint-disable-line
    Contest.findById(req.params.id)
        .populate('participant')
        .exec((err, foundContest) => {
            if (err) {
                return next(err);
            }
            // console.log(foundContest);
            res.render('show', { title: 'livecontest', contest: foundContest });
        });
});


//!  api to update participant data
router.post('/contests/api', (req, res, next) => {
    // console.log(contestId);
    Contest.findById(contestId, (err, foundContest) => {
        if (err) {
            return res.status(500).end();
        }
        const participantData = {
            name: req.body.name,
            email: req.body.email,
            photoUrl: req.body.photoUrl,
        };
        Participant.create(participantData, (error, newParticipant) => {
            if (error) {
                return res.status(500).end();
            }
            foundContest.participant.unshift(newParticipant);
            foundContest.save((er) => {
                if (er) {
                    return res.status(500).end();
                }
                // console.log(newParticipant);
                //  sending only participant data
                res.write(JSON.stringify(newParticipant));
                res.status(200).end();
            });
        });
    });
});

//! api to record vote
router.post('/contests/vote/api', (req, res, next) => {
    if (req.body.participantid) {
        Participant.findById(req.body.participantid, (err, foundParticipant) => {
            if (err) {
                return res.status(500).end();
            }
            foundParticipant.voteCount += 1;
            console.log(foundParticipant);
            res.end();
        });
    }
});


function isValidDate(value) {
    if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) return false;

    const date = new Date(value);
    if (!date.getTime()) return false;
    return date.toISOString().slice(0, 10) === value;
}

const validator = [
    check('contestName').exists().trim().isLength({ min: 6 })
        .withMessage('contestName must be of min 6 char long'),

    check('description').exists().trim().isLength({ min: 20 })
        .withMessage('Tell something more about contest with min 20 character'),

    check('timeSpan').exists().custom(isValidDate).withMessage('the date must be valid'),

    sanitizeBody('*').trim().escape(),
];

//  post contest
router.post('/contests', isLoggedIn, validator, (req, res, next) => {
    var author; //eslint-disable-line
    // console.log('current user: ', req.user);

    const errorFormatter = ({ msg, param, value }) => ({ param, msg, value }); //eslint-disable-line
    const result = validationResult(req).formatWith(errorFormatter);
    // console.log(result.array());
    if (!result.isEmpty()) {
        return res.render('new', { title: 'new', errors: result.array() });
    }

    let [yy, mm, dd] = req.body.timeSpan.split('-'); // eslint-disable-line
    mm -= 1;
    const milliSecond = new Date(yy, mm, dd, 23, 59, 59).getTime() - Date.now();

    // console.log(milliSecond);

    /* eslint-disable */
    if (req.user.facebook.username !== undefined) {
        author = {
            id: req.user._id,
            username: req.user.facebook.username,
            url: req.user.facebook.url,
        };
    }
    if (req.user.local.username !== undefined) {
        author = {
            id: req.user._id,
            username: req.user.local.username,
            url: 'https://s3.ap-south-1.amazonaws.com/justchill/A.png',
        };
    }
    if (req.user.google.username !== undefined) {
        author = {
            id: req.user._id,
            username: req.user.google.username,
            url: req.user.google.url,
        };
    }
    /* eslint-enable */
    const newContest = {
        contestName: req.body.contestName,
        description: req.body.description,
        milliSecond,
        endingDate: req.body.timeSpan,
        author,
        coverUrl: coverUrlGenerator(),
    };
    Contest.create(newContest, (err, newlyCreated) => {
        if (err) {
            return next(err);
        }
        res.render('message', { title: 'message', contest: newlyCreated });
        // console.log(newlyCreated);
    });

    // console.log('fb', req.user.facebook.username !== undefined);
    // console.log('local', req.user.local.username !== undefined);
    // console.log('google', req.user.google.username !== undefined);
});

module.exports = router;
