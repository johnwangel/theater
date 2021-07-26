module.exports = {
  get_favorites : function(){
    return `SELECT f.production_id
            FROM favorite f
            JOIN productions p on f.production_id=p.production_id
            WHERE f.user_id=$1 and f.liked=1
            ORDER BY p.start_date;`
  },
  is_favorite : function(){
    return `SELECT *
            FROM favorite
            WHERE user_id=$1 and production_id=$2;`;
  },
  make_favorite : function(){
    return `INSERT INTO
            favorite(user_id,production_id,liked)
            VALUES($1,$2,$3)
            RETURNING *`;
  },
  update_favorite : function(){
    return `UPDATE favorite
            SET liked=$1
            WHERE favorite_id=$2`;
  },
}



  // get_favorites : function(time){
  //   return `SELECT f.production_id, p.start_date, p.end_date
  //           FROM favorite f
  //           JOIN productions p on f.production_id=p.production_id
  //           WHERE f.user_id=$1
  //           AND p.end_date ${ (time) ? '< now()::date' : '> now()::date' }
  //           order by p.start_date;`;
  // },