'use strict';
const express = require('express');
var routerv1 = express.Router();

module.exports = function(app) {
    var usersv1 = require('../controllers/userController');
    var auth = require('../controllers/authController');

    routerv1.route('/login')
        .post(usersv1.login_a_user);
    routerv1.route('/users')
        .get(usersv1.list_all_users)
        .post(usersv1.create_a_contributor);
    routerv1.route('/users/admin')
        .post(auth.verifyUser(['Administrator']), usersv1.create_a_user);
    routerv1.route('/users/:userId')
        .get(usersv1.read_a_user)
        .put(auth.verifyUser(['Administrator', 'Contributor']), usersv1.edit_a_user)
        .delete(auth.verifyUser(['Administrator', 'Contributor']), usersv1.delete_a_user);
    routerv1.route('/users/:userId/ban')
        .patch(auth.verifyUser(['Administrator']), usersv1.handle_user_banishment);

    app.use("/v1", routerv1);
}