var express = require('express');
var theaters = express.Router();

const { get_data } = require('./base');
const fetch=require('node-fetch');
const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;
const key=tokens.google_api_key;

theaters.post('/add_theater', jsonParser, (req,res) => {
  const t=req.body;
  var query = q.add_theater();
  var state= t.state;
  t.state_name = state.split('-')[1];
  var state_number = state.split('-')[0];
  t.state_number=parseInt(state_number);
  var values = [ t.name, t.city, t.state_number ];
  const data={};
  var tid;
  const new_theater = new Promise( (resolve, reject ) => {
    var pool = new Pool(creds);
    pool.query(query, values, (err, _res) => {
      pool.end();
      tid=_res.rows[0].id;
      (err) ? reject(err) : resolve(_res.rows[0]);
    })
  });
  const token = new Promise( (resolve, reject) => generate_token( resolve, reject ) );
  const place = new Promise( (resolve, reject) => getPlace(t, resolve, reject));
  Promise.all([new_theater,token,place])
  .then( values => {
    let theater=values[0];
    let place=values[2];
    data.token=values[1];
    data.formatted_address=place.formatted_address;
    data.phone=place.formatted_phone_number;
    data.website=place.website;
    data.formatted_address=place.formatted_address;
    data.place_id=String(place.place_id);
    data.location_lat = String(place.geometry.location.lat);
    data.location_lng = String(place.geometry.location.lng);
    data.viewport_ne_lat = String(place.geometry.viewport.northeast.lat);
    data.viewport_ne_lng = String(place.geometry.viewport.northeast.lng);
    data.viewport_sw_lat = String(place.geometry.viewport.southwest.lat);
    data.viewport_sw_lng = String(place.geometry.viewport.southwest.lng);
    let add=place.formatted_address;
    let address_array=add.split(',');
    let add3=address_array.pop();
    let add4=address_array.pop();
    data.zip = add4.split(' ')[2];
    let add5=address_array.pop();
    data.address1 = address_array.join(',');
    var proms=[];
    for (_skey in data){
      let t={ field: _skey, value: data[_skey], theater_id: tid  };
      let p=new Promise( (resolve, reject ) => update_theater( t, resolve, reject ));
      proms.push(p);
    };
    Promise.all(proms).then( results => {
      const prom = new Promise( (resolve, reject ) => get_data( 'theater', tid, resolve, reject ) );
      prom.then( theater => {
        res.json( { theater })
      });
    });
  });
});

function getPlace( t, resolve, reject ){
  var url1='https://maps.googleapis.com/maps/api/place/findplacefromtext/json?';
  var fields1='formatted_address,geometry,place_id';
  var input=`${t.name}%${t.city}%${t.state_name}`
  var full_url=`${url1}key=${key}&fields=${fields1}&inputtype=textquery&input=${input}`;
  var url2='https://maps.googleapis.com/maps/api/place/details/json?';
  var fields2='formatted_phone_number,website';
  let result;
  fetch(full_url)
  .then(res => res.json())
  .then( place => {
    result=place.candidates[0];
    var full_url2=`${url2}key=${key}&fields=${fields2}&inputtype=textquery&placeid=${result.place_id}`;
    fetch(full_url2)
    .then(res2 => res2.json())
    .then( deets => {
      var details=deets.result;
      Object.keys(details).forEach(key => result[key] = details[key]);
      resolve(result);
    });
  });
}

theaters.post('/alter_theater', jsonParser, (req,res) => {
  const th=req.body;
  const update = new Promise( (resolve, reject) => update_theater(th, resolve, reject));
  update.then( data => res.json({ data }) );
});

function update_theater(th, resolve, reject){
  var query = q.theater_update(th);
  var values = [ th.value, th.theater_id ];
  var pool = new Pool(creds);
  pool.query(query, values, (err, _res) => {
    var data=_res.rows;
    pool.end();
    resolve(data);
  });
}

const get_theaters = ( tid, res ) => {
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

theaters.get_theaters=get_theaters;
module.exports = theaters;