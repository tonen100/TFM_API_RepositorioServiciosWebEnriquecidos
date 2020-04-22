'use strict';
const express = require('express');
var routerv1 = express.Router();

module.exports = function(app) {
    var contributionsHistoryv1 = require('../controllers/contributionHistoryController');

    routerv1.route('/contributionsHistory')
        .get(contributionsHistoryv1.list_all_contributionsHistory)
    routerv1.route('/contributionsHistory/:contributionHistoryId')
        .get(contributionsHistoryv1.read_a_contributionHistory)
    app.use("/v1", routerv1);
}