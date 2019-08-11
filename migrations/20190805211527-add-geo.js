'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return [
      queryInterface.addColumn(
        'theaters',
        'place_id',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'location_lat',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'location_lng',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'viewport_ne_lat',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'viewport_ne_lng',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'viewport_sw_lat',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'viewport_sw_lng',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'formatted_address',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'theaters',
        'zip',
        Sequelize.STRING
      )


    ];
  },

  down: (queryInterface, Sequelize) => {
    return [
      queryInterface.removeColumn('theaters', 'place_id'),
      queryInterface.removeColumn('theaters', 'location_lat'),
      queryInterface.removeColumn('theaters', 'location_lng'),
      queryInterface.removeColumn('theaters', 'viewport_ne_lat'),
      queryInterface.removeColumn('theaters', 'viewport_ne_lng'),
      queryInterface.removeColumn('theaters', 'viewport_sw_lat'),
      queryInterface.removeColumn('theaters', 'viewport_sw_lng'),
      queryInterface.removeColumn('theaters', 'formatted_address'),
      queryInterface.removeColumn('theaters', 'name_alt')
    ];
  }
};
