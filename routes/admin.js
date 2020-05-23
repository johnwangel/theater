var express = require('express');
var admin = express.Router();

const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

admin.get('/clients',function(req,res){
  var pool = new Pool(creds);
  var query= q.get_clients();
  pool.query(query, (err, _res) => {
    pool.end();
    if (err || !_res || !_res.rows) resolve({error: 'An error occurred.'})
    var data=_res.rows;
    res.json(data);
  });
});

module.exports = admin;