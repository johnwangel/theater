'use strict';
module.exports = (sequelize, DataTypes) => {
  var Shows = sequelize.define('shows', {
    title: DataTypes.STRING,
    genre: DataTypes.INTEGER,
    book: DataTypes.INTEGER,
    music: DataTypes.STRING,
    lyrics: DataTypes.STRING,
    playwright: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        //  type to genres
        Shows.hasMany(Genres, { as : 'genres' , foreignKey: 'genres_id'});
        // book to artists
        Shows.belongsTo(models.artists, {foreignKey: 'artists_id'});

        Shows.hasMany(models.productions, {foreignKey: 'production_id'});

      }
    }
  });
  return Shows;
};