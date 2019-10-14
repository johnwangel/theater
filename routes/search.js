var express = require('express');
var search = express.Router();

const fetch=require('node-fetch');
const bodyParser = require('body-parser');
const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

search.post('/ByCity',jsonParser, (req,res) => {
  const b=req.body;
  const data={};

  data.city=b.city;
  data.distance=b.distance;
  var state = b.state.split('-');
  data.state=state[0];
  data.state_name=state[1];

  let values = [data.city,data.state];

  var pool = new Pool(creds);
  var cityg=q.city_get();
    pool.query(cityg, values, (err, _res) => {
      if (_res.rowCount === 0) {
        citys=q.city_save();
        pool.query(citys, values, (err, _res) => {
          data.city_id = _res.rows[0].city_id;
          check_geo();
          pool.end();
        })
      } else {
        if (_res.rows[0].location_lat) data.location_lat=_res.rows[0].location_lat;
        if (_res.rows[0].location_lng) data.location_lng=_res.rows[0].location_lng;
        data.city_id=_res.rows[0].city_id;
        check_geo();
        pool.end();
      }
    })

    function check_geo(){
      if (data.location_lat && data.location_lng){
        find_theaters();
      } else {
        const geo_promise = new Promise( (resolve, reject ) => getGeometry( data, resolve, reject ) );
        geo_promise.then( results => {
            data.location_lat=results.location_lat;
            data.location_lng=results.location_lng;
            find_theaters();
        })
        .catch(error => res.json({ message: 'failed' }));
      }
    }

    function find_theaters(){
      let srch=q.location_search();
      var pools = new Pool(creds);
      var vals=[data.location_lat,data.location_lng,data.distance];
      pools.query(srch, vals, (err, _res) => {
        var new_data=_res.rows;
        pools.end();
        res.json(new_data);
      });
    }
});

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

module.exports = search;