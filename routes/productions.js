var express = require('express');
var prods = express.Router();

const { save_artists } = require('./artists');

const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

prods.get('/',function(req,res){
  var thtr_id;
  req.query.id ? thtr_id=req.query.id : thtr_id=1;
  var query = q.states();
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    var data=_res.rows;
    pool.end();
    res.json({ data });
    return;
  });
});

prods.post('/addprod', jsonParser, (req,res) => {
  const body=req.body;
  var theater_id;
  for (key in body) if (body[key]==='Submit Production') theater_id=key;

  const prod = {};
  prod.theater_id=theater_id;
  prod.start_date=body.start_date_1;
  prod.end_date=body.end_date_1;
  (body.cast_1) ? prod.cast_list=body.cast_1 : prod.cast_list='';
  (body.description_1) ? prod.description=body.description_1.replace(/'/g, "''") : prod.description='';
  (body.show_select) ? prod.show_id=body.show_select : prod.show_id=null;
  (body.venue_by_theater) ? prod.venue_id=body.venue_by_theater : prod.venue_id=null;

  let values = [ prod.theater_id, prod.show_id, prod.venue_id, prod.start_date, prod.end_date, prod.cast_list, prod.description ]
  var pool = new Pool(creds);
  var query=q.production_save();
  pool.query(query, values, (err, _res) => {
    pool.end();
    let production_id=_res.rows[0].production_id;
    const artists = process_artists( body )
    const save_them = new Promise ( (resolve,reject) => save_artists (artists, null, production_id, resolve, reject ) );
    pool=new Pool(creds);
    var query=q.production();
    let val=[production_id]
    pool.query(query, val, (err, _res) => {
      var new_prod = _res.rows[0];
      pool.end();
      res.json(_res.rows[0]);
    })
  });
});


prods.post('/editprod', jsonParser, (req,res) => {
  const body=req.body;
  const pid=parseInt(body.prod_id);
  const prod={
                prod_id: pid,
                show_id: (body.show_select) ? parseInt(body.show_select) : null,
                venue_id: (body.venue_by_theater) ? parseInt(body.venue_by_theater) : null,
                start_date: (body.start_date_1) ? body.start_date_1 : null,
                end_date: (body.end_date_1) ? body.end_date_1 : null,
                cast_list: (body.cast_1) ? body.cast_1.replace(/'/g, "''") : '',
                description: (body.description_1) ? body.description_1.replace(/'/g, "''") : '',
              };

  const values = [ prod.show_id, prod.venue_id, prod.start_date, prod.end_date, prod.cast_list, prod.description, prod.prod_id  ]
  const query = q.production_update( prod );
  const artists = process_artists( body )
  const show_promise = new Promise( (resolve, reject) => save_artists( artists, null, pid, resolve, reject ) );
  show_promise.then( done => {
    var pool = new Pool(creds);
    pool.query(query, values, (err, _res) => {
      var query=q.production();
      let val=[pid];
      pool.query(query, val, (err, _res) => {
        pool.end();
        res.json(_res.rows[0]);
      })
    })
  })
});

module.exports = prods;