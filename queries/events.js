module.exports = {


  get_event : function(){
    return `SELECT *, t.label as event_type
            FROM event e
            JOIN event_type t on e.event_type_id=t.event_type_id
            WHERE event_id=$1;`;
  },

  get_events_by_theater : function(){
    return `SELECT *, t.label as event_type
            FROM event e
            JOIN event_type t on e.event_type_id=t.event_type_id
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