module.exports = {

  save_search: function(){
    return `insert into searches(client,city,state,distance,theater,show)
      VALUES($1,$2,$3,$4,$5,$6);`;
  },

  get_client: function(){
    // var d = new Date();
    // var day = d.getDate();
    // var month = d.getMonth() + 1;
    // var year = d.getFullYear();
    // var date = `${year}-${month}-${day}`;
    // console.log(date);
    return `select * from client where ip=$1 and created_at>=now()::date + interval '1h';`;
  },

  get_clients: function(){
    return `select c.ip, c.created_at, ci.name as city, s.abbr as state, co.code2 as country, c.postal, c.lat, c.long
              from client c
              join states s on c.state=s.id
              join country co on c.country=co.country_id
              join cities ci on c.city=ci.city_id
            WHERE ip != '72.90.159.41';`;
  },

  get_latest_updates: function(){
    return `select theater_id, created_at
            from productions
            order by created_at desc
            limit 100;`;
  },


  get_theater_group: function(group){
    return `select t.*, s.abbr as state_abbr, sp.name as specialty_name
            from theaters t
            join states s on t.state=s.id
            left outer join specialty sp on t.specialty_id=s.id
            where t.id in (${group});`;
  },

  find_productions_by_show: function(){
    return `SELECT p.*,
                s.title,
                t.name as theater_name,
                v.name as venue_name,
                v.id as venue_id,
                v.*,
                c.name as city_name,
                st.name as state_name,
                st.abbr as state_abbr
            FROM productions p
            JOIN shows s on p.show_id=s.id
            JOIN theaters t on p.theater_id=t.id
            JOIN venues v on p.venue_id=v.id
            JOIN cities c on v.city=c.city_id
            JOIN states st on c.state_id = st.id
            WHERE s.id = $1;`;

  },

  find_productions_by_show_group: function(group){
    return `SELECT p.*,
                s.title,
                t.name as theater_name,
                v.name as venue_name,
                v.id as venue_id,
                v.*,
                c.name as city_name,
                st.name as state_name,
                st.abbr as state_abbr
            FROM productions p
            JOIN shows s on p.show_id=s.id
            JOIN theaters t on p.theater_id=t.id
            JOIN venues v on p.venue_id=v.id
            JOIN cities c on v.city=c.city_id
            JOIN states st on c.state_id = st.id
            WHERE s.id in ${group};`;

  },

  find_shows: function(){
    return `SELECT title, id, SIMILARITY(title,$1) as sml
            FROM shows
            WHERE LOWER(title) LIKE LOWER($1)
            ORDER BY sml DESC, title;`
  },


  find_theater: function(){
    return `SELECT t.name, t.id, t.city, s.abbr, SIMILARITY(t.name,$1) as sml
            FROM theaters t
            JOIN states s on t.state=s.id
            WHERE LOWER(t.name) LIKE LOWER($1)
            ORDER BY sml DESC, t.name;`
  },

  get_user: function(){
    return `SELECT l.*, t.id as tid
            FROM logins l
            LEFT OUTER JOIN theaters t on l.token=t.token
            WHERE username=$1;`
  },

  save_reset_token: function(){
    return `UPDATE logins
            SET reset_token=$1,
                expiry_date=$2
            WHERE user_id=$3
            returning *;`
  },

  update_password: function(){
    return `UPDATE logins
            SET
                password=$1,
                reset_token=null,
                expiry_date=null
            WHERE user_id=$2
            returning *;`
  },


  create_user: function(){
    return `INSERT INTO logins (username,password,token,level,fname,lname,role,phone,optin)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          returning *;`
  },

  location_search : function(d){
    return `SELECT a.* FROM (SELECT t.id, t.name, t.city, s.abbr, (
                3959 * acos ( cos ( radians($1) ) * cos( radians( CAST(t.location_lat AS DOUBLE PRECISION) ) )
                  * cos( radians( CAST(t.location_lng AS DOUBLE PRECISION) ) - radians($2) ) + sin ( radians($1) )
                  * sin( radians( CAST(t.location_lat AS DOUBLE PRECISION) ) ))) AS distance
            FROM theaters t
            JOIN states s on t.state=s.id
            WHERE t.location_lng !='' and t.location_lat !='' ORDER BY distance ) as a WHERE a.distance < $3;`
  },

  upcoming_production : function(){
    return `SELECT p.*, s.*, g.name as genre_name
            FROM productions p
            JOIN shows s on p.show_id=s.id
            JOIN genres g on s.genre=g.id
            WHERE p.theater_id=$1
            AND p.end_date > now()
            ORDER BY p.end_date ASC
            LIMIT 1;`
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

  country_get : function(type){
    //0=code2, 1=code3, 2=codenum, 3=name
    let field;
    switch (type){
      case 0:
        field='code2';
        break;
      case 1:
        field='code3';
        break;
      case 2:
        field='codenum';
        break;
      case 3:
        field='name';
        break;
    }
    return `select * from country where ${field}=$1;`
  },

  state_get : function(id){
    return `select * from states where id=${id};`
  },

  state_get_by_name : function(){
    return `select * from states where name=$1;`
  },

  city_get : function(){
    return `select s.name as state_name, s.abbr as state_abbr, c.* from cities c
            join states s on c.state_id=s.id
            where c.name=$1 and c.state_id=$2;`
  },

  city_save : function(city,state){
    return `insert into cities (name,state_id) values($1,$2) returning *;`
  },

  save_client : function(){
    return `insert into client (ip,city,state,country,postal,lat,long)
      VALUES ($1,$2,$3,$4,$5,$6,$7) returning *;`;
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
    return `SELECT id, name, abbr FROM states order by abbr;`;
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

  theaters_all: function(lim){
    return `SELECT t.*, s.abbr as state_abbr
            FROM theaters t
            JOIN states s on t.state = s.id
            WHERE t.email is null or t.email = ''
            ORDER BY t.state, t.name
            LIMIT ${lim};`;
  },

  theater:  function(){
    return `SELECT
      t.*,
      sp.name as specialty,
      st1.name as theater_state
      FROM theaters t
      LEFT OUTER JOIN states st1 on t.state=st1.id
      LEFT OUTER JOIN specialty sp on t.specialty_id=sp.id
      WHERE t.id=$1;`;
  },

  all_specialties: function(){
    return `SELECT *
        FROM specialty
        ORDER BY name;`;
  },

  delete_theater: function(){
    return `DELETE FROM theaters WHERE id=$1;`;
  },

  add_theater: function(){
    return `INSERT INTO theaters(name,city,state,"createdAt","updatedAt")
    VALUES ($1,$2,$3,now(),now()) returning *;`
  },

  theater_update:  function (t){
    if (t.field === 'specialty') t.field='specialty_id';

    return `UPDATE theaters SET
          ${t.field}=$1,
          "updatedAt"=now()
        WHERE id=$2
        returning *;`
  },

  theater_by_token: function(){
    return `SELECT * FROM theaters WHERE id=$1;`;
  },

  get_theater_by_token: function(){
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
    return `SELECT
                p.production_id,
                p.start_date,
                p.end_date,
                p.cast_list,
                p.description,
                p.show_id,
                s.title,
                g.name as genre,
                g.id as genre_id
          from productions p
          join shows s on p.show_id=s.id
          join genres g on s.genre=g.id
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

  venue_remove : function(){
    return `DELETE from theater_venue WHERE theater_id=$1 AND venue_id=$2;`
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
              s.name as venue_state_name,
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
  },

  email_save: function(){
    return `INSERT INTO email(name,email_address,subject,message) VALUES ($1,$2,$3,$4) RETURNING *;`;
  },

  email_get: function(){
    return `SELECT * from email WHERE handled = false ORDER BY created_at DESC;`;
  },

  email_theater_info: function(){
    return `SELECT * FROM theaters WHERE id=$1;`;
  },

  log_sent_email: function(){
    return `insert into notification(notification_list_id,theater_id,sent) VALUES($1,$2,now());`;
  },

  theater_mail:  function(notif_no){
    return `SELECT
      t.*,
      sp.name as specialty,
      st1.name as theater_state,
      n.sent
      FROM theaters t
      LEFT OUTER JOIN states st1 on t.state=st1.id
      LEFT OUTER JOIN specialty sp on t.specialty_id=sp.id
      LEFT OUTER JOIN notification n on t.id = n.theater_id and n.notification_list_id=${notif_no}
      WHERE t.id=$1 and n.sent is null;`;
  },

}