'use strict';
const express = require('express');
var routerv1 = express.Router();

module.exports = function(app) {
    var providersv1 = require('../controllers/providerController');
    var auth = require('../controllers/authController');

    routerv1.route('/providers')
        .get(providersv1.list_all_providers)
        .post(auth.verifyUser(['Administrator', 'Contributor']), providersv1.create_a_provider);
    routerv1.route('/providers/:providerId')
        .get(providersv1.read_a_provider)
        .put(auth.verifyUser(['Administrator', 'Contributor']), providersv1.edit_a_provider)
        .delete(auth.verifyUser(['Administrator', 'Contributor']), providersv1.delete_a_provider);
    routerv1.route('/providers/:providerId/blacklist')
        .patch(auth.verifyUser(['Administrator']), providersv1.handle_provider_blacklist);

    app.use("/v1", routerv1);
}