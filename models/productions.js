'use strict';
module.exports = (sequelize, DataTypes) => {
  var Productions = sequelize.define('productions', {
    show_id: DataTypes.INTEGER,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    venue_id: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    director: DataTypes.STRING,
    choreographher: DataTypes.STRING,
    description: DataTypes.TEXT,
    cast: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        Productions.belongsTo(models.shows, {foreignKey: 'production_id'});
        Productions.belongsTo(models.venues, {foreignKey: 'venue_id'});
      }
    }
  });
  return Productions;
};