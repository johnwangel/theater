'use strict';
module.exports = (sequelize, DataTypes) => {
  var States = sequelize.define('states', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        States.hasMany(models.theaters, {foreignKey: 'state_id'});
        States.hasMany(models.city_state, {foreignKey: 'state2_id'});
      }
    }
  });
  return States;
};