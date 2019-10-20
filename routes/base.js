var express = require('express');
var base = express.Router();

const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

base.get('/', (req,res) => {
  var id, type=req.query.type;
  req.query.id ? id=req.query.id : id=1;
  const prom = new Promise( (resolve, reject ) => get_data( type, id, resolve, reject ) );
  prom.then( data => res.json({ data, id }) );
});

const get_data = ( type, id, resolve, reject ) => {
  var query,val;
  switch (type){
    case 'theater':
      query=q.theater(id);
      val=[id];
      break;
    case 'productions':
      query=q.productions(id);
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
}

base.get_data=get_data;

module.exports = base;