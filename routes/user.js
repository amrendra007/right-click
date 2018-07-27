const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const router = express.Router();
const saltRounds = 10;
const User = require('../models/userDb');

router.get('/login', (req, res) => {
    res.render('login', { title: 'login' });
});
router.get('/register', (req, res) => {
    res.render('register', { title: 'register', errors: '' });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

router.get('/profile', isLoggedIn, (req, res, next) => {
    console.log(req.user);
    res.render('profile', { user: req.user, title: 'profile-page' });
});

router.get('/logout', (req, res, next) => {
    req.logout();
    req.session.destroy();
    res.redirect('/login');
});

//  validator middleware
const validator = [
    check('username').exists().trim().isLength({ min: 6 })
        .withMessage('username must be of min 6 char long')
        .custom(username => User.findOne({ 'local.username': username })
            .then((user) => {
                if (user) {
                    return Promise.reject(new Error('Username already in use'));
                }
            }))
        .withMessage('Username already in use'),

    check('password').exists().trim().isLength({ min: 6 })
        .withMessage('password must be of min 6 char long'),

    check('matchpassword', 'passwordConfirmation field must have the same value as the password field')
        .exists().trim()
        .custom((value, { req }) => value === req.body.password),
    sanitizeBody('*').trim().escape(),
];

//  !handle next(err) type error, use flash
//  post route register
router.post('/register', validator, (req, res, next) => {
    const errorFormatter = ({ msg, param, value }) => ({ value, param, msg }); //eslint-disable-line 
    const result = validationResult(req).formatWith(errorFormatter);

    console.log('errors', result.array());
    if (!result.isEmpty()) {
        return res.render('register', { title: 'register', errors: result.array() });
    }
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (err) {
            return next(err);
        }
        const user = new User();
        user.local.username = req.body.username;
        user.local.password = hash;
        user.save((error, newUser) => {
            if (error) {
                return next(error);
            }
            req.login(newUser.id, (er) => {
                if (er) {
                    return next(er);
                }
                req.flash('success', `Welcome ${newUser.local.username}!`);
                res.redirect('/profile');
            });
        });
    });
});

//  login post route
router.post('/login', passport.authenticate('local',
    { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

//     ----------facebook auth----------
router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/login',
    }));

router.get('/auth/facebook', passport.authorize('facebook'));

router.get('/auth/facebook/callback',
    passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/login',
    }));

//     ----------Google-auth----------
router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/login',
    }));

router.get('/auth/google', passport.authorize('google', { scope: ['profile'] }));

router.get('/auth/google/callback',
    passport.authorize('google', {
        successRedirect: '/profile',
        failureRedirect: '/',
    }));

passport.serializeUser((id, done) => {
    done(null, id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});


module.exports = router;
