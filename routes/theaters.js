var express = require('express');
var theaters = express.Router();

const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;


//TODO: ADD THEATER
theaters.post('/add_theater', jsonParser, (req,res) => {
 //create theater
 //create and save token
})

theaters.post('/alter_theater', jsonParser, (req,res) => {
  const th=req.body;
  var query = q.theater_update(th);
  var values = [ th.value, th.theater_id];
  var pool = new Pool(creds);
  pool.query(query, values, (err, _res) => {
    var data=_res.rows;
    pool.end();
    res.json({ data });
    return;
  });
});

const get_theaters = ( tid ) => {
  var _venues={};
  var val = [tid];
  var a = q.venues_by_theater();
  var b = q.venues_all();
  var pool = new Pool(creds);
  pool.query(a, val, (err, _res) => {
    _venues.byTheater=_res.rows;
    pool.query(b, (err, _res) => {
      pool.end();
      _venues.all=_res.rows;
      res.json(_venues);
    });
  });
};

function generate_token(resolve, reject){
  let str='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
  let radix=str.length;
  let token='';
  for (var i = 15; i >= 1; i--) {
    let x=rand(1,radix);
    (i%4===0)? token+='-' : token+=str.substring(x,x+1);
  }
  const prom = new Promise( (resolve, reject ) => get_theater_by_token( token, resolve, reject ) );
  prom.then(data => {
    if (data.exists) {
      generate_token();
    } else {
      resolve(token);
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
      resolve( { exists: true, values: _res.rows } );
    } else {
      resolve( { exists: false } );
    }
  });
}

function rand(min, max) {
  return Math.ceil(Math.random() * (max - min) + min);
}

module.exports = theaters;