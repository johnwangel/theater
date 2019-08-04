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
    email: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Theaters.belongsTo(models.states, {foreignKey: 'state_id'});
      }
    }
  });
  return Theaters;
};