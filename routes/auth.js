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
const Moment = require('moment');
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
    const prom = new Promise( (resolve, reject ) => get_theater_by_token( b.token, resolve, reject ) );
    prom.then(data => {
      if (data.exists) {
        tid=data.values.id;
        values.level=2;
        cont();
      } else {
        res.json({ message: 'Authentication failed. Wrong password.'});
      }
    });
  } else {
    cont();
  }

  function cont() {
    const prom2 = new Promise( (resolve, reject ) => make_user( values, resolve, reject ) );
    prom2.then(data => {
      data.tid=tid;
      res.json(data);
    });
  }

});

function make_user( values, resolve, reject ) {
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
              let token_info = { id: user.user_id, level: user.level, username: user.username, fname: user.fname, lname: user.lname };
              user.jwt=jsonwebtoken.sign( token_info, 'RESTFULAPIs' );
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

//send reset password email
auth.post('/reminder', jsonParser, ( req, res ) => {
  //clear expired tokens and generate a reset token.
  const init=[
                new Promise( (resolve, reject) => clear_expired_tokens( resolve, reject ) ),
                new Promise( (resolve, reject) => generate_reset_token( resolve, reject ) )
              ];

  Promise.all(init).then(function(values) {
    let tk=values[1];
    let query=q.get_user();
    var pool = new Pool(creds);
    pool.query(query, [req.body.username], ( err, _res ) => {
      if ( _res && _res.rows && _res.rows.length !== 0 ){
        let uid=_res.rows[0].user_id;
        let date=Moment.utc().add(20,'minutes').format('YYYY-MM-DD hh:mm:ss');
          query=q.save_reset_token();
          pool.query(query, [tk,date,uid], ( err, _res ) => {
            send({
              to: req.body.username,
              subject: 'StageRabbit: Reset Password',
              html: `<p>You have requested to reset your password.
                        Please go to <a href="https://stagerabbit.com/reset">stagerabbit.com/reset</a> and
                        enter the following code: ${tk}. Note: This code will expire after 20 minutes.</p>`,
            }, (error, result, fullResult) => {
              if (error) res.json({ message: 'User not found.'});
              var message = `Instructions for resetting your password have been sent to: ${req.body.username}`;
              res.json({message});
            });
          });

      } else {
        pool.end();
        res.json({ message: 'User not found.'});
      }
    });
  })
});

// reset password
auth.post('/reset', jsonParser, ( req, res ) => {
  //clear expired token
  const clear=new Promise( (resolve, reject) => clear_expired_tokens( resolve, reject ) );
  //check if token is valid
  clear.then( val => {
    const valid=new Promise( (resolve, reject) => check_token( req.body.code, resolve, reject ) );
    //if valid token, reset password
    valid.then( user_id => {
      var pw = req.body.pass1;
      if(user_id){
        bcrypt.genSalt(saltRounds, function(err, salt) {
          bcrypt.hash( pw, salt, function(err, hash) {
            let params=[hash,user_id];
            let query=q.update_password();
            var pool = new Pool(creds);
            pool.query(query, params, ( err, _res ) => {
              pool.end();
              res.json({message:'OK'});
            });
          })
         })
      } else {
        res.json({message:'Invalid or Expired Code'})
      }
    })
  }).catch( err => res.json({message:'Error in Clear'}));
})

auth.get('/logout', jsonParser, (req, res) => {
  req.logout()
  req.session.destroy();
  res.send( { message: 'Successfully logged out' } );
});

function check_token(token,resolve,reject){
  let query='SELECT * FROM logins WHERE reset_token=$1;'
  var pool = new Pool(creds);
  pool.query(query, [token], ( err, _res ) => {
    pool.end();
    if ( _res && _res.rows && _res.rows.length > 0 && !has_expired(_res.rows[0].expiry_date) ) resolve(_res.rows[0].user_id);
    resolve(false);
  });
}

function generate_reset_token(resolve, reject){
  let str='123456789';
  let radix=str.length;
  let token='';
  for (var i = 6; i >= 1; i--) {
    let x=rand(1,radix);
    token+=str.substring(x,x+1);
  }
  const prom = new Promise( (resolve, reject ) => get_user_by_token( token, resolve, reject ) );
  prom.then(data => {
    if (data.exists) {
      generate_reset_token();
    } else {
      resolve(token);
    }
  });
}

function rand(min, max) {
  return Math.ceil(Math.random() * (max - min) + min);
}

function get_user_by_token( token, resolve, reject ){
  var query = `SELECT * FROM logins WHERE token=$1;`;
  var val=[token];
  var pool = new Pool(creds);
  pool.query(query, val, (err, _res) => {
    pool.end();
    if ( _res && _res.rowCount > 0 ){
      resolve( { exists: true, values: _res.rows } );
    } else {
      resolve( { exists: false } );
    }
  });
}

function get_theater_by_token( token, resolve, reject ){
  var query = `SELECT * FROM theaters WHERE token=$1;`;
  var val=[token];
  var pool = new Pool(creds);
  pool.query(query, val, (err, _res) => {
    pool.end();
    if ( _res && _res.rowCount > 0 ){
      resolve( { exists: true, values: _res.rows[0] } );
    } else {
      resolve( { exists: false } );
    }
  });
}

function clear_expired_tokens(resolve,reject){
  let my_promises=[];
  var query = `SELECT user_id,reset_token,expiry_date FROM logins WHERE reset_token>0;`;
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    if ( _res && _res.rowCount > 0 ){
      _res.rows.forEach( item => {
        if(has_expired(item.expiry_date)){
          my_promises.push(new Promise( (resolve, reject ) => delete_token( [item.user_id], resolve, reject ) ) );
        }
      });
      Promise.all( my_promises ).then( values => {
        resolve('cleared all')
      })
      .catch( err => rej(err));
    } else { resolve(false) }
  });
}

function has_expired(d){
  var a = Moment.utc();
  var b = Moment.utc(d);
  return (a.diff(b) < 0) ?  false :  true;
}

function delete_token(param,resolve,reject){
  var query = `UPDATE logins SET reset_token=null, expiry_date=null WHERE user_id=$1 RETURNING *;`;
  var pool = new Pool(creds);
  pool.query(query, param, (err, _res) => resolve(true) );
}

module.exports = auth;