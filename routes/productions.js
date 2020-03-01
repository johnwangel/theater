var express = require('express');
var prods = express.Router();

const { get_data } = require('./base');
const { save_artists, get_artists, process_artists, artists_by_type} = require('./artists');

const { getArtistsForOneProduction }= require('./all_functions');

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

prods.get('/byCompany',function(req,res){
  let thtr_id = (req.query.id && req.query.id !== 'undefined') ? req.query.id : 1;
  let query=q.productions(), val=[thtr_id], all_promises = [];

  var pool = new Pool(creds);
  pool.query(query, val, (err, _res) => {
    pool.end();

    if (err || !_res || !_res.rows ) res.json({ error : "There was an error." });
    var data=_res.rows;
    data.forEach( (item, index) => {
      let production_promise=new Promise( (resolve, reject ) => {
          let data_promise=new Promise( (resolve, reject ) => getArtistsForOneProduction(item.show_id,item.production_id,resolve,reject) );
          data_promise.then( d => {
            data[index].artists=d.artists;
            data[index].venue=d.venue;
            resolve('ok');
          });
        });
      all_promises.push(production_promise);
    });
    Promise.all(all_promises).then( q => res.json({ data }) );
  });
});

prods.get('/byShow',function(req,res){
  var show_id = [ req.query.id ];
  var query = q.find_productions_by_show();
  //console.log(query)

  var pool = new Pool(creds);
  pool.query(query, show_id, (err, _res) => {
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
  (body.cast_1) ? prod.cast_list=processBlockText(body.cast_1) : prod.cast_list='';
  (body.description_1) ? prod.description=processBlockText(body.description_1) : prod.description='';
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
    let val=[production_id];
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
                cast_list: (body.cast_1) ? processBlockText(body.cast_1) : '',
                description: (body.description_1) ? processBlockText(body.description_1) : '',
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
        if (err) res.json({error: 'An error occurred.'})
        var data=_res.rows[0]
        let data_promise=new Promise( (resolve, reject ) => getArtistsForOneProduction(prod.show_id,prod.prod_id,resolve,reject) );
        data_promise.then( d => {
          data.artists=d.artists;
          data.venue=d.venue;
          res.json(data);
        });
      })
    })
  })
});

function processBlockText(txt){
  txt.replace(/'/g, '&rsquo;')
  var lf = String.fromCharCode(10);
  var res = txt.split(lf);
  var newtxt = res.join('</p><p>');
  const regex = RegExp('<p>.*?<\/p>$');
  if(!regex.test(txt)) txt=`<p>${txt}</p>`;
  return newtxt;
}

module.exports = prods;