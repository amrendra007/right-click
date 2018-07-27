const path = require('path');
const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
require('dotenv').config();
const User = require('./models/userDb');

//  requiring routes
const awsRoutes = require('./routes/aws');
const contestRoutes = require('./routes/contest');
const userRoutes = require('./routes/user');

//  database conn
// mongoose.connect(`${process.env.DB_HOST}${process.env.DB_USER}:${process.env.DB_PASS}
// @ds137581.mlab.com:37581/right-click`, { useNewUrlParser: true });
mongoose.connect('mongodb://localhost:27017/right-click', { useNewUrlParser: true });

const db = mongoose.connection;
db.once('open', () => {
    console.log('connected to db');
});

// app configuration
app.use(session({
    secret: 'fasgasfgasfgastrtsdsf',
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.message = req.flash('message');
    next();
});

//  route mount
app.use('/', contestRoutes);
app.use('/', userRoutes);
app.use('/', awsRoutes);

//  PASSPORT local CONFIGRATION
passport.use(new LocalStrategy((username, password, done) => {
    User.findOne({ 'local.username': username }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        const hash = user.local.password;
        bcrypt.compare(password, hash, (error, response) => {
            if (response === true) {
                return done(null, user);
            }
            return done(null, false, { message: 'Incorrect password.' });
        });
    });
}));

//! convert sync -> async

//  passport facebook configuration
passport.use(new FacebookStrategy({
    clientID: process.env.FbCLIENT_ID,
    clientSecret: process.env.FbCLIENT_SEC,
    callbackURL: 'https://localhost:8000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email'],
},
(accessToken, refreshToken, profile, done) => {
    // console.log(profile);
    User.findOne({ 'facebook.id': profile.id }, (err, user) => {
        if (err) {
            console.log('err db');
            return done(err);
        }
        if (user) {
            console.log('fetched fb user from db');
            return done(null, user);
        }
        const fbuser = new User();
        fbuser.facebook.username = profile.displayName;
        fbuser.facebook.id = profile.id;
        fbuser.facebook.url = profile.photos[0].value;
        fbuser.save((error, newUser) => {
            if (error) {
                console.log('err in saving');
                return done(err);
            }
            console.log('newUser created', newUser);
            done(null, newUser);
        });
    });
}));

//  passport Google configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GoogleCLIENT_ID,
    clientSecret: process.env.GoogleCLIENT_SEC,
    callbackURL: 'https://localhost:8000/auth/google/callback',
    profileFields: ['id', 'displayName', 'photos', 'email'],
},
(accessToken, refreshToken, profile, done) => {
    // console.log(profile);
    User.findOne({ 'google.id': profile.id }, (err, user) => {
        if (err) {
            console.log('err db');
            return done(err);
        }
        if (user) {
            console.log('fetched google user from db');
            return done(null, user);
        }
        const googleuser = new User();
        googleuser.google.username = profile.displayName;
        googleuser.google.id = profile.id;
        googleuser.google.url = profile.photos[0].value;
        googleuser.save((error, newUser) => {
            if (error) {
                console.log('err in saving');
                console.log(error);
                return done(err);
            }
            console.log('newUser created', newUser);
            done(null, newUser);
        });
    });
}));

// error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error', { title: 'Error' });
});

process.on('uncaughtException', (err) => {
    console.log('Its a uncaught one: ', err);
    process.exit(1);
});

const httpOptions = {
    cert: fs.readFileSync('./ssl/server.crt'),
    key: fs.readFileSync('./ssl/server.key'),
};

const port = process.env.PORT || 8000;
const server = https.createServer(httpOptions, app);
server.listen(port, () => {
    console.log('server running');
});
