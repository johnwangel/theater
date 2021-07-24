var express = require('express');
var faves = express.Router();

const { get_data } = require('./base');

const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const q = require('../queries/favorites.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

faves.get('/',function(req,res){
  res.json('ok');
});

faves.post('/', jsonParser, (req,res) => {
  const user_id=req.body.user_id;
  const production_id=req.body.production_id;
  if ( req.body.hasOwnProperty('liked') ) {
    const faves=new Promise( (resolve, reject ) => make_favorite(user_id, production_id, req.body.liked, resolve, reject ) );
    faves.then( data => res.json(data) });
  } else {
    const faves=new Promise( (resolve, reject ) => is_favorite(user_id, production_id, resolve, reject ) );
    faves.then( data => res.json(data) );
  }
});

function get_favorites(id,resolve,reject){
  let query=q.get_favorites();
  var pool = new Pool(creds);
  pool.query(query, [id], (err, _res) => {
    pool.end();
    if (err) reject( { error: `Unable to fetch. ${err}`} );
    if (_res.rows) resolve(_res.rows);
  })
}

function is_favorite(uid,pid,resolve,reject){
  let query=q.is_favorite();
  var vals = [uid,pid];
  var pool = new Pool(creds);
  pool.query(query, vals, (err, _res) => {
    pool.end();
    if (err) reject( { error: `Unable to fetch. ${err}`} );
    if (_res.rows) resolve(_res.rows);
  });
}

function make_favorite(uid,pid,liked,resolve,reject){
  let query=q.is_favorite();
  var vals = [uid,pid];
  var pool = new Pool(creds);
  pool.query(query, vals, (err, _res) => {
    if (err) reject( { error: `Unable to fetch. ${err}`} );
    if (_res.rows && _res.rows.length) {
      let query=q.update_favorite();
      var vals = [liked,_res.rows[0].favorite_id];
      pool.query(query, vals, (err, _res) => {
        pool.end();
        if (err) reject( { error: `Unable to fetch. ${err}`} );
        if (_res.rows) resolve(_res.rows);
      });
    } else {
      let query=q.make_favorite();
      var vals = [uid,pid,liked];
      pool.query(query, vals, (err, _res) => {
        pool.end();
        if (err) reject( { error: `Unable to fetch. ${err}`} );
        if (_res.rows) resolve(_res.rows);
      });
    }
  });
}

module.exports = faves;