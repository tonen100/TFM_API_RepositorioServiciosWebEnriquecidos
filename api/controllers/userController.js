/* userController.js 
* 
* User API service
* 
* Authors: 
* Pierre-François Giraud
* 
* Universidad de Sevilla 
* 2019-20
* 
*/

var mongoose = require('mongoose')
Users = mongoose.model('Users');
var admin = require('firebase-admin');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();
var auth = require('./authController')

 /**
 * @swagger
 * path:
 *  '/users':
 *    get:
 *      tags:
 *        - User
 *      description: >-
 *        Retrieve all the users
 *      operationId: getUsers
 *      parameters:
 *        - $ref: '#/components/parameters/language'
 *      responses:
 *        '200':
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - type: array
 *                  items:
 *                    $ref: '#/components/schemas/user'
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.list_all_users = function(req, res) {
    var lang = dict.getLang(req);
    Users.find({ banned: false }, { password: 0 }, function(err, users) {
        if(err) {
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            res.json(users);
        }
    })
}

/**
 * @swagger
 * path:
 *  '/users':
 *    post:
 *      tags:
 *        - User
 *      description: >-
 *        Create a new user (only contributors)
 *      operationId: postContributor
 *      parameters:
 *        - $ref: '#/components/parameters/language'
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - username
 *                - email
 *                - password
 *              properties:
 *                username:
 *                  type: string
 *                email:
 *                  type: string
 *                password:
 *                  type: string
 *      responses:
 *        '201':
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/user'
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.create_a_contributor = function(req, res) {
    var new_user = new Users(req.body);
    var lang = dict.getLang(req);
    if(new_user.role == 'Administrator') {
        res.status(403).send({ err: dict.get('Forbidden', lang) });
    } else {
        new_user.save(function(err, user) {
            if(err) {
                console.error(err);
                if(err.name=='ValidationError') {
                    res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                }
                else{
                    console.error('Error create data in DB');
                    res.status(500).send({ err: dict.get('ErrorCreateDB', lang) });
                }
            } else {
                res.status(201).send(user);
            }
        });
    }
}

/**
 * @swagger
 * path:
 *  '/users/admin':
 *    post:
 *      tags:
 *        - User
 *      description: >-
 *        Create a new user (any type). Need administrator privileges
 *      operationId: postUsers
 *      parameters:
 *        - $ref: '#/components/parameters/language'
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - username
 *                - email
 *                - password
 *                - role
 *              properties:
 *                username:
 *                  type: string
 *                email:
 *                  type: string
 *                password:
 *                  type: string
 *                role:
 *                  type: string
 *                  enum: [Administrator, Contributor]
 *      responses:
 *        '201':
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/user'
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.create_a_user = function(req, res) {
    var new_user = new Users(req.body);
    var lang = dict.getLang(req);
    new_user.save(function(err, user) {
        if(err) {
            if(err.name=='ValidationError') {
                res.status(422).send({ err: dict.get('ErrorSchema', lang) });
            }
            else{
                console.error('Error create data in DB');
                res.status(500).send({ err: dict.get('ErrorCreateDB', lang) });
            }
        } else {
            res.status(201).send(user);
        }
    });
}

/**
 * @swagger
 * path:
 *  '/users/{userId}':
 *    get:
 *      tags:
 *        - User
 *      description: >-
 *        Retrieve details from a specific user
 *      operationId: getUser
 *      parameters:
 *         - name: userId
 *           in: path
 *           description: id of the user you want to get details from
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/language'
 *      responses:
 *        '200':
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/user'
 *        '404':
 *           description: User not found
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.read_a_user = function(req, res) {
    var id = req.params.userId;
    var lang = dict.getLang(req);
    Users.findById(id, { password: 0 }, function (err, user) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
        } else {
          if (user) {
            res.send(user);
          } else {
            console.warn(dict.get('RessourceNotFound', lang, 'user', id));
            res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'user', id) }); // not found
          }
        }
      });
}

/**
 * @swagger
 * path:
 *  '/users/{userId}':
 *    put:
 *      tags:
 *        - User
 *      description: >-
 *        Update a specific user
 *      operationId: putUser
 *      parameters:
 *         - name: userId
 *           in: path
 *           description: id of the user you want to update
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/language'
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              allOf:
 *                - $ref: '#/components/schemas/user'
 *      responses:
 *        '200':
 *          description: Updated user
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/user'
 *        '404':
 *           description: User not found
 *           content: {}
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.edit_a_user = async function(req, res) {
    var updatedUser = req.body;
    var id = req.params.userId;
    var lang = dict.getLang(req);
    var token = req.headers['authorization'];
    if(id != await auth.getUserId(token)) {
        res.status(401).send({ err: dict.get('Unauthorized', lang) });
    } else if (!updatedUser) {
        console.warn("New PUT request to /users/ without user, sending 400...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) });
    } else {
        Users.findById(id, { password: 0 }, function(err, user) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) }) // internal server error
              } else {
                if (user) {
                    user = Object.assign(user, updatedUser)
                    user.save(function(err2, newUser) {
                        if (err2) {
                            if(err2.name=='ValidationError') {
                                res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                            }
                            else{
                                console.error('Error updating data from DB');
                                res.status(500).send({ err: dict.get('ErrorUpdateDB', lang) });
                            }
                        } else {
                            res.send(newUser); // return the updated user
                        }
                    });
                    
                } else {
                  console.warn(dict.get('RessourceNotFound', lang, 'user', id));
                  res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'user', id) }); // not found
                }
            }
        });
    }
}


/**
 * @swagger
 * path:
 *  '/users/{userId}/ban':
 *    patch:
 *      tags:
 *        - User
 *      description: >-
 *        Ban or unban an user
 *      operationId: patchUserBanishment
 *      parameters:
 *         - name: userId
 *           in: path
 *           description: id of the user you want to ban or unban
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/language'
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - banned
 *              properties:
 *                banned:
 *                  type: boolean
 *      responses:
 *        '200':
 *          description: Updated user
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/user'
 *        '404':
 *           description: User not found
 *           content: Not Found
 *        '422':
 *           description: Incorrect body
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.handle_user_banishment = function(req, res) {
    var banned = req.body ? req.body.banned : undefined;
    var id = req.params.userId;
    var lang = dict.getLang(req);
    if (banned == null || typeof(banned) != "boolean") {
        console.warn("New PATCH request to /users/id/ban without correct attribute banned, sending 422...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) });
    } else {
        Users.findOneAndUpdate({"_id": id}, { "banned": banned }, { new: true }, function(err, user) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
            } else {
                if (user) {
                    res.send(user);
                } else {
                    console.warn(dict.get('RessourceNotFound', lang, 'user', id));
                    res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'user', id) });                }
            }
        });
    }
}

/**
 * @swagger
 * path:
 *  '/users/{userId}':
 *    delete:
 *      tags:
 *        - User
 *      description: >-
 *        Delete a specific user
 *      operationId: deleteUser
 *      parameters:
 *         - name: userId
 *           in: path
 *           description: id of the user you want to delete
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/language'
 *      responses:
 *        '204':
 *          description: No content
 *          content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.delete_a_user = async function(req, res) {
    var id = req.params.userId;
    var lang = dict.getLang(req);
    var token = req.headers['authorization'];
    if(id != await auth.getUserId(token)) {
        res.status(401).send({ err: dict.get('Unauthorized', lang) });
    } else {
        Users.findOneAndDelete({"_id": id}, null, function (err) {
          if (err) {
            console.error('Error removing data from DB');
            res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
          } else {
            res.sendStatus(204); // no content
          }
        });
    }
}

/**
 * @swagger
 * path:
 *  /login:
 *    get:
 *      summary: Log in
 *      tags:
 *        - User
 *      parameters:
 *         - name: login
 *           in: query
 *           description: User email or username
 *           required: true
 *           schema:
 *             type: string
 *         - name: password
 *           in: query
 *           description: User password
 *           required: true
 *           schema:
 *             type: string
 *      responses:
 *        "200":
 *          description: Return an user with token
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/user'
 *        "401":
 *          description: Forbidden
 *        "500":
 *          description: Internal error
 */
exports.login_a_user = async function(req, res) {
    var username = req.body.login;
    var email = req.body.login;
    var password = req.body.password;
    var lang = dict.getLang(req);
    Users.findOne({ $or: [ { username: username }, { email: email } ] }, function (err, user) {
        if (err) {
            res.send(err);
        } else if (!user) {
            res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'user', req.query.login) });
        } else {
            user.verifyPassword(password, async function(err, isMatch) {
                if (err) {
                    res.send(err);
                } else if (!isMatch) {
                    res.status(403).send({ err: dict.get('Forbidden', lang) });
                } else {
                    try {
                        var customToken = await admin.auth().createCustomToken(user.email);
                        user.customToken = customToken;
                        user.password = null;
                        res.status(200).json(user);
                    } catch (error) {
                        console.error("Error creating custom token:", error);
                    }
                }
            });
        }
    });
};