'use strict';
module.exports = (sequelize, DataTypes) => {
  var Theaters = sequelize.define('theaters', {
    name: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.INTEGER,
    address1: DataTypes.STRING,
    address2: DataTypes.STRING,
    zip: DataTypes.STRING,
    phone: DataTypes.STRING,
    fax: DataTypes.STRING,
    website: DataTypes.STRING,
    email: DataTypes.STRING,
    place_id: DataTypes.STRING,
    location_lat: DataTypes.STRING,
    location_lng: DataTypes.STRING,
    viewport_ne_lat: DataTypes.STRING,
    viewport_ne_lng: DataTypes.STRING,
    viewport_sw_lat: DataTypes.STRING,
    viewport_sw_lng: DataTypes.STRING,
    formatted_address: DataTypes.STRING,
    name_alt: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Theaters.belongsTo(models.states, {foreignKey: 'state_id'});
        Theaters.hasMany(models.venues, {foreignKey: 'theater_id'});
      }
    }
  });
  return Theaters;
};




      // email: 'acthome@gci.net',
      // createdAt: 2019-08-04T22:36:28.642Z,
      // updatedAt: 2019-08-06T02:12:09.883Z,
