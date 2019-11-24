var express = require('express');
var locations = express.Router();

const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

locations.get('/states',function(req,res){
  var query = q.states();
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    pool.end();
    if (err) return res.json({ error: err });
    var data=_res.rows;
    res.json({ data });
    return;
  });
});

const get_city = (city,state_id,resolve,reject) => {
  var pool = new Pool(creds);
  var cityg=q.city_get();
  var vals=[city,state_id]
  pool.query(cityg, vals, (err, _res) => {
    if (_res.rowCount === 0) {
      citys=q.city_save();
      pool.query(citys, vals, (err, _res) => {
        pool.end();
        resolve(_res.rows[0].city_id)
      })
    } else {
      pool.end();
      resolve(_res.rows[0].city_id);
    }
  })
}

locations.get_city=get_city;

module.exports = locations;