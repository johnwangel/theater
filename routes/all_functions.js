var express = require('express');
var functions = express.Router();

const { get_data } = require('./base');
const { artists_by_type } = require('./artists');

const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;


functions.getArtistsForOneProduction = ( sid, pid, resolve, reject ) => getArtists(sid, pid, resolve, reject);

function getArtists(sid, pid, resolve, reject){
  const show_artists=new Promise( (res1, rej1 ) => artists_by_type( sid, 1, res1, rej1 ) );
  const prod_artists=new Promise( (res2, rej2 ) => artists_by_type( pid, 2, res2, rej2 ) );
  const venue=new Promise( (res3, rej3 ) => get_data( 'venue_by_production', pid, res3, rej3 ) );
  Promise.all([show_artists,prod_artists,venue])
  .then( d => {
    let artists={ ...d[0], ...d[1] };
    let venue=d[2];
    resolve( {  artists, venue })
  });
}

functions.getOneProduction = ( pid, resolve, reject) => {
  let query=q.production(), val=[pid];
  var pool = new Pool(creds);
  pool.query(query, val, (err, _res) => {
    pool.end();
    if (err || !_res || !_res.rows) resolve({error: 'An error occurred.'})
    var data=_res.rows[0];
    console.log('prod',data)
    let data_promise=new Promise( (resolve, reject ) => getArtists(data.show_id,data.production_id,resolve,reject) );
    data_promise.then( d => {
      data.artists=d.artists;
      data.venue=d.venue;
      resolve( data );
    });
  });
}

functions.processBlockText = (txt) => {
  txt.replace(/'/g, '&rsquo;')
  var lf = String.fromCharCode(10);
  var res = txt.split(lf);
  var newtxt = res.join('</p><p>');
  const regex = RegExp('<p>.*?<\/p>$');
  if(!regex.test(txt)) txt=`<p>${txt}</p>`;
  return newtxt;
}

module.exports = functions;