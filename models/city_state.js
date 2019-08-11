'use strict';
module.exports = (sequelize, DataTypes) => {
  var City_state = sequelize.define('city_state', {
    city: DataTypes.STRING,
    state: DataTypes.INTEGER,
    lat: DataTypes.STRING,
    lng: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        City_state.belongsTo(models.states, {foreignKey: 'state2_id'});
      }
    }
  });
  return City_state;
};