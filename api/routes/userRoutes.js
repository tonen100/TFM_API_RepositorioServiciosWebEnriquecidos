'use strict';
const express = require('express');
var routerv1 = express.Router();
// var routerv2 = express.Router();

module.exports = function(app) {
    var usersv1 = require('../controllers/userController');

    routerv1.route('/users')
        .get(usersv1.list_all_users)
        .post(usersv1.create_a_user);
        routerv1.route('/users/:userId')
        .get(usersv1.read_a_user)
        .put(usersv1.edit_a_user)
        .delete(usersv1.delete_a_user)
    routerv1.route('/users/:userId/ban')
        .patch(usersv1.handle_user_banishment)

    app.use("/v1", routerv1)

    // var usersv2 = require('../controllers/v2/userController');
    // var auth = require('../controllers/v2/authController')

    // routerv2.route('/users')
    //     .get(usersv2.list_all_users)
    //     .post(usersv2.create_an_user);
    // routerv2.route('/users/:userId')
    //     .get(usersv2.read_an_user)
    //     .put(usersv2.edit_an_user)
    //     .delete(auth.verifyUser(['Administrator']), usersv2.delete_an_user)
    // routerv2.route('/users/:userId/ban')
    //     .patch(auth.verifyUser(['Administrator']), usersv2.handle_user_banishment)

    // app.use("/v2", routerv2)
}