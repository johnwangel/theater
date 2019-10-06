/*jshint esversion:6 */
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const q = require('./queries/queries.js');
const tokens = require('./auth/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

module.exports = function() {

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((userId, done) => {
    Users.findById(userId)
    .then(data => {
      done(null, data)
    })
    .catch(err => {
      done(err, false);
    });
  });

  passport.use(
    'local',
    new LocalStrategy(function(username, password, done) {
      query=q.get_user( username );
      var pool = new Pool(creds);
      pool.query(query, (err, _res) => {
        pool.end();
        if ( _res && _res.rows ){
          const user=_res.rows[0];
          bcrypt.compare(password, user.password, (err, res) => {
            if (res) return done(null, user);
            return done(null, false);
          });
        } else {
          return done(null, false);
        }
      });
    })
  );
};