'use strict';
const express = require('express');
var routerv1 = express.Router();

module.exports = function(app) {
    var historyContributionsv1 = require('../controllers/historyContributionController');

    routerv1.route('/historyContributions')
        .get(historyContributionsv1.list_all_historyContributions)
    routerv1.route('/historyContributions/:historyContributionId')
        .get(historyContributionsv1.read_a_historyContribution)
    app.use("/v1", routerv1);
}