'use strict';
/*---------------USER Auth----------------------*/
var mongoose = require('mongoose'),
    User = mongoose.model('Users');
var admin = require('firebase-admin');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

exports.getUserId = async function (idToken) {
    idToken = idToken.replace('Bearer ', '');
    var id = null;

    var userFromFB = await admin.auth().verifyIdToken(idToken);

    var uid = userFromFB.uid;
    // var auth_time = userFromFB.auth_time;
    // var exp = userFromFB.exp;

    var mongoUser = await User.findOne({ email: uid });
    if (!mongoUser) { return null; }

    else {
        id = mongoUser._id;
        return id;
    }
}


exports.verifyUser = function (requiredRoles) {
    return async function (req, res, callback) {
        var idToken = req.headers['authorization'];
        var lang = dict.getLang(req);
        if(!idToken) {
            res.status(401).send({ err: dict.get('Unauthorized', lang) });
        } else {
            idToken = idToken.replace('Bearer ', '');
            console.log(idToken);
            try {
                var decodedToken = await admin.auth().verifyIdToken(idToken);
                var uid = decodedToken.uid;
                User.findOne({ email: uid }, function (err, user) {
                    if (err) {
                        res.send(err);
                    } else if (!user) {
                        res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'user', uid) });
                    } else {    
                        var isAuth = false;
                        for (var i = 0; i < requiredRoles.length; i++) {
                            if (requiredRoles[i] === user.role) {
                                isAuth = true;
                            }
                        }
                        if (isAuth) return callback(null, user);
                        else {
                            res.status(403).send({ err: dict.get('Forbidden', lang) });
                        }
                    }
                });
            }
            catch(err) {
                console.log(err)
                res.status(403).send({ err: dict.get('Forbidden', lang) });
            }
        }
    }
}