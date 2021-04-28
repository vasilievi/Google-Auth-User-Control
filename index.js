const express = require("express");
const app = express();
app.use(express.json())

///////////////// MONGODB ////////////////////////
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
});

const User = mongoose.model('User', userSchema);

////////////////// Passport //////////////////////////
var passport = require('passport');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    err
      ? done(err)
      : done(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: "1044808296375-mobepgau5ps43dvf236k37jt1co3jbds.apps.googleusercontent.com",
  clientSecret: "_PBbkwZGK0UE5_nvloD5iy-q",
  callbackURL: "http://localhost/auth/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    User.findOne({
      'googleId': profile.id
    }, function (err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile._json.name,
        });
        user.save(function (err) {
          if (err) console.log(err);
          return done(err, user);
        });
      } else {
        return done(err, user);
      }
    });

  }
));

const expressSession = require('express-session')({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
});

app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',
  passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email']
  }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  }
);

app.get('/', (req, res) => {
  if (typeof req.user === 'undefined') {
    res.send('<a href="/login">Продолжить с Google</a>')
  } else {
    res.send(req.user.name)
  }
});

app.listen(80, function () {
  console.log("http://localhost");
});