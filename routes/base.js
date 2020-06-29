var express = require('express');
var base = express.Router();

const Moment = require('moment');

const fetch=require('node-fetch');

const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;



base.get('/', (req,res) => {
  if (!req.query.type) res.json({status: 'ok'});
  var id, type=req.query.type;
  var client_id=(req.query.client !=='undefined') ?  client_id=req.query.client : 0;
  req.query.id ? id=req.query.id : id=1;
  const prom = new Promise( (resolve, reject ) => get_data( type, id, resolve, reject, client_id ) );
  prom.then( data => res.json({ data, id }) );
});

const get_data = ( type, id, resolve, reject, client_id ) => {
  var query,val;
  var click={ client_id, theater: id };
  let date=Moment.utc().format('YYYY-MM-DD');
  switch (type){
    case 'alltheaters':
      query=q.theaters_all('100');
      break;
    case 'theater':
      const checkIt = new Promise( (resolve, reject ) => checkClick( click, resolve, reject ) );
      checkIt.then( found => { if(!found) saveClick(click); });
      query=q.theater(id);
      val=[id];
      break;
    case 'all_shows':
      query=q.shows();
      break;
    case 'venues_by_theater':
      query=q.venues_by_theater();
      val=[id];
      break;
    case 'venue_by_production':
      query=q.venue_by_production();
      val=[id];
      break;
    case 'venues_all':
      query=q.venues_all();
      break;
    case 'book':
    case 'lyrics':
    case 'music':
    case 'playwright':
      query=q.artist(id,type,'show','id');
      val=[id];
      break;
    case 'directors':
    case 'choreographers':
    case 'music_directors':
      query=q.artist(id,type,'production','production_id');
      val=[id];
      break;
    case 'all_directors':
    case 'all_choreographers':
    case 'all_mds':
    case 'all_artists':
      query=q.staff(type);
      break;
  }
  var pool = new Pool(creds);
  pool.query(query, val, (err, _res) => {
    if ( _res && _res.rows ){
      var data=_res.rows;
    } else {
      data: { error: 'no rows returned' }
    }
    pool.end();
    resolve(data);
  });
};

function saveClick(data){
  let query = q.add_click(data.client_id);
  let values = [ data.theater ];
  if (data.client_id!==0) values.unshift(data.client_id);
  var poolc = new Pool(creds);
  poolc.query(query, values, (err, _res) => {
    poolc.end();
    (err) ? console.log(err) : console.log('click saved');
  });
}

function checkClick(data,resolve,reject){
  var query=q.check_click();
  var vals = [data.theater];
  var pool = new Pool(creds);
  pool.query(query, vals, (err, _res) => {
    pool.end();
    if(err) {
      console.log(err);
      resolve(false);
    } else if (_res && _res.rows[0] ) {
      resolve(true);
    } else {
      resolve(false);
    }
  });

}


// var proms =[];
// var pool = new Pool(creds);
// var query = 'insert into country (name,code2,code3,codenum) VALUES ($1,$2,$3,$4);';
// countries.forEach( item => {
//   const p = new Promise( (resolve,reject) => insert_it(item,resolve,reject));
//   proms.push(p);
// });
// function insert_it(item,resolve,reject){
//   pool.query(query, item, (err, _res) => {
//     if (err) console.log(err);
//     resolve('ok');
//   });
// }
//Promise.all(proms).then( vals => pool.end() );

base.get_data=get_data;

module.exports = base;