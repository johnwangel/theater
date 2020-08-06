module.exports = {

  search_event : function(type,free){
    let type$ = (type) ? `AND e.event_type_id = $3` : '';
    let free$ = (free) ? `AND e.is_free=true` : '';
    return `SELECT e.*,
                   e2.label as event_type,
                   t.name as theater_name,
                   t.city as theater_city,
                   s.abbr as state_abbr,
                   s2.title as show_title,
                   g.name as genre
            FROM event e
            JOIN event_type e2 on e.event_type_id=e2.event_type_id
            JOIN theaters t on e.theater_id=t.id
            JOIN states s on t.state=s.id
            LEFT JOIN shows s2 on e.show_id=s.id
            LEFT JOIN genres g on s2.genre=g.id
            WHERE (e.no_repeat = true AND e.date_start >= $1)
            OR ( e.no_repeat = false AND
                 (
                  (e.date_start >= $1 AND e.date_start <= $2 )
                  OR
                  (e.date_end >= $1 AND e.date_end <= $2 )
                 )
               )
            ${type$} ${free$}
            ORDER BY e.date_start;`;
  }

}