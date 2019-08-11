'use strict';
module.exports = (sequelize, DataTypes) => {
  var Artists = sequelize.define('artists', {
    fname: DataTypes.STRING,
    lname: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Artists.hasMany(models.shows, {foreignKey: 'artists_id'});
      }
    }
  });
  return Artists;
};