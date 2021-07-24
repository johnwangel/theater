module.exports = {
  get_favorites : function(){
    return `SELECT *
            FROM favorites
            WHERE user_id=$1;`;
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