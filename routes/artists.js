var express = require('express');
var artists = express.Router();

const { get_data } = require('./base');

const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

artists.get('/',function(req,res){
  const id=req.query.id;
  const type=parseInt(req.query.type);
  const artists=new Promise( (resolve, reject ) => artists_by_type(id, type, resolve, reject ) );
  artists.then( data => res.json(data));
});

artists.post('/addartist', jsonParser, (req,res) => {
  const body=req.body;
  const values=[ body.fname.replace(/'/g, "&rsquo;"), body.lname.replace(/'/g, "&rsquo;")]
  var query=q.artist_save();
  if (body.editmode && body.artist_id !=='0'){
    values.push(body.artist_id);
    query=q.artist_update();
  }
  var pool = new Pool(creds);
  pool.query(query, values, (err, _res) => {
    pool.end();
    var newID=_res.rows[0].id;
    const prom = new Promise( ( resolve, reject ) => get_data( 'all_artists', null, resolve, reject ) );
    prom.then( data => res.json( { newID, artists: data } ) )
    return;
  });
});

artists.post('/remove_artist', jsonParser, (req,res) => {
  const body=req.body;
  const fromWhere=body.fromWhere;
  var tb;
  switch (body.type){
    case 'book':
      tb='book';
      break;
    case 'music':
      tb='music';
      break;
    case 'lyrics':
      tb='lyrics';
      break;
    case 'pw':
      tb='playwright';
      break;
    case 'dir':
      tb='directors';
      break;
    case 'chor':
      tb='choreographers';
      break;
    case 'md':
      tb='music_directors';
      break;
  }
  const data={  artist_id: body.artist_id,
                table_name: tb,
                field_name: body.assoc,
                assoc_id: body.assoc_id
              };
  let values = [ data.artist_id, data.assoc_id ];
  let query=q.unassociate_artist(data);

  var pool = new Pool(creds);
    pool.query(query, values, (err, _res) => {
      pool.end();
      if (err) res.json({ message : 'Sorry there was an error.'});
      let prom;
      switch( data.field_name ){
        case 'production':
          prom = new Promise( ( resolve, reject ) => getProduction(data.assoc_id,resolve,reject) );
          break;
        case 'show':
          prom = new Promise( ( resolve, reject ) => get_data( 'all_artists', null, resolve, reject ) );
          break;
      }
      prom.then( new_data => res.json({ data: new_data }) )
    });
});


const artists_by_type = (id, type, resolve, reject) => {
  let all_promises=[];
  let params;
  switch(type){
    case 1:
      params={ table: 'show', field: 'id', artists : ['book','lyrics','music','playwright'] };
      break;
    case 2:
      params={ table: 'production', field: 'production_id', artists : ['directors','choreographers','music_directors' ] };
      break;
  }
  params.artists.forEach( item => {
    const prom = new Promise( (resolve, reject ) => get_artists( id, item, params.table, params.field, resolve, reject ) );
    all_promises.push(prom);
  })
  Promise.all(all_promises)
  .then( data => {
    switch(type){
      case 1:
        resolve({ book: data[0], lyrics: data[1], music: data[2], pw: data[3] });
        break;
      case 2:
        resolve({ dir: data[0], chor: data[1], md: data[2] });
        break;
    }
  });
}

const get_artists = (id, type, table, field, resolve, reject ) => {
  query=q.artist(id,type,table,field);
  var pool = new Pool(creds);
  pool.query(query, [id], (err, _res) => {
    pool.end();
    if ( _res && _res.rows && _res.rows.length ){
      resolve(_res.rows);
    } else {
      resolve(null);
    }
  });
}

const save_artists = (artists, show_id, production_id, resolve, reject) => {
      const all_promises=[];
      for (key in artists){
      let arr = artists[key];

      arr.forEach( item => {
        let field='show_id', associaton_id=show_id,date=true,return_id=`${key}_id`;
        if ( key === 'directors' || key === 'choreographers' || key === 'music_directors'){
          field='production_id';
          associaton_id=production_id;
          date=false;
          return_id=`${key.slice(0, key.length-1)}_id`;
        }
        if (item.id){
          var query=q.check_artist_association( key, field );
          var vals=[ item.id, associaton_id ];
          const check = new Promise( (resolve2, reject2) => exists(query, vals, key, resolve2, reject2) );
          check.then( data => {
            if (data.exists) {
              resolve(data)
            } else {
              var query2=q.artist_to_show( data.table, field );
              var vals=[ item.id, associaton_id ];
              associate(query2,vals);
            }
          })
        } else {
          var query1=q.artist_save();
          var vals=[ item.fname, item.lname ];
          let this_key=key;
          const artist_promise = new Promise( (resolve1, reject1) => create(query1, vals, resolve1, reject1) );
          all_promises.push(artist_promise);
          artist_promise
          .then( aid => {
            var query2=q.artist_to_show( this_key, field );
            var vals= [ aid, associaton_id ];
            const ass_prom = new Promise ( (resolve, reject) => associate(query2, vals, resolve, reject) );
            all_promises.push(ass_prom);
          })
        }
      })
    }
    Promise.all(all_promises).then( res => {
      resolve('ok');
    })

    function exists(q, vals, table, resolve2, reject2){
      var pool = new Pool(creds);
      pool.query(q, vals, (err, _res) => {
        pool.end();
        if (_res.rows.length >0){
          resolve2( { exists: true } )
        } else {
          resolve2( { exists: false, table } )
        }
        return;
      })
    }

    function create(q, vals, resolve1, reject1){
      var pool = new Pool(creds);
      pool.query(q, vals, (err, _res) => {
        pool.end();
        resolve( _res.rows[0].id );
        return;
      })
    }

    function associate(q,vals){
      var pool = new Pool(creds);
      pool.query(q, vals, (err, _res) => {
        pool.end();
        if (_res.rows) {
          resolve( _res.rows[0] )
        } else {
          reject('no record')
        }
      })
    }
}

const process_artists = (body) => {
  const artist_ids={};
  const body_keys = Object.keys(body);
  const book=[], lyrics=[], music=[], playwright=[], directors=[], choreographers=[], music_directors=[];

  body_keys.forEach( key => {

    let k = key.split('_');

    switch (k[0]){
      case "sel":
      case "fname":
      case "lname":
        step2(key, k[0],k[1],parseInt(k[2]-1))
        break;
      default:
        break;
    }

    function step2 (key, t, a, i){
      switch (a){
        case "book":
          step3(book,key,t,i);
          break;
        case "music":
          step3(music,key,t,i);
          break;
        case "lyrics":
          step3(lyrics,key,t,i);
          break;
        case "pw":
          step3(playwright,key,t,i);
          break;
        case "dir":
          step3(directors,key,t,i);
          break;
        case "chor":
          step3(choreographers,key,t,i);
          break;
        case "md":
          step3(music_directors,key,t,i);
          break;
        default:
      }
    }

    function step3 (arr, key, t, i){
      if (t==='sel') {
        arr[i]={ id : body[key] };
      } else if (t==='fname') {
        (arr[i]) ? arr[i].fname=body[key] : arr[i]={ fname : body[key] };
      } else if (t==='lname') {
        (arr[i]) ? arr[i].lname=body[key] : arr[i]={ lname : body[key] };
      }
    }

  })
  return { book, lyrics, music, playwright, directors, choreographers, music_directors  }
}

getProduction = ( pid, resolve, reject) => {
  let query=q.production(), val=[pid];
  var pool = new Pool(creds);
  pool.query(query, val, (err, _res) => {
    pool.end();
    if (err || !_res || !_res.rows) resolve({error: 'An error occurred.'})
    var data=_res.rows[0]
    let data_promise=new Promise( (resolve, reject ) => getArtistsForProduction(data.show_id,data.production_id,resolve,reject) );
    data_promise.then( d => {
      data.artists=d.artists;
      data.venue=d.venue;
      resolve(data);
    });
  });
}

getArtistsForProduction = ( sid, pid, resolve, reject ) => {
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

artists.save_artists=save_artists;
artists.get_artists=get_artists;
artists.process_artists=process_artists;
artists.artists_by_type=artists_by_type;
module.exports = artists;