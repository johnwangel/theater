const express = require('express');
const moment = require('moment');
const app = express();
//const sequelize = require('sequelize');
//const Op = sequelize.Op;
/*
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres'
});
*/
const PORT = process.env.PORT || 3000;

const fetch=require('node-fetch');

//const passport = require('passport');
//const cookieParser = require('cookie-parser');
//const RedisStore = require('connect-redis')(session);
//const db = require('./models');
const bodyParser = require('body-parser');
//const bcrypt = require('bcrypt');
//const jsonwebtoken = require("jsonwebtoken");

//const Theaters = db.theaters;
//const States = db.states;
//const Artists = db.artists;
//const Genres = db.genres;
//const Shows = db.shows;
//const Users = db.users;

const fs = require('fs');
const readline = require('readline');

var q = require('./queries/queries.js')
var h = require('./html/html.js')


//const saltRounds = 10;

//require('./passport')();

app.use(express.static('public'));

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });




app.get('/api/auth', jsonParser, (req, res) => {
  // let id = req.user ? req.user.id : null;
  // console.log("PASSPORT ID", req.session.passport.user)
  // let id = req.session.passport.user ? req.session.passport.user : null;
  // let username = req.user ? req.user.username : null;
  // res.json({id, username })
  if (req.user){
    res.json( { id: req.user } )
  } else {
    return res.status(401).json({ message: "Unauthorized user!" });
  }
})




/*


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
*/

/* app.use(cookieParser());
app.use(
  session({
    store: new RedisStore(),
    secret: 'run with the devil',
    resave: false,
    saveUninitialized: false
  })
);


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


app.get('/api/logout', jsonParser, (req, res) => {
  req.logout()
  req.session.destroy();
  res.send( { message: 'Successfully logged out' } );
})

//create and respond with new user
app.post('/api/register', jsonParser, (req, res) => {
  bcrypt.genSalt(saltRounds, function(err, salt) {
    bcrypt.hash(req.body.password, salt, function(err, hash) {
      Users.create({
        username: req.body.username,
        password: hash,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
      })
      .then(user => {
        res.json(user.dataValues);
      })
      .catch(err => {
        return res.json(err);
      });
    });
  });
});

app.get('/api/auth', jsonParser, (req, res) => {
  // let id = req.user ? req.user.id : null;
  // console.log("PASSPORT ID", req.session.passport.user)
  // let id = req.session.passport.user ? req.session.passport.user : null;
  // let username = req.user ? req.user.username : null;
  // res.json({id, username })
  if (req.user){
    res.json( { id: req.user } )
  } else {
    return res.status(401).json({ message: "Unauthorized user!" });
  }
})


//create and respond with new user
app.post('/api/login', jsonParser, (req, res) => {
  Users.findOne({where: { username: req.body.username }})
  .then( user => {
    if (!user) {
      res.status(401).json({ message: 'Authentication failed. User not found.'})
    } else {
      if(bcrypt.compareSync(req.body.password, user.password)){
        return res.json({ token: jsonwebtoken.sign( { id: user.id, username: user.username}, 'RESTFULAPIs')})
      } else {
        res.status(401).json({ message: 'Authentication failed. Wrong password.'});
      }
    }
  })
});
  // passport.authenticate('local', (err, user) => {
  //     if (err) return res.status(500).json({ err });
  //     if (!user) return res.status(401).json({ message: 'invalid' });

  //     req.logIn( user, (err) => {
  //       if (err) return res.json({ err });
  //       // return res.status(200).json(user);
  //     });
  // })(req, res);


*/

// const gurl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?';
// const type= '&inputtype=textquery';
// const fields = '&fields=formatted_address,name,geometry,place_id';
// const key = '&key=AIzaSyB3N3HjuVUbn1X7tQsiNhzVgmaFiMfwAXw';

const gurl = 'https://maps.googleapis.com/maps/api/place/details/json?';
const fields = '&fields=formatted_phone_number,website';
const key = '&key=AIzaSyB3N3HjuVUbn1X7tQsiNhzVgmaFiMfwAXw';


//https://maps.googleapis.com/maps/api/place/details/json?placeid=ChIJidwvoxzi2IgR9LLuxEB6xsA&key=AIzaSyB3N3HjuVUbn1X7tQsiNhzVgmaFiMfwAXw&fields=
const { Pool, Client } = require('pg');
const creds = {
  user: 'theater_user',
  host: '127.0.0.1',
  database: 'johnatkins',
  password: 'Die4u$'
};


app.get('/',function(req,res){
  var thtr_id=1;
  var query = q.theater_data(1);
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    var data=_res.rows;
    //console.log(data);
    pool.end();
    var t_loc = data[0];
    var p_info=sort_shows(data);
    var html=h.css();
    html+=h.theater_html(t_loc);
    html+=h.all_shows_html(p_info);
    res.send(html);
  });
});



function sort_shows(data){
  var new_data=[];
  var shows = data.map( item => item.title).filter((v, i, a) => a.indexOf(v) === i);
  for (var i = shows.length - 1; i >= 0; i--) {
    var temp={ show_title: shows[i]};
    data.forEach( item => {
      if (item.title === shows[i]){
        temp.genre = item.genre;
        temp.venue_name=item.venue_name;
        temp.venue_address=item.venue_address;
        temp.venue_directions=item.venue_directions;
        temp.description=item.description;
        temp.start_date=moment(item.start_date).format('MMMM D, YYYY');
        temp.end_date=moment(item.end_date).format('MMMM D, YYYY');
        temp = make_obj(temp,item.book_first,item.book_last,'book');
        temp = make_obj(temp,item.music_first,item.music_last,'music');
        temp = make_obj(temp,item.lyr_first,item.lyr_last,'music');
        temp = make_obj(temp,item.pw_first,item.pw_last,'pw');
        temp = make_obj(temp,item.dir_first,item.dir_last,'dir');
        temp = make_obj(temp,item.chor_first,item.chor_last,'chor');
      }
    });
    new_data[new_data.length]=temp;
  }
  return new_data;
}

function make_obj(temp, first, last, type){
  var tmp_o={};
  if (first) tmp_o.first=first;
  if (last) tmp_o.last=last;
  if (isEmpty(tmp_o)) return temp;
  if (!temp[type]){
    temp[type]=[tmp_o];
  } else {
    if (tmp_o.first !== temp[type][0].first && tmp_o.last !== temp[type][0].last) temp[type][temp[type].length]=tmp_o;
  }
  return temp;
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
















app.get('/allshows', function (req, res) {
  var pool = new Pool(all_shows);
  pool.query(myquery, (err, results) => {
    var rows=results.rows;

    console.log(rows);

    pool.end();
    var html = create_table(rows);

    res.send(html)
  });
});


function create_table(rows){
  var html='<style type="text/CSS"> div { margin-bottom: 5px; } p { font-size: 10px; } span { font-style: italic; padding-left: 10px; }</style>';
  rows.forEach( item => {
     html+=`<div><p><strong>${item.id}&emsp;${item.title}</strong><span>Genre:</span> ${item.genre}`;
     if (test(item.book_last)!=='') html+=`<span>Book:</span> ${test(item.book_first)} ${test(item.book_last)}`;
     if (test(item.music_last)!=='') html+=`<span>Music:</span> ${test(item.music_first)} ${test(item.music_last)}`;
     if (test(item.lyrics_last)!=='') html+=`<span>Lyrics:</span> ${test(item.lyrics_first)} ${test(item.lyrics_last)}`;
     if (test(item.pw_last)!=='') html+=`<span>Playwright:</span> ${test(item.pw_first)} ${test(item.pw_last)}`;
     html+='</p></div>';
  })

  function test(val) {
    return (val ? val : '');
  }
  return html;
}


app.get('/emails', function (req, res) {
    var update=parseInt(req.query.update);
    var del=parseInt(req.query.delete);
    var email=req.query.email;
    var ds ='';

    var _thisid;
    if (update) {
      console.log('update_activated')
       Theaters.update( { 'email':email, 'fax': 'ok' },
         { returning: true, where: { id: update }
       })
       .then(function(json){
        var data = json[1][0].dataValues;
        updated_data=JSON.stringify(data);
        load();
       })
       .catch(function (err) {
          console.log(err);
       });
    } else if (del) {
      console.log('delete activated');
       Theaters.destroy( { where: { id: del } })
       .then(function(json){
        console.log(json);
        load();
       })
       .catch(function (err) {
          console.log(err);
       });
    } else {
      load();
    }

    function load(){
      Theaters.findAll({
        where: {
          id: {
                [Op.gte]: 101,
                [Op.lte]: 200
             },
            fax: {
              [Op.not]: 'ok'
            }
          }
      })
      .then( thtr => {

        console.log(thtr);

        thtr.forEach( i => {
          ds += `<form><p>
            <button name='delete' type="submit" value="${i.id}">Delete</button>
            <span>${i.id}</span>
            <span style='padding:10px'>${i.name}</span>
            <a href='${i.website}' target='_blank'>website</a>
            <input name='email' type="text" value="${i.email}"></input>
            <button name='update' type="submit" value="${i.id}">Update</button>
          </p></form>`;
        });

        res.send(ds);
      })

    }

});


app.get('/shows', function (req, res) {

    var _title = String(req.query.title),
        _genre=parseInt(req.query.genre),
        _book=parseInt(req.query.book),
        _bfirst=req.query.fbook,
        _blast=req.query.lbook,
        _music=parseInt(req.query.music),
        _mfirst=req.query.fmusic,
        _mlast=req.query.lmusic,
        _lyrics=parseInt(req.query.lyrics),
        _lfirst=req.query.flyrics,
        _llast=req.query.llyrics,
        _pw=parseInt(req.query.playwright),
        _pwfirst=req.query.fpw,
        _pwlast=req.query.lpw,
        _create=req.query.create;

    const show_name=`<textarea name="title"></textarea>`;
    var genre_opts=`<select name="genre">
                  <option value="2">musical, comedy</option>
                  <option value="3">musical, drama</option>
                  <option value="4">musical, revue</option>
                  <option value="5">play, comedy</option>
                  <option value="6">play, drama</option>
                </select>`;

    var artist_opts;
    function make_form(){
          Artists.findAll( { order: [['lname', 'ASC']] } )
          .then(function(artists){
            var artist_opts=`<option value="0">None</option>`;
            artists.forEach( item => {
              var name=item.dataValues;
              var tmp=`<option value="${name.id}">${name.lname},${name.fname}</option>`
              artist_opts += tmp;
            });
            var new_form =`<form>
                            <p>Title: ${show_name}</p>
                            <p>Genre: ${genre_opts}</p>
                            <p>Book: <select name="book">${artist_opts}</select>New: First: <input type="text" name="fbook" value=""></input>Last: <input type="text" name="lbook" value=""></input></p>
                            <p>Music: <select name="music">${artist_opts}</select>New: First: <input type="text" name="fmusic" value=""></input>Last: <input type="text" name="lmusic" value=""></p>
                            <p>Lyrics: <select name="lyrics">${artist_opts}</select>New: First: <input type="text" name="flyrics" value=""></input>Last: <input type="text" name="llyrics" value=""></p>
                            <p>Playwright: <select name="playwright">${artist_opts}</select>New: First: <input type="text" name="fpw" value=""></input>Last: <input type="text" name="lpw" value=""></p>
                            <p><button name="create" value="new" type="submit">Create</button></p>
                          </form>`;

            res.send(new_form);
          });
    }

  if (_create !== 'new'){
    make_form();
  } else {

    console.log('starting step 1');
    var _bookid=null, _musicid=null, _lyricid=null, _pwid=null;
    if (_book ===0 && _bfirst && _blast){
            Artists.create({
              fname: _bfirst,
              lname: _blast
            })
            .then( artist => {
              _bookid = artist.dataValues.id;
              _bookid=parseInt(_bookid);
              console.log('finishing step 1');
              step2(_bookid);
            }).catch( err => console.log(err));
      } else if (_book !==0){
        _bookid=_book;
        console.log('finishing step 1');
        step2();
      } else {
        console.log('finishing step 1');
        step2();
      }


    function step2(){
      console.log('starting step 2');
      if (_music===0 && _mfirst && _mlast){
          Artists.create({
            fname: _mfirst,
            lname: _mlast
          })
          .then( artist => {
            _musicid = artist.dataValues.id;
            _musicid=parseInt(_musicid);
            console.log('finishing step 2');
            step3()
          }).catch( err => console.log(err));
      } else if (_music !==0){
        _musicid=_music;
        console.log('finishing step 2');
        step3()
      } else {
        console.log('finishing step 2');
        step3()
      }
    }


    function step3(){
      console.log('starting step 3');
      if (_lyrics===0 && _lfirst && _llast){
          Artists.create({
              fname: _lfirst,
              lname: _llast
          })
          .then( artist => {
            _lyricid = artist.dataValues.id;
            console.log('finishing step 3');
            step4()
          }).catch( err => console.log(err));
      } else if (_lyrics !== '0'){
        _lyricid=_lyrics;
        console.log('finishing step 3');
        step4();
      } else {
        console.log('finishing step 3');
        step4();
      }
    }

    function step4(){
      console.log('starting step 4');
      if (_pw===0 && _pwfirst && _pwlast){
          Artists.create({
              fname: _pwfirst,
              lname: _pwlast
          })
          .then( artist => {
            _pwid = artist.dataValues.id;
            console.log('finishing step 4');
            step5();
          }).catch( err => console.log(err));
      } else if (_pw!==0){
        _pwid=_pw;
        console.log('finishing step 4');
        step5();
      } else {
        console.log('finishing step 4');
        step5();
      }
    };

    function step5() {
        console.log('starting step 5');
         Shows.create(
          {
            title:_title,
            genre:_genre,
            book: _bookid,
            music: _musicid,
            lyrics: _lyricid,
            playwright: _pwid
          })
         .then(function(json){
          make_form();
         })
         .catch(function (err) {
            console.log(err);
         });
    }
  };
});

/*
const readInterface = readline.createInterface({
    input: fs.createReadStream('./data/california.csv'),
    output: process.stdout,
    console: false
});

readInterface.on('line', function(line) {
  var items = line.split('|');
  Theaters
    .findOrCreate({where: {
                            name: items[0],
                            city: items[2],
                            state: items[3]
                          },
                  defaults: {
                              address1: items[1],
                              //address2: items[2],
                              zip: items[4],
                              website: items[5],
                              email: items[6],
                              "createdAt":Date.now(),
                              "updatedAt":Date.now()
                            }
    })
    .then(([user, created]) => {
      console.log(user.get({
        plain: true
      }))
      console.log(created)
    })
});
*/


// var i;
// var sec = 1;
// for (i = 11; i <=21; i++) {
//     var _i = i;
//     var secs=sec*3000;
//     setTimeout(function(){
//       doit(_i);
//     }, secs);
//     sec++;
// }





// var addr = 'input=The Vintage Theatre Company, LLC Clarksburg WV';

// addr = addr.replace(/\s/g, '%20');

// var url= gurl+addr+type+fields+key;





// {
//     "candidates": [
//         {
//             "formatted_address": "305 Washington Ave, Clarksburg, WV 26301, USA",
//             "geometry": {
//                 "location": {
//                     "lat": 39.278085,
//                     "lng": -80.33967899999999
//                    },
//                 "viewport": {
//                     "northeast": {
//                         "lat": 39.27952452989271,
//                         "lng": -80.33828427010727
//                     },
//                     "southwest": {
//                         "lat": 39.27682487010727,
//                         "lng": -80.34098392989272
//                     }
//                 }
//             },
//             "name": "The Vintage Theatre Company, LLC",
//             "place_id": "ChIJo9yUXLxpSogRdb3cpggyYFQ"
//         }
//     ],
//     "status": "OK"
// }



/*fetch('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', { method: 'POST', body: params })
    .then(res => res.json())
    .then(json => alert(json));

  */



    // var record=parseInt(req.query.file);

    // var updated_data;

    // var _thisid = record;
    // Theaters.findOne({
    //     where: { id: _thisid }
    //   })
    // .then( thtr => {
    //   var t = thtr.dataValues;
    //   if (!t.place_id) return;
    //   var pid='placeid='+t.place_id;
    //   var url= gurl+pid+fields+key;


    //     fetch(url, {method: 'POST'})
    //       .then( res => res.json() )
    //       .then( function(json){
    //         var item = json.result;
    //         if (!item) return;
    //         var phone = item.formatted_phone_number;
    //         var website = item.website;

    //         var update_cols = {
    //               'phone':phone,
    //               'website':website
    //         };
    //          Theaters.update( update_cols,
    //            { returning: true, where: { id: _thisid }
    //          })
    //          .then(function(json){
    //           console.log(json[1][0].dataValues);
    //           var data = json[1][0].dataValues;
    //           updated_data=JSON.stringify(data);
    //          })
    //          .catch(function (err) {
    //             console.log(err);
    //          })

      //States.findOne({ where : { id : t.state }})
      //.then ( sta => {

        //var addr = 'input='+thtr.name+' '+thtr.city+' '+sta.dataValues.name;
        //addr = addr.replace(/\s/g, '%20');
        //addr = addr.replace(/\'/g, '');
        //var url= gurl+addr+type+fields+key;
        // fetch(url, {method: 'POST'})
        //   .then( res => res.json() )
        //   .then( function(json){
        //     var item = json.candidates[0];
        //     if (!item) return;
        //     var tempadd = tempadd=item.formatted_address;
        //     var add_arr = tempadd.split(',');
        //     var street=add_arr[0], zip=add_arr[2];
        //     zip = zip.substr(4);
        //     var geo = item.geometry;
        //     var loc = geo.location;
        //     var view = geo.viewport;
        //     var ne=view.northeast;
        //     var sw=view.southwest;

        //     var update_cols = {
        //           'name_alt':item.name,
        //           'zip':zip,
        //           'place_id':item.place_id,
        //           'formatted_address':item.formatted_address,
        //           'address1':street,
        //           'location_lat':String(loc.lat),
        //           'location_lng':String(loc.lng),
        //           'viewport_ne_lat':String(ne.lat),
        //           'viewport_ne_lng':String(ne.lng),
        //           'viewport_sw_lat':String(sw.lat),
        //           'viewport_sw_lng':String(sw.lng)
        //     };
        //      Theaters.update( update_cols,
        //        { returning: true, where: { id: _thisid }
        //      })
        //      .then(function(json){
        //       console.log(json[1][0].dataValues);
        //       var data = json[1][0].dataValues;
        //       updated_data=JSON.stringify(data);
        //      })
        //      .catch(function (err) {
        //         console.log(err);
        //      })

          //});
    //   })
    // })

    // res.send('<form><input type="text" name="file" value="'+(record+1)+'""></input><button type="submit">Submit</button></form><p></p>');


// });

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});