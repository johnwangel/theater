var express = require('express');
var search = express.Router();
const Moment = require('moment');
const fetch=require('node-fetch');
const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const s = require('../queries/searches.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });


search.post('/ByEvent',jsonParser, (req,res) => {
  var v=req.body;

  //saveSearch(req.body);

  let _start=Moment(v.start_date_1).parseZone().format('YYYY-MM-DD');
  let _end = Moment(v.end_date_1).parseZone().format('YYYY-MM-DD');
  let _type = (v.eventtype_1) ? parseInt(v.eventtype_1) : null;
  let _free = (v.free_only) ? true : null;
  const values=[ _start, _end];
  if (_type) values.push(_type);

  const search=s.search_event(_type,_free);

  var pool = new Pool(creds);
  pool.query(search, values, (err, _res) => {

    pool.end();
    if (err || _res.rowCount === 0 ){
     res.json({ theaters: [], count: 0, startAt: req.body.startAt});
    } else {
      let return_data={ theaters: _res.rows, count: _res.rowCount, startAt: req.body.startAt };
      res.json(return_data);
    }
  })
});

search.post('/ByTheater',jsonParser, (req,res) => {
  saveSearch(req.body);
  const values=[ `%${req.body.theater}%` ];
  var search=q.find_theater();
  var pool = new Pool(creds);
  pool.query(search, values, (err, _res) => {
    pool.end();
    if (err || _res.rowCount === 0 ){
     res.json({ theaters: [], count: 0, startAt: req.body.startAt});
    } else {
      let thtrs=_res.rows;
      let thtr_count=_res.rowCount;
      let return_data={ theaters: thtrs, count: thtr_count, startAt: req.body.startAt };
      res.json(return_data);
    }
  })
});

search.post('/ByShow',jsonParser, (req,res) => {
  saveSearch(req.body);
  const values=[ `%${req.body.show}%` ];
  var pool = new Pool(creds);
  var search=q.find_shows();
  pool.query(search, values, (err, _res) => {
    pool.end();
    if (err || _res.rowCount === 0 ){
     res.json({ theaters: [], count: 0, startAt: req.body.startAt});
    } else {
      let thtrs=_res.rows;
      let thtr_count=_res.rowCount;
      let return_data={ theaters: thtrs, count: thtr_count, startAt: req.body.startAt };
      res.json(return_data);
    }
  })
});

search.post('/ByCity',jsonParser, (req,res) => {
  const b=req.body;
  saveSearch(b);
  let data={};
  data.startAt=b.startAt;
  data.city=b.city;
  data.distance=b.distance;
  var state = b.state.split('-');
  data.state=state[0];
  data.state_name=state[1];
  const city_promise = new Promise( (resolve, reject ) => get_city( data, resolve, reject ) );
  city_promise.then( city_info => {
    data = { ...data, ...city_info };
    if (data.location_lat && data.location_lng) {
      const srch_promise = new Promise ( (resolve,reject) => find_theaters(data,resolve,reject) );
      srch_promise.then( theater_info => res.json(theater_info));
    } else {
      const ckgeo_promise = new Promise( (resolve, reject ) => check_geo( data, resolve, reject ) );
      ckgeo_promise.then( geo_info => {
        data = { ...data, ...geo_info  };
        const srch_promise = new Promise ( (resolve,reject) => find_theaters(data,resolve,reject) );
        srch_promise.then( theater_info => res.json(theater_info));
      })
    }
  })
});

function check_geo(data,resolve,reject){
  const geo_promise = new Promise( (resolve, reject ) => getGeometry( data, resolve, reject ) );
  geo_promise.then( results => resolve(results) )
  .catch(error => res.json({ message: 'failed' }));
}

function get_city(data,resolve,reject){
  const city_inf = {};
  var query=q.city_get();
  let values = [ data.city, data.state ];
  var pool = new Pool(creds);
  pool.query(query, values, (err, _res) => {
      if (err) reject('error')
      if (_res.rowCount === 0) {
        citys=q.city_save();
        pool.query(citys, values, (err, _res) => {
          pool.end();
          city_inf.id = _res.rows[0].city_id;
          resolve(city_inf);
        })
      } else {
        pool.end();
        if (_res.rows[0].location_lat) city_inf.location_lat=_res.rows[0].location_lat;
        if (_res.rows[0].location_lng) city_inf.location_lng=_res.rows[0].location_lng;
        city_inf.id = _res.rows[0].city_id;
        resolve(city_inf);
      }
  })
}

function find_theaters(data,resolve,reject){
  let return_data={ theaters: [], count: 0, startAt: data.startAt, prods: [] }
  let srch=q.location_search();
  var pools = new Pool(creds);
  var vals=[data.location_lat,data.location_lng,data.distance];
  pools.query(srch, vals, (err, _res) => {
    pools.end();
    if (err){
     resolve(return_data);
    } else {
      return_data.count = _res.rowCount;
      return_data.theaters = _res.rows.slice(25*data.startAt,25*(data.startAt+1));
      const promise_list=[];
      return_data.theaters.forEach( t => {
        const promise = new Promise( (resolve, reject ) => getUpcoming( t.id, resolve, reject ) );
        promise_list.push(promise);
      })
      Promise.all(promise_list).then( vals => {
        return_data.prods=vals;
        resolve(return_data);
      })
    }
  });
}

const g_findplace_url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?';
const g_findplace_type= '&inputtype=textquery';
//const fields = '&fields=formatted_address,name,geometry,place_id';
const gurl = 'https://maps.googleapis.com/maps/api/place/details/json?';
//const fields = '&fields=formatted_phone_number,website';
const api = tokens.google_api_key;

function getGeometry(data, resolve, reject){
  //https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Museum%20of%20Contemporary%20Art%20Australia&inputtype=textquery&fields=photos,formatted_address,name,rating,opening_hours,geometry&key=YOUR_API_KEY
  let input=`input=${data.city} ${data.state_name}`;
  input.replace(/ /g,'%');
  let fields = '&fields=geometry';
  let url=`${g_findplace_url}${input}${g_findplace_type}${fields}&key=${api}`;

  fetch(url)
  .then(res => res.json())
  .then(json => {
    const values=[
      String(json.candidates[0].geometry.location.lat),
      String(json.candidates[0].geometry.location.lng),
      String(json.candidates[0].geometry.viewport.northeast.lat),
      String(json.candidates[0].geometry.viewport.northeast.lng),
      String(json.candidates[0].geometry.viewport.southwest.lat),
      String(json.candidates[0].geometry.viewport.southwest.lng),
      data.city_id
    ];
    geoq=q.geometry_save();
    var poolc = new Pool(creds);
    poolc.query(geoq, values, (err, _res) => {
      poolc.end();
      (err) ? reject(err) : resolve(_res.rows[0]);
    });
  });
}

function saveSearch(data){
  let query = q.save_search();
  let values = [
    (data.client) ? data.client : null,
    (data.city) ? data.city : null,
    (data.state) ? parseInt(data.state.split('-')[0]) : null,
    (data.distance) ? parseInt(data.distance) : null,
    (data.theater) ? data.theater : null,
    (data.show) ? data.show : null
  ];

  var poolc = new Pool(creds);
  poolc.query(query, values, (err, _res) => {
    poolc.end();
    (err) ? console.log(err) : console.log('search saved');
  });
}

function getUpcoming( t, resolve, reject ){
  var pool = new Pool(creds);
  var prod=q.upcoming_production();
  var val=[t]
  pool.query(prod, val, (err, _res) => {
    if (err || _res.rows.rowCount === 0 ){
        resolve([]);
      } else {
        resolve(_res.rows);
      }
  })
}

search.find_theaters=find_theaters;

module.exports = search;