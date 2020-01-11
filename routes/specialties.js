var express = require('express');
var specialties = express.Router();

const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

specialties.get('/',function(req,res){
  var query = q.all_specialties();
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    pool.end();
    if (err) return res.json({ error: err });
    let data = _res.rows;
    res.json({ data });
    return;
  });
});

module.exports = specialties;