'use strict';
module.exports = (sequelize, DataTypes) => {
  var Genres = sequelize.define('genres', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Genres.belongsTo(Shows, { as: 'shows', foreignKey: 'genres_id'});
      }
    }
  });
  return Genres;
};