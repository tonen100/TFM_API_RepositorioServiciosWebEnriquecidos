'use strict';
const express = require('express');
var routerv1 = express.Router();
// var routerv2 = express.Router();

module.exports = function(app) {
    var contributionsHistoryv1 = require('../controllers/v1/contributionHistoryController');

    routerv1.route('/contributionsHistory')
        .get(contributionsHistoryv1.list_all_contributionsHistory)
        .post(contributionsHistoryv1.create_a_contributionHistory);
    routerv1.route('/contributionsHistory/:contributionHistoryId')
        .get(contributionsHistoryv1.read_a_contributionHistory)
        .put(contributionsHistoryv1.edit_a_contributionHistory)
        .delete(contributionHistoryv1.delete_a_contributionHistory)
    routerv1.route('contributionsHistory/:contributionHistorydId/blacklist')
        .patch(contributionsHistoryv1.handle_contributionHistory_blacklist)
    app.use("/v1", routerv1)

    // var contributionsHistoryv2 = require('../controllers/v2/contributionHistoryController');
    // var auth = require('../controllers/v2/authController')

    // app.use("/v2", routerv2)
}