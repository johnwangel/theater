module.exports = {

  get_user: function(username,password){
    return `SELECT * FROM logins WHERE username=${username};`
  },

  create_user: function(u){
    return `INSERT INTO logins (
              username,
              password,
              token,
              level,
              fname,
              lname,
              role,
              email,
              phone
            ) VALUES (
              '${u.username}',
              '${u.password}',
              '${u.token}',
              ${u.level},
              '${u.fname}',
              '${u.lname}',
              '${u.role}',
              '${u.email}',
              '${u.phone}'
            )
          returning *;`
  },

  location_search : function(d){
    return `SELECT a.* FROM (SELECT t.id, t.name, t.city, s.abbr, (
                3959 * acos ( cos ( radians(${d.location_lat}) ) * cos( radians( CAST(t.location_lat AS DOUBLE PRECISION) ) )
                  * cos( radians( CAST(t.location_lng AS DOUBLE PRECISION) ) - radians(${d.location_lng}) ) + sin ( radians(${d.location_lat}) )
                  * sin( radians( CAST(t.location_lat AS DOUBLE PRECISION) ) ))) AS distance
            FROM theaters t
            JOIN states s on t.state=s.id
            WHERE t.location_lng !='' and t.location_lat !='' ORDER BY distance LIMIT 100 ) as a WHERE a.distance < ${d.distance};`
  },

  geometry_save : function(d){
    return `update cities set
            location_lat='${d.location_lat}',
            location_lng='${d.location_lng}',
            viewport_ne_lat='${d.viewport_ne_lat}',
            viewport_ne_lng='${d.viewport_ne_lng}',
            viewport_sw_lat='${d.viewport_sw_lat}',
            viewport_sw_lng='${d.viewport_sw_lng}'
            where city_id=${d.city_id} returning *;`
  },

  state_get : function(id){
    return `select * from states where id=${id};`
  },

  city_get : function(city,state){
    return `select s.name as state_name, s.abbr as state_abbr, c.* from cities c
            join states s on c.state_id=s.id
            where c.name='${city}' and c.state_id=${state};`
  },

  city_save : function(city,state){
    return `insert into cities (name,state_id) values('${city}',${state}) returning *;`
  },

  artist_save: function( artist ){
    return `INSERT INTO artists
            (fname,lname,"createdAt","updatedAt")
            VALUES('${artist.fname}','${artist.lname}',now(),now() )
            returning *;`;
  },

  artist_update: function( artist ){
    return `UPDATE artists
            SET fname='${artist.fname}', lname='${artist.lname}', "updatedAt"=now()
            WHERE id=${artist.artist_id}
            returning *;`;
  },

  artist_to_show: function(table,field,artist_id,association_id){
    return `INSERT INTO ${table}
            (artist_id,${field})
            VALUES(${artist_id},${association_id})
            returning *;`;
  },

  unassociate_artist: function(a){
    return `DELETE FROM ${a.table_name}
            WHERE artist_id=${a.artist_id}
              AND ${a.field_name}_id=${a.assoc_id}
            RETURNING *;`;
  },

  check_artist_association: function(table,field,artist_id,association_id){
    return `SELECT * FROM ${table} WHERE artist_id=${artist_id} AND ${field}=${association_id};`;
  },

  artist: function(id,table,table2,id2){
    return `SELECT
              a1.${table2}_id,
              a2.id as artist_id,
              a2.fname,
              a2.lname
            FROM ${table} a1
            JOIN ${table2}s s on a1.${table2}_id=s.${id2}
            JOIN artists a2 on a1.artist_id=a2.id
            WHERE s.${id2}=${id};`;
  },

  staff : function(type){
    let t;
    switch (type){
      case 'all_directors':
        t='directors';
        break;
      case 'all_choreographers':
        t='choreographers';
        break;
      case 'all_mds':
        t='music_directors';
        break;
      case 'all_artists':
        return `SELECT fname, lname, id
              FROM artists
              ORDER BY lname;`;
    }
    return `SELECT a.fname, a.lname, a.id
              FROM ${t} s
              JOIN artists a on s.artist_id=a.id
              ORDER BY a.lname;`;
  },

  states: function () {
    return `SELECT id, name, abbr FROM states order by name;`;
  },

  show_save: function (s) {
    return `INSERT INTO shows (title,genre,description,"createdAt","updatedAt")
            VALUES( '${s.title}', ${s.genre}, '${s.description}', now(),now() ) returning *;`;
  },

  show_update: function (s) {
    return `UPDATE shows SET
              title='${s.title}',
              genre=${s.genre},
              description='${s.description}',
              "updatedAt"=now()
            WHERE id=${s.show_id}
            RETURNING *;`;
  },

  shows: function (){
    return `SELECT
        s.id,
        s.title,
        g.name as genre
        FROM shows s
        JOIN genres g on s.genre=g.id
        order by s.title;`;
  },

 show: function (id){
    return `SELECT
      s.title,
      g.name as genre
      FROM shows s
      JOIN genres g on s.genre=g.id
      where s.id=${id};`;
  },

  theater:  function (id){
    return `SELECT
      t.*,
      st1.name as theater_state
      FROM theaters t
      LEFT OUTER JOIN states st1 on t.state=st1.id
      WHERE t.id=${id};`
  },


  theater_update:  function (t){
    return `UPDATE theaters SET
          ${t.field}='${t.value}',
          "updatedAt"=now()
        WHERE id=${t.theater_id}
        returning *`
  },


  production_save: function(p){
    return `INSERT INTO productions
            ( theater_id, show_id, venue_id, start_date, end_date, cast_list, description )
            VALUES( ${p.theater_id}, ${p.show_id}, ${p.venue_id}, '${p.start_date}', '${p.end_date}', '${p.cast_list}', '${p.description}')
            returning *;`
  },

  production_update: function(p){
    return `UPDATE productions SET
              show_id=${p.show_id},
              venue_id=${p.venue_id},
              start_date='${(p.start_date!=='') ? p.start_date : null}',
              end_date='${(p.end_date!=='') ? p.end_date : null }',
              cast_list='${p.cast_list}',
              description='${p.description}',
              updated_at=now()
            WHERE production_id=${p.prod_id}
            returning *;`
  },

  production: function(id){
    return `SELECT p.production_id,
                p.start_date,
                p.end_date,
                p.cast_list,
                p.description,
                p.show_id,
                s.title
          from productions p
          join shows s on p.show_id=s.id
          where production_id=${id};`;
  },

  productions:  function(id){
     return `SELECT
        p.production_id,
        p.start_date,
        p.end_date,
        p.cast_list,
        p.description,
        s.title,
        p.show_id,
        g.name as genre,
        g.id as genre_id
      FROM productions p
      JOIN theaters t on p.theater_id=t.id
      JOIN shows s on p.show_id=s.id
      JOIN genres g on s.genre=g.id
      WHERE t.id=${id}
      order by p.start_date;`;
  },

  venue_theater_save : function(v){
    return `INSERT INTO theater_venue (theater_id,venue_id) VALUES(${v.tid}, ${v.vid} ) returning *;`;
  },

  venue_save : function(v){
    return `INSERT INTO venues (name,address1,address2,city,zip,phone,directions,"createdAt","updatedAt")
    VALUES ('${v.name}','${v.address1}','${v.address2}',${v.city_id},'${v.zip}','${v.phone}','${v.directions}',now(),now()) returning *;`
  },

  venue_update : function(v){
    return `UPDATE venues SET
              name='${v.name}',
              address1='${v.address1}',
              address2='${v.address2}',
              city=${v.city_id},
              zip='${v.zip}',
              phone='${v.phone}',
              directions='${v.directions}'
            WHERE id=${v.vid} returning *;`;
  },

  venue_delete : function(v){
    return `DELETE from venues WHERE id=${v.vid};`
  },

  venues: function(id){
    return `SELECT v.id as venue_id, v.name venue_name, v.address1 as venue_address
      FROM venues v
      JOIN productions p on v.id=p.venue_id
      where p.production_id=${id};`;
  },

  venues_by_theater: function(id){
    return `SELECT
              v.id as venue_id,
              v.name as venue_name,
              v.address1 as venue_add1,
              v.address2 as venue_add2,
              c.name as venue_city,
              s.abbr as venue_state,
              s.id as venue_state_id,
              v.zip as venue_zip,
              v.phone as venue_phone,
              v.directions as venue_dir
            FROM theater_venue tv
            JOIN theaters t on tv.theater_id=t.id
            JOIN venues v on tv.venue_id=v.id
            LEFT OUTER JOIN cities c on v.city=c.city_id
            LEFT OUTER JOIN states s on c.state_id=s.id
            WHERE t.id=${id};`
  },

  venue_by_production: function(id){
    return `SELECT
              p.production_id,
              v.id as venue_id,
              v.name as venue_name,
              v.address1 as venue_add1,
              v.address2 as venue_add2,
              c.name as venue_city,
              s.abbr as venue_state,
              v.zip as venue_zip,
              v.phone as venue_phone,
              v.directions as venue_directions
            FROM productions p
            JOIN venues v on p.venue_id=v.id
            LEFT OUTER JOIN cities c on v.city=c.city_id
            LEFT OUTER JOIN states s on c.state_id=s.id
            WHERE p.production_id=${id};`
  },

  venues_all: function(){
    return `SELECT
        v.id as venue_id,
        v.name as venue_name,
        v.address1 as venue_add1,
        v.address2 as venue_add2,
        v.zip as venue_zip,
        v.phone as venue_phone,
        c.name as venue_city,
        v.directions as venue_dir,
        st2.abbr as venue_state
      FROM venues v
      LEFT OUTER JOIN cities c on v.city=c.city_id
      LEFT OUTER JOIN states st2 on c.state_id=st2.id
      ORDER BY v.name;`;
  },

 artists_show: function(id,context){
    return `SELECT
      a.id as id,
      a.fname as first,
      a.lname as last
    FROM shows s
    LEFT OUTER JOIN ${context} c on s.id=c.show_id
    LEFT OUTER JOIN artists a on c.artist_id=a.id
    WHERE s.id=${id};`;
  },

  theater_data: function(id){
    return `SELECT t.*,
      s.title,
      s1.name as theater_state,
      g.name as genre,
      p.production_id,
      p.start_date,
      p.end_date,
      p.cast_list,
      p.description,
      ab.fname as book_first,
      ab.lname as book_last,
      am.fname as music_first,
      am.lname as music_last,
      al.fname as lyr_first,
      al.lname as lyr_last,
      ap.fname as pw_first,
      ap.lname as pw_last,
      ad.fname as dir_first,
      ad.lname as dir_last,
      ac.fname as chor_first,
      ac.lname as chor_last,
      v.name as venue_name,
      v.address1 as venue_address,
      v.directions as venue_directions
    FROM theaters t
    JOIN states s1 on t.state=s1.id
    LEFT OUTER JOIN productions p on t.id=p.theater_id
    LEFT OUTER JOIN shows s on p.show_id=s.id
    LEFT OUTER JOIN genres g on s.genre=g.id
    LEFT OUTER JOIN venues v on p.venue_id=v.id
    LEFT OUTER JOIN book b on b.show_id=s.id
    LEFT OUTER JOIN artists ab on b.artist_id=ab.id
    LEFT OUTER JOIN music m on m.show_id=s.id
    LEFT OUTER JOIN artists am on m.artist_id=am.id
    LEFT OUTER JOIN lyrics l on l.show_id=s.id
    LEFT OUTER JOIN artists al on m.artist_id=al.id
    LEFT OUTER JOIN playwright pw on pw.show_id=s.id
    LEFT OUTER JOIN artists ap on pw.artist_id=ap.id
    LEFT OUTER JOIN directors d on d.production_id=p.production_id
    LEFT OUTER JOIN artists ad on d.artist_id=ad.id
    LEFT OUTER JOIN choreographers c on c.production_id=p.production_id
    LEFT OUTER JOIN artists ac on c.artist_id=ac.id
    WHERE t.id=${id}
    order by p.start_date DESC;`
  }
}
