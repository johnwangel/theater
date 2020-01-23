var express = require('express');
var auth = express.Router();

const passport = require('passport');
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session);
const client = redis.createClient();
const bcrypt = require('bcrypt');
const jsonwebtoken = require("jsonwebtoken");
const bodyParser = require('body-parser');
const saltRounds = 10;

require('../passport')();

const jsonParser = bodyParser.json();
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;
const secret = tokens.secret;
const send = require('gmail-send')({
  user: tokens.google.user,
  pass: tokens.google.pass,
  to: '',
  subject: ''
});

auth.use(
  session({
    store: new RedisStore({ client }),
    secret: secret,
    resave: false,
    saveUninitialized: false
  })
);

auth.use(function(req, res, next){
  if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT'){
    jsonwebtoken.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
      if (err) {
        req.user = undefined;
      }
      req.user = decode;
      next();
    });
  } else {
    req.user = undefined;
    next();
  }
});

auth.use(passport.initialize());
auth.use(passport.session());

auth.get('/', (req, res) => {
  if (req.user){
    res.json( { user: req.user } )
  } else {
    return res.status(401).json({ message: "Unauthorized user!" });
  }
});

//create and respond with new user
auth.post('/register', jsonParser, (req, res) => {
  let b=req.body;
  let level=(b.account_type==='admin')?2:1;
  let tid=null;

  let values =[
    (b.username)?b.username:' ',
    (b.password)?b.password:' ',
    (b.token)?b.token:' ',
    level,
    (b.fname)?b.fname:' ',
    (b.lname)?b.lname:' ',
    (b.role)?b.role:' ',
    (b.phone)?b.phone:' ',
    b.optin
  ];

  if (b.token) {
    const prom = new Promise( (resolve, reject ) => get_theater_by_token( token, resolve, reject ) );
    prom.then(data => {
      if (data.exists) {
        tid=data.values.id;
        cont();
      } else {
        cont();
      }
    });
  } else {
    cont();
  }

  function cont() {
    const prom2 = new Promise( (resolve, reject ) => make_user( values, tid, resolve, reject ) );
    prom2.then(data => res.json(data));
  }

});

function make_user( values, tid, resolve, reject ) {
  var query=q.create_user();
    bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash( values[1], salt, function(err, hash) {
          values[1]=hash;
          var pool = new Pool(creds);
          pool.query(query, values, (err, _res) => {
            if (err) {
              resolve(err);
            } else if (_res && _res.rows) {
              let user=_res.rows[0];
              user.jwt=jsonwebtoken.sign( { id: user.user_id, level: user.level, username: user.username, fname: user.fname, lname: user.lname, tid: tid }, 'RESTFULAPIs' );
              resolve(user);
            } else {
              resolve('ERROR');
            }
          });
        });
    });
}

//check login credentials
auth.post('/login', jsonParser, ( req, res ) => {
  let query=q.get_user();
  let value = [req.body.username];
  var pool = new Pool(creds);
  pool.query(query, [req.body.username], ( err, _res ) => {
    pool.end();
    if ( _res && _res.rows && _res.rows.length !== 0 ){
      const user=_res.rows[0];
      if(bcrypt.compareSync( req.body.password, user.password )){
        user.jwt=jsonwebtoken.sign( { id: user.user_id, level: user.level, username: user.username, fname: user.fname, lname: user.lname, tid: user.tid }, 'RESTFULAPIs' );
        return res.json(user);
      } else {
        res.json({ message: 'Authentication failed. Wrong password.'});
      }
    } else {
      res.json({ message: 'Authentication failed. User not found.'});
    }
  });
});

//check login credentials
auth.post('/reminder', jsonParser, ( req, res ) => {
  let query=q.get_user();
  let value = [req.body.username];

  console.log(query, value);

  var pool = new Pool(creds);
  pool.query(query, [req.body.username], ( err, _res ) => {
    pool.end();
    if ( _res && _res.rows && _res.rows.length !== 0 ){
      send({
        to: req.body.username,
        subject: 'StageRabbit: Reset Password',
        text:    'You have requested to reset your password.',
      }, (error, result, fullResult) => {
        if (error) console.error(error);
        var message = `Instructions for resetting your password have been sent to: ${req.body.username}`;
        console.log(fullResult, message);
        res.json({message});
      });
    } else {
      console.log('error')
      res.json({ message: 'User not found.'});
    }
  });
});

auth.get('/logout', jsonParser, (req, res) => {
  req.logout()
  req.session.destroy();
  res.send( { message: 'Successfully logged out' } );
});

// var values =[
//     'owner@stagerabbit.com',
//     'Die4u678!',
//     '',
//     3,
//     'John',
//     'Atkins',
//     'CEO',
//     '9176975626'
//   ];

//   const pr = new Promise( (resolve, reject ) => make_user( values, '', resolve, reject ) );
//   pr.then(data => console.log(data));

module.exports = auth;