'use strict';
const express = require('express');
var routerv1 = express.Router();

module.exports = function(app) {
    var restApisv1 = require('../controllers/restApiController');
    var versionsv1 = require('../controllers/versionController');
    var auth = require('../controllers/authController');

    routerv1.route('/restApis')
        .get(restApisv1.list_all_restApis)
        .post(auth.verifyUser(['Administrator', 'Contributor']), restApisv1.create_a_restApi);
    routerv1.route('/restApis/:restApiId')
        .get(restApisv1.read_a_restApi)
        .put(auth.verifyUser(['Administrator', 'Contributor']), restApisv1.edit_a_restApi)
        .delete(auth.verifyUser(['Administrator', 'Contributor']), restApisv1.delete_a_restApi);
    routerv1.route('/restApis/:restApiId/blacklist')
        .patch(auth.verifyUser(['Administrator', 'Contributor']), restApisv1.handle_restApi_blacklist);
    routerv1.route('/restApis/:restApiId/link/:providerId')
        .patch(auth.verifyUser(['Administrator', 'Contributor']), restApisv1.link_provider_to_api);
    routerv1.route('/restApis/:restApiId/versions')
        .get(versionsv1.list_all_restApi_versions)
        .post(auth.verifyUser(['Administrator', 'Contributor']), versionsv1.create_a_restApi_version);
    routerv1.route('/restApis/:restApiId/versions/:versionId')
        .get(versionsv1.read_a_restApi_version)
        .put(auth.verifyUser(['Administrator', 'Contributor']), versionsv1.edit_a_restApi_version)
        .delete(auth.verifyUser(['Administrator', 'Contributor']), versionsv1.delete_a_restApi_version);
    routerv1.route('/restApis/:restApiId/versions/:versionId/blacklist')
       .patch(auth.verifyUser(['Administrator']), versionsv1.handle_restApi_version_blacklist);
    routerv1.route('/restApis/:restApiId/versions/:versionId/depreciate')
       .patch(auth.verifyUser(['Administrator', 'Contributor']), versionsv1.handle_restApi_version_depreciate)

    /* front validation use only */
    routerv1.route('/restApis/versions/generateMetadata')
        .post(versionsv1.convert_to_OAS_and_metadata);

    app.use("/v1", routerv1);
}