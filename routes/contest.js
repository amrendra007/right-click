const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const router = express.Router();
const Contest = require('../models/contestDb');
const Participant = require('../models/participantDb');
const Result = require('../models/resultDb');

router.get('/', (req, res) => {
    Result.find({}, (err, allRes) => {
        if (err) {
            console.log(err);
        }
        res.render('home', { title: 'right-click', results: allRes });
    });
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

//  show one contest
router.get('/contests/:id', (req, res, next) => {
    Contest.findById(req.params.id)
        .populate('participant')
        .exec((err, foundContest) => {
            if (err) {
                return next(err);
            }
            // console.log(foundContest);
            Result.findOne({ key: req.params.id }, (error, foundResult) => {
                if (error) {
                    return next(error);
                }
                res.render('show', { title: 'livecontest', contest: foundContest, result: foundResult });
            });
        });
});


//!  api to update participant data
router.post('/contests/api', (req, res, next) => {
    if (req.body.contestid) {
        Contest.findById(req.body.contestid, (err, foundContest) => {
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
                    console.log('newparticipant on sever', newParticipant);
                    //  sending only participant data
                    res.write(JSON.stringify(newParticipant));
                    res.status(200).end();
                });
            });
        });
    } else {
        res.status(500).end();
    }
});

//! api to record vote
router.post('/contests/vote/api', (req, res, next) => {
    if (req.body.participantid) {
        Participant.findById(req.body.participantid, (err, foundParticipant) => {
            if (err) {
                return res.status(500).end();
            }
            foundParticipant.voteCount += 1; //eslint-disable-line
            foundParticipant.save((error, updatedParticipant) => {
                if (error) {
                    return res.status(500).end();
                }
                console.log('updated vote count', updatedParticipant);
                res.write(JSON.stringify(updatedParticipant.voteCount));
                res.status(200).end();
            });
        });
    } else {
        res.status(500).end();
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

//! improve error handling
function handleResult(newContestId) {
    if (newContestId) {
        Contest.findById(newContestId)
            .populate({
                path: 'participant',
                options: { sort: ({ voteCount: -1 }), limit: 3 },
            })
            .exec((err, resultData) => {
                if (err) {
                    console.log(err);
                    return;
                }
                // console.log('saved Data', resultData);
                const result = new Result({
                    contestName: resultData.contestName,
                    description: resultData.description,
                    milliSecond: resultData.milliSecond,
                    endingDate: resultData.endingDate,
                    coverUrl: resultData.coverUrl,
                    key: resultData._id,
                    author: {
                        id: resultData.author.id,
                        username: resultData.author.username,
                        url: resultData.author.url,
                    },
                    participant: resultData.participant.map(item => ({
                        name: item.name,
                        email: item.email,
                        photoUrl: item.photoUrl,
                        voteCount: item.voteCount,
                    })),
                });
                result.save((error) => {
                    if (error) {
                        console.log(error);
                    }
                });

                Contest.findById(newContestId, (contesFindErr, foundContest) => {
                    if (contesFindErr) {
                        console.log(contesFindErr);
                        return;
                    }
                    foundContest.expire = true; //eslint-disable-line
                    foundContest.save((contestSaveErr, updtaedContest) => {
                        if (contestSaveErr) {
                            console.log(contestSaveErr);
                            return;
                        }
                        console.log('updatedcontest after result', updtaedContest);
                    });
                });
            });
    }
}

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
    Contest.create(newContest, (err, newlyCreatedContest) => {
        if (err) {
            return next(err);
        }
        res.render('message', { title: 'message', contest: newlyCreatedContest });
        console.log('new contest', newlyCreatedContest);

        setTimeout(() => {
            // handleResult('5b59d2d9a62b4c244d822b22');
            handleResult(newlyCreatedContest._id);
        }, 180000);
    });
});

// handleResult('5b59d2d9a62b4c244d822b22');

module.exports = router;
