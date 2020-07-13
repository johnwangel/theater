module.exports = {


  get_event : function(){
    return `SELECT *, t.label as event_type
            FROM event e
            JOIN event_type t on e.event_type_id=t.event_type_id
            WHERE event_id=$1;`;
  },

  get_events_by_theater : function(){
    return `SELECT e.*, t.label as event_type, s.title as show_title, g.name as genre_name
            FROM event e
            JOIN event_type t on e.event_type_id=t.event_type_id
            LEFT JOIN shows s on e.show_id=s.id
            LEFT JOIN genres g on s.genre=g.id
            WHERE theater_id=$1;`;
  },

  create_event : function(){
    return `INSERT INTO event(
              title,
              theater_id,
              show_id,
              event_type_id,
              description,
              date_start,
              time_start,
              no_repeat,
              date_end,
              website,
              more_info,
              is_free
            )
            VALUES(
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            )
            returning *;`;
  },

  update_event : function(){
    return `UPDATE event
            SET
              title=$2,
              show_id=$3,
              event_type_id=$4,
              description=$5,
              date_start=$6,
              time_start=$7,
              no_repeat=$8,
              date_end=$9,
              website=$10,
              more_info=$11,
              is_free=$12,
              updated_at=now()
            WHERE event_id=$1
            returning *;`;
  },

  delete_event : function(){
    return `DELETE event
            WHERE event_id=$1
            returning *;`;
  },

  event_types : function(){
    return `SELECT * FROM event_type ORDER BY label;`;
  }

}