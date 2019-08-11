'use strict';
module.exports = (sequelize, DataTypes) => {
  var Venues = sequelize.define('venues', {
    theater_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    address1: DataTypes.STRING,
    address2: DataTypes.STRING,
    city: DataTypes.INTEGER,
    zip: DataTypes.TEXT,
    phone: DataTypes.STRING,
    directions: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        Venues.hasMany(models.productions, {foreignKey: 'venue_id'});
        Venues.belongsTo(models.theaters, {foreignKey: 'theater_id'});
      }
    }
  });
  return Venues;
};