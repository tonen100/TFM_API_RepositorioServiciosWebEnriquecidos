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
var NodeCache = require( "node-cache" );
var restApisCache = new NodeCache( { stdTTL: 600, checkperiod: 60, useClones: true } );

var auth = require('./authController');
var historyContributions = require('./historyContributionController');
var documentClassifier = require('../documentClassifier');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

function getLastVersion(restAPI) {
    return [restAPI.versions.sort((a, b) => b.createdAt - a.createdAt)[0]]
}

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
 *        - name: page
 *          in: query
 *          description: page number of the results (starts at 0)
 *          required: true
 *          schema:
 *            type: integer
 *            min: 0
 *            default: 0
 *        - name: keywords
 *          in: query
 *          description: keywords of the search (use matching score based algorithm on APIs metadata to filter with this parameter)
 *          required: false
 *        - name: name
 *          in: query
 *          description: Exact name of the API to retrieve
 *          required: false
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
exports.list_all_restApis = async function(req, res) {
    var lang = dict.getLang(req);
    var page = req.query.page ? req.query.page : 0;
    var countPerPage = 10;
    page = Math.max(0, page);
    var filters = { blacklisted: false };
    var keywords = null;
    var restApis;
    
    if(req.query.name && typeof(req.query.name) == 'string') {
        restApis = await RestApis.find({ name: req.query.name }, { _id: 1 });
        res.json(restApis);
        return;
    }
    if(req.query.providerId && typeof(req.query.providerId) == 'string') filters.provider_id = req.query.providerId;
    if(req.query.keywords && typeof(req.query.keywords) == 'string') {
        keywords = req.query.keywords.toLowerCase();
        keywords = documentClassifier.remove_stop_words(keywords);
        keywords = documentClassifier.remove_punctuation(keywords);
        filters["$or"] = [];
        keywords.split(' ').forEach(keyword => filters["$or"].push(
            { 'name': new RegExp(keyword, 'i')},
            { 'metadata.name': new RegExp(keyword, 'i')},
            { 'metadata.category': new RegExp(keyword, 'i')},
            { 'metadata.brand.name': new RegExp(keyword, 'i')},
            { 'metadata.description': new RegExp(keyword, 'i')}
        ));
    }
    if(req.query.businessModels && typeof(req.query.businessModels) == 'string') filters.businessModels = req.query.businessModels.split(',').sort((a, b) => ('' + a).localeCompare(b));
    if((cachedResponsed = restApisCache.get(JSON.stringify(filters))) != null) res.json(cachedResponsed);
    else {
        try {
            if(req.query.businessModels && typeof(req.query.businessModels) == 'string') {
                var businessModels = filters.businessModels;
                restApis = await Promise.all(businessModels.map(async (businessModel) => {
                    filters.businessModels = businessModel;
                    if(keywords)
                        restApisPartial = await RestApis.find(filters, { versions: 0 });
                    else
                        restApisPartial = await RestApis.find(filters, { versions: 0 }).skip(page * countPerPage).limit(countPerPage);
                    return restApisPartial;
                }));
                var seen = {}; // We flattern the arrays of arrays and remove duplicates
                restApis = restApis.flat().filter(item => seen.hasOwnProperty(item._id) ? false : (seen[item._id] = true));
                filters.businessModels = businessModels;
            } else {
                if(keywords)
                    restApis = await RestApis.find(filters, { versions: 0 });
                else
                    restApis = await RestApis.find(filters, { versions: 0 }).skip(page * countPerPage).limit(countPerPage);
            }
            if(keywords)
                restApis = documentClassifier.rankRestApis(keywords, restApis.filter(restApi => restApi.metadata != null)).slice(page * countPerPage, page * countPerPage + countPerPage);
            res.json(restApis);
            filters.page = page;
            restApisCache.set(JSON.stringify(filters), restApis);
        } catch (err) {
            console.log(err);
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        }
    }
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
 *                logoUrl:
 *                  type: string
 *                  pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *                  description: Absolute URL to the logo of the API
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
    new_restApi.save(async function(err, restApi) {
        if(err) {
            if(err.name=='ValidationError') {
                res.status(422).send({ err: dict.get('ErrorSchema', lang) });
            }
            else{
                console.error('Error create data in DB');
                res.status(500).send({ err: dict.get('ErrorCreateDB', lang) });
            }
        } else {
            var userId = await auth.getUserId(req.headers['authorization']);
            historyContributions.create_a_historyContribution(restApi._id, userId, 'ADD', 'RestAPI');
            restApi.versions = getLastVersion(restApi);
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
    if((cachedResponsed = restApisCache.get('read_a_restApi:' + id)) != null) res.json(cachedResponsed);

    RestApis.findById(id, function (err, restApi) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
        } else {
            if (restApi) {
                restApi.versions = getLastVersion(restApi);
                res.send(restApi);
                restApisCache.set(JSON.stringify('read_a_restApi:' + id), restApi);
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
                    if(updatedRestApi.logoUrl) restApi.logoUrl = updatedRestApi.logoUrl;
                    if(updatedRestApi.metadata && updatedRestApi.metadata.description) restApi.metadata.description = updatedRestApi.metadata.description;
                    if(updatedRestApi.businessModels) restApi.businessModels = updatedRestApi.businessModels;
                    RestApis.updateOne({ _id: restApi._id }, restApi, { runValidators: true }, async function(err2, _) {
                        if (err2) {
                            if(err2.name=='ValidationError') {
                                res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                            }
                            else{
                                console.error('Error updating data from DB');
                                res.status(500).send({ err: dict.get('ErrorUpdateDB', lang) });
                            }
                        } else {
                            var userId = await auth.getUserId(req.headers['authorization']);
                            historyContributions.create_a_historyContribution(restApi._id, userId, 'EDIT', 'RestAPI');
                            restApi.versions = getLastVersion(restApi);
                            res.send(restApi); // return the updated restApi
                            if(restApisCache.get('read_a_restApi:' + id)) {
                                restApisCache.del('read_a_restApi:' + id)
                            }
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
 *      security:
 *        firebase:
 *          - write
 */
exports.handle_restApi_blacklist = function(req, res) {
    var blacklisted = req.body ? req.body.blacklisted : undefined;
    var id = req.params.restApiId;
    var lang = dict.getLang(req);
    if (blacklisted == null || typeof(blacklisted) != "boolean") {
        console.warn("New PATCH request to /restApis/id/blacklist without correct attribute blacklisted, sending 422...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) });
    } else {
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
                            newRestApi.versions = getLastVersion(newRestApi);
                            res.send(newRestApi);
                            if(restApisCache.get('read_a_restApi:' + id)) {
                                restApisCache.del('read_a_restApi:' + id)
                            }
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
 *      security:
 *        firebase: []
 */
exports.link_provider_to_api = function(req, res) {
    var id = req.params.restApiId;
    var provider_id = req.params.providerId;
    var lang = dict.getLang(req);
    Providers.findById(provider_id, (err, provider) => {
        if (err) {
            console.error('Error getting data from DB');
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else if(provider) {
            RestApis.findOneAndUpdate({"_id": id}, { "provider_id": provider_id }, { new: true }, async function(err2, restApi) {
                if (err2) {
                    console.error('Error getting data from DB');
                    res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
                } else {
                    if (restApi) {
                        restApi.versions = getLastVersion(restApi);
                        res.send(restApi);
                        var userId = await auth.getUserId(req.headers['authorization']);
                        historyContributions.create_a_historyContribution(restApi._id, userId, 'EDIT', 'RestAPI');
                        if(restApisCache.get('read_a_restApi:' + id)) {
                            restApisCache.del('read_a_restApi:' + id)
                        }
                    } else {
                        console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
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
    RestApis.findOneAndDelete({"_id": id}, null, async function (err, restApi) {
      if (err) {
        console.error('Error removing data from DB');
        res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
      } else {
        if(restApi) {
            var userId = await auth.getUserId(req.headers['authorization']);
            historyContributions.create_a_historyContribution(restApi._id, userId, 'DELETE', 'RestAPI', restApi.name);
            historyContributions.update_name_versions_contributions(restApi.versions, restApi.name);
            if(restApisCache.get('read_a_restApi:' + id)) {
                restApisCache.del('read_a_restApi:' + id)
            }
        }
        res.sendStatus(204);
      }
    });
}