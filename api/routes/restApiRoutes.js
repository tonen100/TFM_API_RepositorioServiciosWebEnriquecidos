'use strict';
const express = require('express');
var routerv1 = express.Router();
// var routerv2 = express.Router();

module.exports = function(app) {
    var restApisv1 = require('../controllers/restApiController');
    var versionsv1 = require('../controllers/versionController');

    routerv1.route('/restApis')
        .get(restApisv1.list_all_restApis)
        .post(restApisv1.create_a_restApi);
    routerv1.route('/restApis/:restApiId')
        .get(restApisv1.read_a_restApi)
        .put(restApisv1.edit_a_restApi)
        .delete(restApisv1.delete_a_restApi);
    routerv1.route('/restApis/:restApiId/blacklist')
        .patch(restApisv1.handle_restApi_blacklist);
    routerv1.route('/restApis/:restApiId/link/:providerId')
        .patch(restApisv1.link_provider_to_api)
    routerv1.route('/restApis/:restApiId/versions')
        .get(versionsv1.list_all_restApi_versions)
        .post(versionsv1.create_a_restApi_version);
    routerv1.route('/restApis/:restApiId/versions/:versionId')
        .get(versionsv1.read_a_restApi_version)
        .put(versionsv1.edit_a_restApi_version)
        .delete(versionsv1.delete_a_restApi_version);
    routerv1.route('/restApis/:restApiId/versions/:versionId/blacklist')
       .patch(versionsv1.handle_restApi_version_blacklist);

    app.use("/v1", routerv1)

    // var restApisv2 = require('../controllers/v2/restApiController');
    // var auth = require('../controllers/v2/authController')

    // app.use("/v2", routerv2)
}