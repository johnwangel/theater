module.exports = {

  get_user: function(){
    return `SELECT l.*, t.id as tid
            FROM logins l
            LEFT OUTER JOIN theaters t on l.token=t.token
            WHERE username=$1;`
  },

  create_user: function(){
    return `INSERT INTO logins (username,password,token,level,fname,lname,role,phone)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          returning *;`
  },

  location_search : function(d){
    return `SELECT a.* FROM (SELECT t.id, t.name, t.city, s.abbr, (
                3959 * acos ( cos ( radians($1) ) * cos( radians( CAST(t.location_lat AS DOUBLE PRECISION) ) )
                  * cos( radians( CAST(t.location_lng AS DOUBLE PRECISION) ) - radians($2) ) + sin ( radians($1) )
                  * sin( radians( CAST(t.location_lat AS DOUBLE PRECISION) ) ))) AS distance
            FROM theaters t
            JOIN states s on t.state=s.id
            WHERE t.location_lng !='' and t.location_lat !='' ORDER BY distance LIMIT 100 ) as a WHERE a.distance < $3;`
  },

  geometry_save : function(){
    return `update cities set
            location_lat=$1,
              location_lng=$2,
              viewport_ne_lat=$3,
              viewport_ne_lng=$4,
              viewport_sw_lat=$5,
              viewport_sw_lng=$6
            where city_id=$7
            returning *;`
  },

  state_get : function(id){
    return `select * from states where id=${id};`
  },

  city_get : function(){
    return `select s.name as state_name, s.abbr as state_abbr, c.* from cities c
            join states s on c.state_id=s.id
            where c.name=$1 and c.state_id=$2;`
  },

  city_save : function(city,state){
    return `insert into cities (name,state_id) values($1,$2) returning *;`
  },

  artist_save: function(){
    return `INSERT INTO artists
            (fname,lname,"createdAt","updatedAt")
            VALUES( $1, $2, now(), now() )
            returning *;`;
  },

  artist_update: function( artist ){
    return `UPDATE artists
            SET fname=$1, lname=$2, "updatedAt"=now()
            WHERE id=$3
            returning *;`;
  },

  artist_to_show: function(table,field){
    return `INSERT INTO ${table}
            (artist_id,${field})
            VALUES($1,$2)
            returning *;`;
  },

  unassociate_artist: function(a){
    return `DELETE FROM ${a.table_name}
            WHERE artist_id=$1 AND ${a.field_name}_id=$2
            RETURNING *;`;
  },

  check_artist_association: function(table,field){
    return `SELECT * FROM ${table} WHERE artist_id=$1 AND ${field}=$2;`;
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
            WHERE s.${id2}=$1;`;
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

  show_save: function() {
    return `INSERT INTO shows (title,genre,description,"createdAt","updatedAt")
            VALUES( $1, $2, $3, now(),now() ) returning *;`;
  },

  show_update: function() {
    return `UPDATE shows SET
              title=$1,
              genre=$2,
              description=$3,
              "updatedAt"=now()
            WHERE id=$4
            RETURNING *;`;
  },

  shows: function(){
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

  theater:  function(){
    return `SELECT
      t.*,
      st1.name as theater_state
      FROM theaters t
      LEFT OUTER JOIN states st1 on t.state=st1.id
      WHERE t.id=$1;`;
  },


  theater_update:  function (t){
    return `UPDATE theaters SET
          ${t.field}=$1,
          "updatedAt"=now()
        WHERE id=$2
        returning *`
  },

  theater_by_token: function(){
    return `SELECT * FROM theaters WHERE id=$1;`;
  },


  production_save: function(p){
    return `INSERT INTO productions
            ( theater_id, show_id, venue_id, start_date, end_date, cast_list, description )
            VALUES($1,$2,$3,$4,$5,$6,$7)
            returning *;`
  },

  production_update: function(){
    return `UPDATE productions SET
              show_id=$1,
              venue_id=$2,
              start_date=$3,
              end_date=$4,
              cast_list=$5,
              description=$6,
              updated_at=now()
            WHERE production_id=$7
            returning *;`
  },

  production: function(){
    return `SELECT p.production_id,
                p.start_date,
                p.end_date,
                p.cast_list,
                p.description,
                p.show_id,
                s.title
          from productions p
          join shows s on p.show_id=s.id
          where production_id=$1;`;
  },

  productions:  function(){
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
      WHERE t.id=$1
      order by p.start_date;`;
  },

  venue_theater_save : function(){
    return `INSERT INTO theater_venue (theater_id,venue_id) VALUES($1,$2) returning *;`;
  },

  venue_save : function(){
    return `INSERT INTO venues (name,address1,address2,city,zip,phone,directions,"createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now()) returning *;`
  },

  venue_update : function(){
    return `UPDATE venues SET
              name=$1,
              address1=$2,
              address2=$3,
              city=$4,
              zip=$5,
              phone=$6,
              directions=$7
            WHERE id=$8 returning *;`;
  },

  venue_delete : function(){
    return `DELETE from venues WHERE id=$1;`
  },

  venues: function(id){
    return `SELECT v.id as venue_id, v.name venue_name, v.address1 as venue_address
      FROM venues v
      JOIN productions p on v.id=p.venue_id
      where p.production_id=${id};`;
  },

  venues_by_theater: function(){
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
            WHERE t.id=$1;`;
  },

  venue_by_production: function(){
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
            WHERE p.production_id=$1;`;
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
  }

}
