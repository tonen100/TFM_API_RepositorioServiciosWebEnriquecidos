/* restApiController.js 
* 
* RestApi API service
* 
* Authors: 
* Pierre-François Giraud
* 
* Universidad de Sevilla 
* 2019-20
* 
*/

var mongoose = require('mongoose')
RestApis = mongoose.model('RestApis');
var contributionsHistory = require('./contributionHistoryController');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

 /**
 * @swagger
 * path:
 *  '/restApis':
 *    get:
 *      tags:
 *        - RestApi
 *      description: >-
 *        Retrieve all the rest API
 *      operationId: getRestApis
 *      parameters:
 *        - name: providerId
 *          in: query
 *          description: id of the provider who wanna search api for
 *          required: false
 *          schema:
 *            type: string
 *        - name: businessModels
 *          in: query
 *          description: id of the provider who wanna search api for
 *          required: false
 *          schema:
 *            type: array
 *            items:
 *              type: string
 *              description: List of the type of offers available for consumers
 *              enum: ['Free', 'FreeWithLimitations', 'FreeTrialVersion', 'FlatRateAllInclusive', 'FlatRatesWithLimitations', 'Billing']
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
 *                    $ref: '#/components/schemas/restAPI'
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.list_all_restApis = function(req, res) {
    var lang = dict.getLang(req);
    var filters = {};
    if(req.query.providerId && typeof(req.query.providerId) == 'string') filters.provider_id = req.query.providerId
    if(req.query.businessModels && typeof(req.query.businessModels) == 'object') filters.businessModels = req.query.businessModels //TODO
    // if(req.query.query && typeof(req.query.query) == 'string') filters.provider_id = req.query.providerId // TODO
    RestApis.find(filters, function(err, restApis) {
        if(err) {
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            restApis.forEach(restApi => delete restApi.versions);
            res.json(restApis);
        }
    })
}

/**
 * @swagger
 * path:
 *  '/restApis':
 *    post:
 *      tags:
 *        - RestApi
 *      description: >-
 *        Create a new rest API
 *      operationId: postRestApis
 *      parameters:
 *        - $ref: '#/components/parameters/language'
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - name
 *                - businessModels
 *              properties:
 *                name:
 *                  type: string
 *                  example: 'Twitter API'
 *                logo:
 *                  type: array
 *                  items:
 *                    type: string
 *                businessModels:
 *                  type: string
 *                  description: List of the type of offers available for consumers
 *                  enum: ['Free', 'FreeWithLimitations', 'FreeTrialVersion', 'FlatRateAllInclusive', 'FlatRatesWithLimitations', 'Billing']
 *                  example: 'description API'
 *      responses:
 *        '201':
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/restAPI'
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.create_a_restApi = function(req, res) {
    var new_restApi = new RestApis(req.body);
    var lang = dict.getLang(req);
    new_restApi.save(function(err, restApi) {
        if(err) {
            if(err.name=='ValidationError') {
                res.status(422).send({ err: dict.get('ErrorSchema', lang) });
            }
            else{
                console.error('Error create data in DB');
                res.status(500).send({ err: dict.get('ErrorCreateDB', lang) });
            }
        } else {
            contributionsHistory.create_a_contributionHistory(restApi._id, restApi._id, 'ADD', 'RestAPI'); // TODO
            res.status(201).send(restApi);
        }
    });
}

/**
 * @swagger
 * path:
 *  '/restApis/{restApiId}':
 *    get:
 *      tags:
 *        - RestApi
 *      description: >-
 *        Retrieve details from a specific rest API
 *      operationId: getRestApi
 *      parameters:
 *         - name: restApiId
 *           in: path
 *           description: id of the rest API you want to get details from
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
 *                - $ref: '#/components/schemas/restAPI'
 *        '404':
 *           description: RestApi not found
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.read_a_restApi = function(req, res) {
    var id = req.params.restApiId;
    var lang = dict.getLang(req);
    RestApis.findById(id, function (err, restApi) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
        } else {
          if (restApi) {
            res.send(restApi);
          } else {
            console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
            res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', id) }); // not found
          }
        }
      });
}

/**
 * @swagger
 * path:
 *  '/restApis/{restApiId}':
 *    put:
 *      tags:
 *        - RestApi
 *      description: >-
 *        Update a specific rest API
 *      operationId: putRestApi
 *      parameters:
 *         - name: restApiId
 *           in: path
 *           description: id of the rest API you want to update
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
 *                - $ref: '#/components/schemas/restAPI'
 *      responses:
 *        '200':
 *          description: Updated rest API
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/restAPI'
 *        '404':
 *           description: RestApi not found
 *           content: {}
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.edit_a_restApi = function(req, res) {
    var updatedRestApi = req.body;
    var id = req.params.restApiId;
    var lang = dict.getLang(req);
    if (!updatedRestApi) {
        console.warn("New PUT request to /restApis/ without restApi, sending 400...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) }); // bad request
    } else {
        RestApis.findById(id, function(err, restApi) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
              } else {
                if (restApi) {
                    if(updatedRestApi.name) restApi.name = updatedRestApi.name;
                    if(updatedRestApi.logo) restApi.logo = updatedRestApi.logo;
                    if(updatedRestApi.description) restApi.description = updatedRestApi.description;
                    if(updatedRestApi.businessModels) restApi.businessModels = updatedRestApi.businessModels;
                    restApi.save(function(err2, newRestApi) {
                        if (err2) {
                            if(err2.name=='ValidationError') {
                                res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                            }
                            else{
                                console.error('Error updating data from DB');
                                res.status(500).send({ err: dict.get('ErrorUpdateDB', lang) });
                            }
                        } else {
                            contributionsHistory.create_a_contributionHistory(restApi._id, restApi._id, 'EDIT', 'RestAPI'); // TODO
                            res.send(newRestApi); // return the updated restApi
                        }
                    });
                } else {
                  console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
                  res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', id) }); // not found
                }
            }
        });
    }
}


/**
 * @swagger
 * path:
 *  '/restApis/{restApiId}/blacklist':
 *    patch:
 *      tags:
 *        - RestApi
 *      description: >-
 *        Blacklist or remove from blacklist a rest API
 *      operationId: patchRestApiBlacklist
 *      parameters:
 *         - name: restApiId
 *           in: path
 *           description: id of the rest API you want to blacklist or remove from blacklist
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
 *                - blacklisted
 *              properties:
 *                banned:
 *                  type: boolean
 *      responses:
 *        '200':
 *          description: Updated restApi
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/restAPI'
 *        '404':
 *           description: RestApi not found
 *           content: Not Found
 *        '422':
 *           description: Incorrect body
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.handle_restApi_blacklist = function(req, res) {
    var blacklisted = req.body ? req.body.blacklisted : undefined;
    var id = req.params.restApiId;
    var lang = dict.getLang(req);
    if (blacklisted == null || typeof(blacklisted) != "boolean") {
        console.warn("New PATCH request to /restApis/id/blacklist without correct attribute blacklisted, sending 422...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) });
    } else {
        restApi.versions.forEach(version => version.blacklisted = blacklisted);
        RestApis.findById(id, function(err, restApi) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
            } else {
                if (restApi) {
                    restApi.versions.forEach(version => version.blacklisted = blacklisted);
                    restApi.blacklisted = blacklisted;
                    restApi.save((err2, newRestApi) => {
                        if (err2) {
                            console.error('Error getting data from DB');
                            res.status(500).send({ err: dict.get('ErrorUpdateDB', lang) });
                        } else {
                            res.send(newRestApi);
                        }
                    });
                } else {
                    console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
                    res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', id) });                }
            }
        });
    }
}

/**
 * @swagger
 * path:
 *  '/restApis/{restApiId}/link/{providerId}':
 *    patch:
 *      tags:
 *        - RestApi
 *        - Provider
 *      description: >-
 *        Link a rest API to a provider
 *      operationId: patchRestApiLinkToProvider
 *      parameters:
 *         - name: restApiId
 *           in: path
 *           description: id of the rest API for which you want to change provider
 *           required: true
 *           schema:
 *             type: string
 *         - name: providerId
 *           in: path
 *           description: id of the provider you want to link to the rest API
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/language'
 *      responses:
 *        '200':
 *          description: Updated restApi
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/restAPI'
 *        '404':
 *           description: rest API or provider not found
 *           content: Not Found
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.link_provider_to_api = function(req, res) {
    var id = req.params.restApiId;
    var provider_id = req.params.providerId;
    var lang = dict.getLang(req);
    Providers.find({ "_id": provider_id }, (err, provider) => {
        if (err) {
            console.error('Error getting data from DB');
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else if(provider) {
            RestApis.findOneAndUpdate({"_id": id}, { "provider_id": provider_id }, { new: true }, function(err2, restApi) {
                if (err2) {
                    console.error('Error getting data from DB');
                    res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
                } else {
                    if (restApi) {
                        res.send(restApi);
                    } else {
                        console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
                        contributionsHistory.create_a_contributionHistory(restApi._id, restApi._id, 'EDIT', 'RestAPI'); // TODO
                        res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', id) });
                    }
                }
            });
        } else {
            console.warn(dict.get('RessourceNotFound', lang, 'provider', id));
            res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'provider', id) });
        }
    });
}

/**
 * @swagger
 * path:
 *  '/restApis/{restApiId}':
 *    delete:
 *      tags:
 *        - RestApi
 *      description: >-
 *        Delete a specific rest API
 *      operationId: deleteRestApi
 *      parameters:
 *         - name: restApiId
 *           in: path
 *           description: id of the rest API you want to delete
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
exports.delete_a_restApi = function(req, res) {
    var id = req.params.restApiId;
    var lang = dict.getLang(req);
    RestApis.findOneAndDelete({"_id": id}, null, function (err, restApi) {
      if (err) {
        console.error('Error removing data from DB');
        contributionsHistory.create_a_contributionHistory(restApi._id, restApi._id, 'DELETE', 'RestAPI', restApi.name); // TODO
        res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
      } else {
        res.sendStatus(204);
      }
    });
}