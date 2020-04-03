'use strict';
const express = require('express');
var routerv1 = express.Router();
// var routerv2 = express.Router();

module.exports = function(app) {
    var providersv1 = require('../controllers/providerController');

    routerv1.route('/providers')
        .get(providersv1.list_all_providers)
        .post(providersv1.create_a_provider);
    routerv1.route('/providers/:providerId')
        .get(providersv1.read_a_provider)
        .put(providersv1.edit_a_provider)
        .delete(providersv1.delete_a_provider)
    routerv1.route('providers/:providerdId/blacklist')
        .patch(providersv1.handle_provider_blacklist)

    app.use("/v1", routerv1)

    // var providersv2 = require('../controllers/v2/providerController');
    // var auth = require('../controllers/v2/authController')

    // app.use("/v2", routerv2)
}