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
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

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
    Users.find({ banned: false }, function(err, users) {
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
 *        Create a new user
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
    Users.findById(id, function (err, user) {
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
exports.edit_a_user = function(req, res) {
    var updatedUser = req.body;
    var id = req.params.userId;
    var lang = dict.getLang(req);
    if (!updatedUser) {
        console.warn("New PUT request to /users/ without user, sending 400...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) }); // bad request
    } else {
        Users.findById(id, function(err, user) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
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
exports.delete_a_user = function(req, res) {
    var id = req.params.userId;
    var lang = dict.getLang(req);
    Users.findOneAndDelete({"_id": id}, null, function (err) {
      if (err) {
        console.error('Error removing data from DB');
        res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
      } else {
        res.sendStatus(204); // no content
      }
    });
}