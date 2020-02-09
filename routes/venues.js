var express = require('express');
var venues = express.Router();

const { get_data } = require('./base');
const { save_artists } = require('./artists');
const { get_theaters } = require('./theaters');
const { get_city } = require('./locations');

const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

venues.post('/updateVenue', jsonParser, (req,res) => {
  const body=req.body;
  const venue={ tid : body.tid };
  (body.vid) ? venue.vid=body.vid : venue.vid=0;
  (body.venue_name_1) ? venue.name=body.venue_name_1.replace(/'/g, "''") : venue.name='';
  (body.venue_add1_1) ? venue.address1=body.venue_add1_1.replace(/'/g, "''") : venue.address1='';
  (body.venue_add2_1) ? venue.address2=body.venue_add2_1.replace(/'/g, "''") : venue.address2='';
  (body.venue_zip_1) ? venue.zip=body.venue_zip_1 : venue.zip='';
  (body.venue_phone_1) ? venue.phone=body.venue_phone_1 : venue.phone='';
  (body.venue_directions_1) ? venue.directions=body.venue_directions_1.replace(/'/g, "''") : venue.directions='';

  if (body.venue_city_1 && body.venue_state) {
    cityPromise = new Promise( (resolve, reject) => get_city( body.venue_city_1, parseInt(body.venue_state), resolve, reject ) );
    cityPromise
    .then( result => {
      venue.city_id=result;
      process(res);
    });
  } else {
    process(res);
  }

  function process(res){
    switch (body.venue_type){

      case 1:  //associate
        var prom = new Promise( (resolve, reject) => associate_venue(venue,resolve,reject) );
        prom.then( result => get_theaters(venue.tid,res) )
        break;

      case 2:  //update
        var prom = new Promise( (resolve, reject) => update_venue(venue,resolve,reject) );
        prom.then( result => {
          get_theaters(venue.tid,res)
        })
        break;

      case 3:   //new
        var prom = new Promise( (resolve, reject) => add_venue(venue,resolve,reject) );
        prom
        .then( result => {
          venue.vid=result;
          var prom2 = new Promise( (resolve, reject) => associate_venue(venue,resolve,reject) );
          prom2.then( result => get_theaters(venue.tid,res) )
        })
        break;

      case 4: //delete
        venue.vid=body.vid;
        var prom = new Promise( (resolve, reject) => remove_venue(venue,resolve,reject) );
        prom.then( result => get_theaters(venue.tid,res) )
        break;
    }
  }
});

function associate_venue(venue, resolve, reject){
  var query=q.venue_theater_save(venue);
  var values=[ venue.tid, venue.vid ];
  var poolx = new Pool(creds);
  poolx.query(query, values, (err, _res) => {
    poolx.end();
    (err) ? reject(err) : resolve(_res.rows[0].theater_venue_id);
  });
}

function add_venue(venue, resolve, reject ){
  const vsq=q.venue_save();
  const values = [ venue.name, venue.address1, venue.address2, venue.city_id, venue.zip, venue.phone, venue.directions ];
  var pool = new Pool(creds);
  pool.query(vsq, values, (err, _res) => {
    pool.end();
    (err) ? reject(err) : resolve(_res.rows[0].id);
  });
}

function update_venue(venue, resolve, reject ){
  var vsq=q.venue_update();
  var values = [ venue.name, venue.address1, venue.address2, venue.city_id, venue.zip, venue.phone, venue.directions, venue.vid ];
  var pool = new Pool(creds);
  pool.query(vsq, values, (err, _res) => {
    pool.end();
    console.log(_res);
    (err) ? reject(err) : resolve(_res.rows[0]);
  });
}

function remove_venue(venue, resolve, reject){
  var vsq=q.venue_remove();
  var val=[venue.tid,venue.vid]
  var pool = new Pool(creds);
  pool.query(vsq, val, (err, _res) => {
    pool.end();
    (err) ? reject(err) : resolve(_res.rows[0]);
  })
}

function delete_venue(venue, resolve, reject){
  var vsq=q.venue_delete();
  var val=[venue.vid]
  var pool = new Pool(creds);
  pool.query(vsq, val, (err, _res) => {
    pool.end();
    (err) ? reject(err) : resolve(_res.rows[0]);
  })
}

module.exports = venues;