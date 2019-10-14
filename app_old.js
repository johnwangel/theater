const express = require('express');
const app = express();
const PORT = process.env.PORT || 3100;

app.use(express.static('public'));


const fetch=require('node-fetch');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session);
const client = redis.createClient();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jsonwebtoken = require("jsonwebtoken");
const saltRounds = 10;

require('./passport')();

var q = require('./queries/queries.js');
var tokens = require('./auth/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;
const secret = tokens.secret;


const auth = require('./routes/auth');
app.use('/auth', auth);



// const articles = require('./routes/articles');
// app.use('/articles', articles);




const g_findplace_url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?';
const g_findplace_type= '&inputtype=textquery';
//const fields = '&fields=formatted_address,name,geometry,place_id';
const gurl = 'https://maps.googleapis.com/maps/api/place/details/json?';
//const fields = '&fields=formatted_phone_number,website';
const api = tokens.google_api_key;

app.use(cookieParser());
app.use(
  session({
    store: new RedisStore({ client }),
    secret: secret,
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.static('public'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(function(req, res, next){
  if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT'){
    jsonwebtoken.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
      if (err) {
        req.user = undefined;
      }
      req.user = decode;
      next();
    });
  } else {
    req.user = undefined;
    next();
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth', (req, res) => {
  if (req.user){
    res.json( { user: req.user } )
  } else {
    return res.status(401).json({ message: "Unauthorized user!" });
  }
});

// var values =[
//     'owner@stagerabbit.com',
//     'Die4u678!',
//     '',
//     3,
//     'John',
//     'Atkins',
//     'CEO',
//     '9176975626'
//   ];

//   const pr = new Promise( (resolve, reject ) => make_user( values, '', resolve, reject ) );
//   pr.then(data => console.log(data));

//create and respond with new user
app.post('/api/register', jsonParser, (req, res) => {
  let b=req.body;
  let level=(b.account_type==='admin')?2:1;
  let tid=null;

  let values =[
    (b.username)?b.username:' ',
    (b.password)?b.password:' ',
    (b.token)?b.token:' ',
    level,
    (b.fname)?b.fname:' ',
    (b.lname)?b.lname:' ',
    (b.role)?b.role:' ',
    (b.phone)?b.phone:' '
  ];

  if (b.token) {
    const prom = new Promise( (resolve, reject ) => get_theater_by_token( token, resolve, reject ) );
    prom.then(data => {
      if (data.exists) {
        tid=data.values.id;
        cont();
      } else {
        cont();
      }
    });
  } else {
    cont();
  }

  const cont = () => {
    const prom2 = new Promise( (resolve, reject ) => make_user( values, tid, resolve, reject ) );
    prom2.then(data => res.json(data))
  }

});

function make_user( values, tid, resolve, reject ) {
  var query=q.create_user();
    bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash( values[1], salt, function(err, hash) {
          values[1]=hash;
          var pool = new Pool(creds);
          pool.query(query, values, (err, _res) => {
            if (err) {
              resolve(err);
            } else if (_res && _res.rows) {
              let user=_res.rows[0];
              user.jwt=jsonwebtoken.sign( { id: user.user_id, level: user.level, username: user.username, fname: user.fname, lname: user.lname, tid: tid }, 'RESTFULAPIs' );
              resolve(user);
            } else {
              resolve('ERROR');
            }
          });
        });
    });
}

//check login credentials
app.post('/api/login', jsonParser, ( req, res ) => {
  let query=q.get_user();
  let value = [req.body.username];
  var pool = new Pool(creds);
  pool.query(query, [req.body.username], ( err, _res ) => {
    pool.end();
    if ( _res && _res.rows ){
      const user=_res.rows[0];
      console.log('USER INFO',user);
      if(bcrypt.compareSync( req.body.password, user.password )){
        user.jwt=jsonwebtoken.sign( { id: user.user_id, level: user.level, username: user.username, fname: user.fname, lname: user.lname, tid: user.tid }, 'RESTFULAPIs' );
        return res.json(user);
      } else {
        res.status(401).json({ message: 'Authentication failed. Wrong password.'});
      }
    } else {
      res.status(401).json({ message: 'Authentication failed. User not found.'});
    }
  });
});

app.get('/api/logout', jsonParser, (req, res) => {
  req.logout()
  req.session.destroy();
  res.send( { message: 'Successfully logged out' } );
})

app.get('/', (req,res) => {
  var id, type=req.query.type;
  req.query.id ? id=req.query.id : id=1;
  const prom = new Promise( (resolve, reject ) => get_data( type, id, resolve, reject ) );
  prom.then( data => res.json({ data, id }) );
});

function get_data(type,id, resolve, reject){
  var query;
  switch (type){
    case 'theater':
      query=q.theater(id);
      break;
    case 'productions':
      query=q.productions(id);
      break;
    case 'all_shows':
      query=q.shows();
      break;
    case 'venues_by_theater':
      query=q.venues_by_theater(id);
      break;
    case 'venue_by_production':
      query=q.venue_by_production(id);
      break;
    case 'venues_all':
      query=q.venues_all();
      break;
    case 'book':
    case 'lyrics':
    case 'music':
    case 'playwright':
      query=q.artist(id,type,'show','id');
      break;
    case 'directors':
    case 'choreographers':
    case 'music_directors':
      query=q.artist(id,type,'production','production_id');
      break;
    case 'all_directors':
    case 'all_choreographers':
    case 'all_mds':
    case 'all_artists':
      query=q.staff(type);
      break;
  }
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    if ( _res && _res.rows ){
      var data=_res.rows;
    } else {
      data: { error: 'no rows returned' }
    }
    pool.end();
    resolve(data)
  });
}

app.get('/artists',function(req,res){

  const id=req.query.id;
  const type=parseInt(req.query.type);

  if (type===1){
    let table='show';
    let field='id';
    const book = new Promise( (resolve, reject ) => get_artists( id, 'book', table, field, resolve, reject ) );
    const lyrics = new Promise( (resolve, reject ) => get_artists( id, 'lyrics', table, field,  resolve, reject ) );
    const music = new Promise( (resolve, reject ) => get_artists( id, 'music', table, field, resolve, reject ) );
    const playwright = new Promise( (resolve, reject ) => get_artists( id, 'playwright', table, field, resolve, reject ) );
    Promise.all([book,lyrics,music,playwright])
    .then(data => {
      res.json({ book: data[0], lyrics: data[1], music: data[2], pw: data[3] });
    });
  } else if (type===2) {
    let table='production';
    let field='production_id';
    const dir = new Promise( (resolve, reject ) => get_artists( id, 'directors', table, field, resolve, reject ) );
    const chor = new Promise( (resolve, reject ) => get_artists( id, 'choreographers', table, field,  resolve, reject ) );
    const md = new Promise( (resolve, reject ) => get_artists( id, 'music_directors', table, field, resolve, reject ) );
    Promise.all([dir,chor,md])
    .then(data => {
      res.json({ dir: data[0], chor: data[1], md: data[2] });
    })
  }
});

function get_artists(id, type, table, field, resolve, reject ){
  query=q.artist(id,type,table,field);
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    pool.end();
    if ( _res && _res.rows ){
      resolve(_res.rows)
    } else {
      reject({ error: 'no rows returned' })
    }
  });
}

app.get('/states',function(req,res){
  var query = q.states();
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    var data=_res.rows;
    pool.end();
    res.json({ data });
    return;
  });
});

app.get('/productions',function(req,res){
  var thtr_id;
  req.query.id ? thtr_id=req.query.id : thtr_id=1;
  var query = q.states();
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    var data=_res.rows;
    pool.end();
    res.json({ data });
    return;
  });
});

app.post('/searchByCity',jsonParser, (req,res) => {
  const b=req.body;
  const data={};

  data.city=b.city;
  data.distance=b.distance;
  var state = b.state.split('-');
  data.state=state[0];
  data.state_name=state[1];

  var pool = new Pool(creds);
  var cityg=q.city_get(data.city,data.state);
    pool.query(cityg, (err, _res) => {
      if (_res.rowCount === 0) {
        citys=q.city_save(data);
        pool.query(citys, (err, _res) => {
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
        geo_promise.then( values => ( values === 'ok' ) ? find_theaters() : res.json({ status: 'failed' }) );
      }
    }

    function find_theaters(){
      let srch=q.location_search(data);
      var pools = new Pool(creds);
      pools.query(srch, (err, _res) => {
        var new_data=_res.rows;
        pools.end();
        res.json(new_data)
      })
    }
});

function getGeometry(data, resolve, reject){
  //https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Museum%20of%20Contemporary%20Art%20Australia&inputtype=textquery&fields=photos,formatted_address,name,rating,opening_hours,geometry&key=YOUR_API_KEY
  let input=`input=${data.city} ${data.state_name}`;
  input.replace(/ /g,'%');
  let fields = '&fields=geometry';
  let url=`${g_findplace_url}${input}${g_findplace_type}${fields}&key=${api}`;

  fetch(url)
  .then(res => res.json())
  .then(json => {
    data.location_lat=String(json.candidates[0].geometry.location.lat);
    data.location_lng=String(json.candidates[0].geometry.location.lng);
    data.viewport_ne_lat=String(json.candidates[0].geometry.viewport.northeast.lat);
    data.viewport_ne_lng=String(json.candidates[0].geometry.viewport.northeast.lng);
    data.viewport_sw_lat=String(json.candidates[0].geometry.viewport.southwest.lat);
    data.viewport_sw_lng=String(json.candidates[0].geometry.viewport.southwest.lng);
    geoq=q.geometry_save(data);
    var poolc = new Pool(creds);
    poolc.query(geoq, (err, _res) => {
      poolc.end();
      resolve('ok');
      return;
    })
  })
  .catch( err => reject('failure'))
}

app.post('/alter_theater', jsonParser, (req,res) => {
  const th=req.body;
  var query = q.theater_update(th);
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    var data=_res.rows;
    pool.end();
    res.json({ data });
    return;
  });
});

app.post('/updateVenue', jsonParser, (req,res) => {
  const body=req.body;
  const venue={ tid : body.tid };
  (body.vid) ? venue.vid=body.vid : venue.vid=0;
  (body.venue_name_1) ? venue.name=body.venue_name_1.replace(/'/g, "''") : venue.name='';
  (body.venue_add1_1) ? venue.address1=body.venue_add1_1.replace(/'/g, "''") : venue.address1='';
  (body.venue_add2_1) ? venue.address2=body.venue_add2_1.replace(/'/g, "''") : venue.address2='';
  (body.venue_zip_1) ? venue.zip=body.venue_zip_1 : venue.zip='';
  (body.venue_phone_1) ? venue.phone=body.venue_phone_1 : venue.phone='';
  (body.venue_directions_1) ? venue.directions=body.venue_directions_1.replace(/'/g, "''") : venue.directions='';

  if (body.venue_city_1 && body.venue_state) {
    cityPromise = new Promise( (resolve, reject) => get_city( body.venue_city_1, parseInt(body.venue_state), resolve, reject ) );
    cityPromise
    .then( result => {
      venue.city_id=result;
      process();
    })
  } else {
    process();
  }

  function process(){
    switch (body.venue_type){

      case 1:  //associate
        var prom = new Promise( (resolve, reject) => associate_venue(venue,resolve,reject) );
        prom.then( result => get_theaters() )
        break;

      case 2:  //update
        var prom = new Promise( (resolve, reject) => update_venue(venue,resolve,reject) );
        prom.then( result => get_theaters() )
        break;

      case 3:   //new
        var prom = new Promise( (resolve, reject) => add_venue(venue,resolve,reject) );
        prom
        .then( result => {
          venue.vid=result;
          var prom2 = new Promise( (resolve, reject) => associate_venue(venue,resolve,reject) );
          prom2.then( result => get_theaters() )
        })
        break;

      case 4: //delete
        venue.vid=body.vid;
        var prom = new Promise( (resolve, reject) => delete_venue(venue,resolve,reject) );
        prom.then( result => get_theaters() )
        break;
    }
  }

  function get_theaters(){
    var _venues={};
    var a = q.venues_by_theater(venue.tid);
    var b = q.venues_all();
    var pool = new Pool(creds);
    pool.query(a, (err, _res) => {
      _venues.byTheater=_res.rows;
      pool.query(b, (err, _res) => {
        pool.end();
        _venues.all=_res.rows;
        res.json(_venues)
      })
    })
  }
})

function delete_venue(venue, resolve, reject){
  var vsq=q.venue_delete(venue);
  var pool = new Pool(creds);
  pool.query(vsq, (err, _res) => {
    pool.end();
    resolve('ok')
  })
}

function update_venue(venue, resolve, reject ){
  var vsq=q.venue_update(venue);
  console.log(vsq)
  var pool = new Pool(creds);
  pool.query(vsq, (err, _res) => {
    pool.end();
    resolve(_res.rows[0])
  })
}

function add_venue(venue, resolve, reject ){
  var vsq=q.venue_save(venue);
  var pool = new Pool(creds);
  pool.query(vsq, (err, _res) => {
    pool.end();
    resolve(_res.rows[0].id);
  })
}

function associate_venue(venue, resolve, reject){
  var query=q.venue_theater_save(venue) ;
  var poolx = new Pool(creds);
  poolx.query(query, (err, _res) => {
    poolx.end();
    resolve(_res.rows[0].theater_venue_id);
  })
}

function get_city(city,state_id,resolve,reject){
  var pool = new Pool(creds);
  var cityg=q.city_get(city,state_id);
  pool.query(cityg, (err, _res) => {
    if (_res.rowCount === 0) {
      citys=q.city_save(city,state_id);
      pool.query(citys, (err, _res) => {
        pool.end();
        console.log(_res.rows[0])
        resolve(_res.rows[0].city_id)
      })
    } else {
      pool.end();
      resolve(_res.rows[0].city_id);
    }
  })
}

app.post('/addartist', jsonParser, (req,res) => {
  const body=req.body;
  const data={ fname: body.fname.replace(/'/g, "''"), lname: body.lname.replace(/'/g, "''")   }
  var query=q.artist_save( data );
  if (body.editmode && body.artist_id !=='0'){
    query=q.artist_update( data );
  }
  console.log(query);
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    pool.end();
    var newID=_res.rows[0].id;
    const prom = new Promise( (resolve, reject ) => get_data( 'all_artists', null, resolve, reject ) );
    prom.then( data => res.json({ newID, artists: data }) )
    return;
  })
})

app.post('/addshow', jsonParser, (req,res) => {
  const body=req.body;
  const show={ description: '' };
  (body.show_title_1) ? show.title=body.show_title_1.replace(/'/g, "''") : show.title="";
  (body.genre_1) ? show.genre=body.genre_1 : show.genre=2;
  var pool = new Pool(creds);
  var query=q.show_save(show);
  pool.query(query, (err, _res) => {
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

app.post('/editshow', jsonParser, (req,res) => {
  const body=req.body;
  const sid=parseInt(body.show_id);
  const show={  title: body.show_title.replace(/'/g, "''"),
                genre: parseInt(body.genre_1),
                description: '',
                show_id: sid
              };
  const query = q.show_update( show );
  const artists = process_artists( body )
  const show_promise = new Promise( (resolve, reject) => save_artists( artists, sid, null, resolve, reject ) );
  show_promise.then( done => {
    var pool = new Pool(creds);
    pool.query(query, (err, _res) => {
      pool.end();
      const prom1 = new Promise( (resolve, reject ) => get_data( 'all_shows', null, resolve, reject ) );
      const prom2 = new Promise( (resolve, reject ) => get_data( 'all_artists', null, resolve, reject ) );
      Promise.all([prom1,prom2])
      .then( data => {
        res.json({ shows: data[0], artists: data[1] })
      })
    })
  })
})

app.post('/addprod', jsonParser, (req,res) => {
  const body=req.body;
  var theater_id;
  for (key in body) if (body[key]==='Submit Production') theater_id=key;

  const prod = {};
  prod.theater_id=theater_id;
  prod.start_date=body.start_date_1;
  prod.end_date=body.end_date_1;
  (body.cast_1) ? prod.cast_list=body.cast_1 : prod.cast_list='';
  (body.description_1) ? prod.description=body.description_1.replace(/'/g, "''") : prod.description='';
  (body.show_select) ? prod.show_id=body.show_select : prod.show_id=null;
  (body.venue_by_theater) ? prod.venue_id=body.venue_by_theater : prod.venue_id=null;

  var pool = new Pool(creds);
  var query=q.production_save(prod);
  pool.query(query, (err, _res) => {
    pool.end();
    let production_id=_res.rows[0].production_id;
    const artists = process_artists( body )
    const save_them = new Promise ( (resolve,reject) => save_artists (artists, null, production_id, resolve, reject ) );
    pool=new Pool(creds);
    var query=q.production(production_id);
    pool.query(query, (err, _res) => {
      var new_prod = _res.rows[0];
      pool.end();
      res.json(_res.rows[0]);
    })
  });
});


app.post('/editprod', jsonParser, (req,res) => {
  const body=req.body;
  const pid=parseInt(body.prod_id);
  const prod={
                prod_id: pid,
                show_id: (body.show_select) ? parseInt(body.show_select) : null,
                venue_id: (body.venue_by_theater) ? parseInt(body.venue_by_theater) : null,
                start_date: (body.start_date_1) ? body.start_date_1 : '',
                end_date: (body.end_date_1) ? body.end_date_1 : '',
                cast_list: (body.cast_1) ? body.cast_1.replace(/'/g, "''") : '',
                description: (body.description_1) ? body.description_1.replace(/'/g, "''") : '',
              };
  const query = q.production_update( prod );
  const artists = process_artists( body )
  const show_promise = new Promise( (resolve, reject) => save_artists( artists, null, pid, resolve, reject ) );
  show_promise.then( done => {
    var pool = new Pool(creds);
    pool.query(query, (err, _res) => {
      var query=q.production(pid);
      console.log('query',query)
      pool.query(query, (err, _res) => {
        pool.end();
        res.json(_res.rows[0]);
      })
    })
  })
})

app.post('/remove_artist', jsonParser, (req,res) => {
  const body=req.body;
  var tb;
  switch (body.type){
    case 'book':
      tb='book'
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
              }
  let query=q.unassociate_artist(data);
  console.log('DELETE',query)
  var pool = new Pool(creds);
    pool.query(query, (err, _res) => {
      pool.end();
      res.json('ok');
    });
})

function save_artists (artists, show_id, production_id, resolve, reject){
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
          var query=q.check_artist_association( key, field, item.id, associaton_id );
          const check = new Promise( (resolve2, reject2) => exists(query, key, resolve2, reject2) );
          check.then( data => {
            if (data.exists) {
              resolve(data)
            } else {
              var query2=q.artist_to_show( data.table, field, item.id, associaton_id );
              associate(query2);
            }
          })
        } else {
          var query1=q.artist_save( item, date );
          let this_key=key;
          const artist_promise = new Promise( (resolve1, reject1) => create(query1, resolve1, reject1) );
          all_promises.push(artist_promise);
          artist_promise
          .then( aid => {
            var query2=q.artist_to_show( this_key, field, aid, associaton_id );
            const ass_prom = new Promise ( (resolve, reject) => associate(query2, resolve, reject) );
            all_promises.push(ass_prom);
          })
        }
      })
    }
    Promise.all(all_promises).then( res => {
      resolve('ok');
    })

    function exists(q, table, resolve2, reject2){
      var pool = new Pool(creds);
      pool.query(q, (err, _res) => {
        pool.end();
        if (_res.rows.length >0){
          resolve2( { exists: true } )
        } else {
          resolve2( { exists: false, table } )
        }
        return;
      })
    }

    function create(q, resolve1, reject1){
      var pool = new Pool(creds);
      pool.query(q, (err, _res) => {
        pool.end();
        resolve( _res.rows[0].id );
        return;
      })
    }

    function associate(q){
      var pool = new Pool(creds);
      pool.query(q, (err, _res) => {
        pool.end();
        if (_res.rows) {
          resolve( _res.rows[0] )
        } else {
          reject('no record')
        }
      })
    }
}

function process_artists(body){
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

function generate_token(resolve, reject){
  let str='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
  let radix=str.length;
  let token='';
  for (var i = 15; i >= 1; i--) {
    let x=rand(1,radix);
    (i%4===0)? token+='-' : token+=str.substring(x,x+1);
  }
  const prom = new Promise( (resolve, reject ) => get_theater_by_token( token, resolve, reject ) );
  prom.then(data => {
    if (data.exists) {
      generate_token();
    } else {
      resolve(token);
    }
  });
}

function get_theater_by_token( token, resolve, reject ){
  var query = `SELECT * FROM theaters WHERE token=$1;`;
  var val=[token];
  var pool = new Pool(creds);
  pool.query(query, val, (err, _res) => {
    pool.end();
    if ( _res && _res.rowCount > 0 ){
      resolve( { exists: true, values: _res.rows } );
    } else {
      resolve( { exists: false } );
    }
  });
}

function rand(min, max) {
  return Math.ceil(Math.random() * (max - min) + min);
}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});