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

//log ip and location info
locations.post('/logip', jsonParser, (req, res) => {
  let b=req.body;
  let is_logged=new Promise( (resolve,reject) => check_client(b.IPv4,resolve,reject) );
  is_logged.then( id => {
    if (id) {
      res.json({ client_id: id });
    } else {
      let statep=new Promise( (resolve,reject) => get_state(b.state,resolve,reject) );
      statep.then( state => {
        b.state_id=state;
        let ap = [
                    new Promise( (resolve,reject) => get_city(b.city,state,resolve,reject) ),
                    new Promise( (resolve,reject) => get_country(b.country_code,0,resolve,reject) )
                  ];
        Promise.all(ap).then( vals => {
          b.city_id=vals[0];
          b.country_id=vals[1].country_id;
          let client = new Promise( (resolve,reject) => save_client(b,resolve,reject) );
          client.then( id => res.json({ client_id: id.client_id }) );
        });
      });
    }
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

const get_state = (state_name,resolve,reject) => {
  var pool = new Pool(creds);
  pool.query(q.state_get_by_name(), [state_name], (err, _res) => {
    if (err) reject(err);
    if (_res.rowCount === 0) {
      resolve(0);
    } else {
      pool.end();
      resolve(_res.rows[0].id);
    }
  });
};

const get_country = (country,field,resolve,reject) => {
  var pool = new Pool(creds);
  pool.query(q.country_get(field), [country], (err, _res) => {
    if (err) reject(err);
    if (_res.rowCount === 0) {
      resolve(0);
    } else {
      pool.end();
      resolve(_res.rows[0]);
    }
  });
};

const save_client = (info,resolve,reject) => {
  var pool = new Pool(creds);
  var query=q.save_client();
  var vals = [  info.IPv4 ? info.IPv4 : null,
                info.city_id? info.city_id : null,
                info.state_id? info.state_id : null,
                info.country_id? info.country_id : null,
                info.postal? info.postal : null,
                info.latitude? info.latitude : null,
                info.longitude? info.longitude : null
              ];
  pool.query(query,vals,(err, _res) => {
    pool.end();
    if (err) reject(err);
    if (_res.rowCount) resolve(_res.rows[0]);
  });
};

const check_client = (ip,resolve,reject) => {
  var pool = new Pool(creds);
  var query=q.get_client();
  var vals=[ip];
  pool.query(query,vals,(err, _res) => {
    pool.end();
    if (err) reject(err);
    if (_res && _res.rowCount) {
      resolve(_res.rows[0].client_id);
    } else {
      resolve(null);
    }
  });
};

locations.get_city=get_city;

module.exports = locations;