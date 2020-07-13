var express = require('express');
var events = express.Router();

const { processBlockText }= require('./all_functions');


const fetch=require('node-fetch');
const bodyParser = require('body-parser');
const q = require('../queries/events.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

events.get('/types/',function(req,res){
  var query=q.event_types();
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    pool.end();
    if (err || _res.rowCount === 0 ){
     res.json({ error : 'There was an error.' });
    } else {
      res.json(_res.rows);
    }
  });
});

events.post('/addevent', jsonParser, (req,res) => {
  const ev=req.body;
  var query=q.create_event();
  const values = [
    (ev.event_title_1) ? ev.event_title_1 : null,
    ev.theater_id,
    (ev.show_select !=='0') ? ev.show_select : null,
    ev.eventtype_1,
    ev.description_1,
    ev.start_date_1,
    (ev.time) ? ev.time : null,
    (ev.onetime) ? true : false,
    (!ev.onetime) ? ev.end_date_1 : ev.start_date_1,
    ev.event_link_1,
    (ev.event_info_link_1) ? ev.event_info_link_1 : null,
    (ev.free) ? true : false
  ];
  var pool = new Pool(creds);
  pool.query(query, values, (err, _res) => {
    if (err) {
      console.log(err);
      res.json({ error: 'Unable to save.'});
      return;
    }
    let prom = new Promise( (resolve, reject ) => get_events_by_theater( ev.theater_id, resolve, reject ) );
    prom.then( e => res.json(e) );
  });
});

events.post('/editevent', jsonParser, (req,res) => {
  const ev=req.body;
  var query=q.update_event();

  const values = [
    ev.event_id,
    (ev.event_title_1) ? ev.event_title_1 : null,
    (ev.show_select !=='0') ? ev.show_select : null,
    ev.eventtype_1,
    processBlockText(ev.description_1),
    ev.start_date_1,
    (ev.time) ? ev.time : null,
    (ev.onetime) ? true : false,
    (!ev.onetime) ? ev.end_date_1 : ev.start_date_1,
    ev.event_link_1,
    (ev.event_info_link_1) ? ev.event_info_link_1 : null,
    (ev.free) ? true : false
  ];


  console.log('event',values)

  var pool = new Pool(creds);
  pool.query(query, values, (err, _res) => {
    if (err) {
      console.log(err);
      res.json({ error: 'Unable to save.'});
      return;
    }
    let prom = new Promise( (resolve, reject ) => get_events_by_theater( ev.theater_id, resolve, reject ) );
    prom.then( e => res.json(e) );
  });
});

events.get('/byCompany', (req,res) => {
  let thtr_id = (req.query.id && req.query.id !== 'undefined') ? req.query.id : 1;
  let prom = new Promise( (resolve, reject ) => get_events_by_theater( thtr_id, resolve, reject ) );
  prom.then( e => res.json(e) );
});

function get_events_by_theater(tid,resolve,reject){
  let query=q.get_events_by_theater();
  var pool = new Pool(creds);
  pool.query(query, [tid], (err, _res) => {
    pool.end();
    if (err) res.json({ error: 'Unable to save.'});
    if (_res.rows) resolve(_res.rows);
  })
}

module.exports = events;