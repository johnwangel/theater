'use strict';
module.exports = (sequelize, DataTypes) => {
  var Specialies = sequelize.define('specialties', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Specialies;
};