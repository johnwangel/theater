module.exports = {

  css : function (){
     return `<style type="text/CSS">
              div { margin-bottom: 5px; }
              p { font-size: 10px; }
              .show {
                padding: 5px 0;
                font-weight: bold;
                margin-left: 20px;
              }
              .artist, .desc {
                font-weight: normal;
                margin: 10px;
              }
              span {
                font-style: italic;
              }
          </style>`;
  },

  shows_html: function (){
    return `SELECT
        s.id,
        s.title,
        g.name as genre
        FROM shows s
        JOIN genres g on s.genre=g.id
        order by s.title;`;
  },

 show_html: function (id){
    return `SELECT
      s.title,
      g.name as genre
      FROM shows s
      JOIN genres g on s.genre=g.id
      where s.id=${id};`;
  },

  theater_html:  function (data){
    return `<div>
      <div><b>ID:</b> ${data.id}
      <div><b>Name:</b> ${data.name}</div>
      <div><b>Name Alt:</b> ${data.name_alt}</div>
      <div><b>Full Address:</b> ${data.formatted_address}</div>
      <div>&emsp;${data.address1}</div>
      <div>&emsp;${data.address2}</div>
      <div>&emsp;${data.city}, ${data.theater_state} ${data.zip}</div>
      <div><b>Email:</b> ${data.email}</div>
      <div><b>Website:</b> <a href="${data.website} target="_blank">${data.website}</a></div>
      <div><b>Phone:</b> ${data.phone}</div>
      <div><b>Contact:</b> ${data.contact}</div>
    </div>`;
  },

  productions_html:  function(id){
     return `SELECT
        p.start_date,
        p.end_date,
        p.cast_list,
        p.description,
        s.title,
        g.name
      FROM productions p
      JOIN theaters t on p.theater_id=t.id
      JOIN shows s on p.show_id=s.id
      JOIN genres g on s.genre=g.id
      WHERE t.id=${id};`;
  },

  venues_html: function(id){
    return `SELECT v.name as venue_name, v.address1 as venue_address
      FROM venues v
      JOIN productions p on v.id=p.venue_id
      where p.production_id=${id};`;
  },

  venue_html: function(id){
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

all_shows_html : function(data){
  var html='<h1>Shows</h1>';
  data.forEach( item => {
    html+=`<div class="show">${item.show_title} (${item.genre})`;
    if (item.book) html+=make_artist(item.book, 'book');
    if (item.music) html+=make_artist(item.music, 'music');
    if (item.lyr) html+=make_artist(item.lyr, 'lyrics');
    if (item.pw) html+=make_artist(item.pw, 'playwright');
    if (item.dir) html+=make_artist(item.dir, 'director');
    if (item.chor) html+=make_artist(item.chor, 'choreographer');
    html+=`<div class="desc"><span>Description:</span> ${item.description}</div>`;
    html+=`<div class="desc"><span>Dates:</span> ${item.start_date}&ndash;${item.end_date}</div>`;
    html+=`<div class="desc"><span>Venue:</span> ${item.venue_name}, ${item.venue_address} (${item.venue_directions})</div>`;


    html+=`</div>`
  })
  return html;

  function make_artist(data,context){
    var html='<div class="artist">';
    html+='<span>'
    switch(context){
      case "playwright":
        html+='Written by: ';
        break;
      case "music":
        html+='Music by: ';
        break;
      case "lyrics":
        html+='Lyrics by: ';
        break;
      case "book":
        html+='Book by: ';
        break;
      case "director":
        html+='Directed by: ';
        break;
      case "choreographer":
        html+='Choreographed by: ';
        break;
      default:
        html+='By';
    }
    html+='</span>';

    if (!data.length) return '';
    var l = data.length;
    data.forEach( (item, i) => {
      html+=`${item.first} ${item.last}`;
      if (l>1 && i!==l-1) html+=', ';
    })

    html+='</div>';
    return html;
  };
 }
}