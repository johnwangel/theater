var express = require('express');
var shows = express.Router();

const { get_data } = require('./base');
const { save_artists } = require('./artists');

const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

shows.post('/addshow', jsonParser, (req,res) => {
  const body=req.body;
  const show={ description: '' };
  (body.show_title_1) ? show.title=body.show_title_1.replace(/'/g, "''") : show.title="";
  (body.genre_1) ? show.genre=body.genre_1 : show.genre=2;
  var pool = new Pool(creds);
  var query=q.show_save(show);
  const values = [ show.title, show.genre, show.description ];
  pool.query(query, values, (err, _res) => {
    pool.end();
    const artists = process_artists( body )
    const show_promise = new Promise( (resolve, reject) => save_artists( artists, _res.rows[0].id, null, resolve, reject ) );
    show_promise
    .then( done => {
      const prom1 = new Promise( (resolve, reject ) => get_data( 'all_shows', null, resolve, reject ) );
      const prom2 = new Promise( (resolve, reject ) => get_data( 'all_artists', null, resolve, reject ) );
      Promise.all([prom1,prom2])
      .then( data => {
        res.json({ shows: data[0], artists: data[1] })
      })
    })
  });
})

shows.post('/editshow', jsonParser, (req,res) => {
  const body=req.body;
  const sid=parseInt(body.show_id);
  const show={  title: body.show_title.replace(/'/g, "''"),
                genre: parseInt(body.genre_1),
                description: '',
                show_id: sid
              };

  const values = [ show.title, show.genre, show.description, show.show_id ];
  const query = q.show_update();
  const artists = process_artists( body )
  const show_promise = new Promise( (resolve, reject) => save_artists( artists, sid, null, resolve, reject ) );
  show_promise.then( done => {
    var pool = new Pool(creds);
    pool.query(query, values, (err, _res) => {
      pool.end();
      const prom1 = new Promise( (resolve, reject ) => get_data( 'all_shows', null, resolve, reject ) );
      const prom2 = new Promise( (resolve, reject ) => get_data( 'all_artists', null, resolve, reject ) );
      Promise.all([prom1,prom2])
      .then( data => {
        res.json({ shows: data[0], artists: data[1] })
      });
    });
  });
});

module.exports = shows;