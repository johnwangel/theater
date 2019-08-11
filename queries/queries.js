module.exports = {

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
      JOIN states st1 on t.state=st1.id
      WHERE t.id=${id};`
  },

  productions:  function(id){
     return `SELECT
        p.start_date,
        p.end_date,
        p.cast_list,
        p.description,
        s.title,
        s.id
      FROM productions p
      JOIN theaters t on p.theater_id=t.id
      JOIN shows s on p.show_id=s.id
      WHERE t.id=${id}
      order by p.start_date;`;
  },

  venues: function(id){
    return `SELECT v.name as venue_name, v.address1 as venue_address
      FROM venues v
      JOIN productions p on v.id=p.venue_id
      where p.production_id=${id};`;
  },

  venue: function(id){
    return `SELECT
        v.name as venue_name,
        v.address1 as venue_add1,
        v.address2 as venue_add2,
        v.zip as venue_zip,
        v.phone as venue_phone,
        c.name as venue_city,
        v.directions as venue_dir,
        st2.name as venue_state
      FROM theaters t
      JOIN venues v on t.id=v.id
      JOIN cities c on v.city=c.city_id
      JOIN states st2 on c.state_id=st2.id
      where t.id=${id};`;
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
    JOIN productions p on t.id=p.theater_id
    JOIN shows s on p.show_id=s.id
    JOIN genres g on s.genre=g.id
    JOIN venues v on p.venue_id=v.id
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