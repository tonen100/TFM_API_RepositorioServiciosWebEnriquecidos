/* providerController.js 
* 
* Provider API service
* 
* Authors: 
* Pierre-François Giraud
* 
* Universidad de Sevilla 
* 2019-20
* 
*/

var mongoose = require('mongoose')
Providers = mongoose.model('Providers');
var auth = require('./authController');
var contributionsHistory = require('./contributionHistoryController');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

 /**
 * @swagger
 * path:
 *  '/providers':
 *    get:
 *      tags:
 *        - Provider
 *      description: >-
 *        Retrieve all the providers
 *      operationId: getProviders
 *      parameters:
 *        - name: name
 *          in: query
 *          description: The beginning of the name of the API to retrieve
 *          required: false
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
 *                    $ref: '#/components/schemas/provider'
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.list_all_providers = function(req, res) {
    var lang = dict.getLang(req);
    var filters = { blacklisted: false };
    
    if(req.query.include_blacklisted && typeof(req.query.include_blacklisted) == 'boolean') delete filters.blacklisted;
    if(req.query.name && typeof(req.query.name) == 'string') filters.name = {$regex : "^" + name + ".*"};
    Providers.find(filters, function(err, providers) {
        if(err) {
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            res.json(providers);
        }
    });
}

/**
 * @swagger
 * path:
 *  '/providers':
 *    post:
 *      tags:
 *        - Provider
 *      description: >-
 *        Create a new provider
 *      operationId: postProviders
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
 *              properties:
 *                name:
 *                  type: string
 *                  description: API name
 *                  example: 'Twitter API'
 *                logoUrl:
 *                  type: string
 *                  pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *                  description: Absolute URL to the logo of the provider
 *                description:
 *                  type: string
 *                  description: Provider description
 *                  example: 'descTrip'
 *                externalLinks:
 *                  type: array
 *                  items:
 *                    type: string
 *                    pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *                    description: external references (websites) to the provider (main website for example, or urls of distincts projects that are relevant in the topic of Web APIs)
 *      responses:
 *        '201':
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/provider'
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.create_a_provider = function(req, res) {
    var new_provider = new Providers(req.body);
    var lang = dict.getLang(req);
    new_provider.save(async function(err, provider) {
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
            contributionsHistory.create_a_contributionHistory(provider._id, userId, 'ADD', 'Provider');
            res.status(201).send(provider);
        }
    });
}

/**
 * @swagger
 * path:
 *  '/providers/{providerId}':
 *    get:
 *      tags:
 *        - Provider
 *      description: >-
 *        Retrieve details from a specific provider
 *      operationId: getProvider
 *      parameters:
 *         - name: providerId
 *           in: path
 *           description: id of the provider you want to get details from
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
 *                - $ref: '#/components/schemas/provider'
 *        '404':
 *           description: Provider not found
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.read_a_provider = function(req, res) {
    var id = req.params.providerId;
    var lang = dict.getLang(req);
    Providers.findById(id, function (err, provider) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
        } else {
          if (provider) {
            res.send(provider);
          } else {
            console.warn(dict.get('RessourceNotFound', lang, 'provider', id));
            res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'provider', id) }); // not found
          }
        }
      });
}

/**
 * @swagger
 * path:
 *  '/providers/{providerId}':
 *    put:
 *      tags:
 *        - Provider
 *      description: >-
 *        Update a specific provider
 *      operationId: putProvider
 *      parameters:
 *         - name: providerId
 *           in: path
 *           description: id of the provider you want to update
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
 *                - $ref: '#/components/schemas/provider'
 *      responses:
 *        '200':
 *          description: Updated provider
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/provider'
 *        '404':
 *           description: Provider not found
 *           content: {}
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.edit_a_provider = function(req, res) {
    var updatedProvider = req.body;
    var id = req.params.providerId;
    var lang = dict.getLang(req);
    if (!updatedProvider) {
        console.warn("New PUT request to /providers/ without provider, sending 400...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) }); // bad request
    } else {
        Providers.findById(id, function(err, provider) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
              } else {
                if (provider) {
                    if(updatedProvider.name) provider.name = updatedProvider.name;
                    if(updatedProvider.logoUrl) provider.logoUrl = updatedProvider.logoUrl;
                    if(updatedProvider.description) provider.description = updatedProvider.description;
                    if(updatedProvider.externalLinks) provider.externalLinks = updatedProvider.externalLinks;
                    provider.save(async function(err2, newProvider) {
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
                            contributionsHistory.create_a_contributionHistory(provider._id, userId, 'EDIT', 'Provider');
                            res.send(newProvider);
                        }
                    });
                } else {
                  console.warn(dict.get('RessourceNotFound', lang, 'provider', id));
                  res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'provider', id) }); // not found
                }
            }
        });
    }
}


/**
 * @swagger
 * path:
 *  '/providers/{providerId}/blacklist':
 *    patch:
 *      tags:
 *        - Provider
 *      description: >-
 *        Blacklist or remove from blacklist a provider
 *      operationId: patchProviderBlacklist
 *      parameters:
 *         - name: providerId
 *           in: path
 *           description: id of the provider you want to blacklist or remove from blacklist
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
 *          description: Updated provider
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/provider'
 *        '404':
 *           description: Provider not found
 *           content: Not Found
 *        '422':
 *           description: Incorrect body
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.handle_provider_blacklist = async function(req, res) {
    var blacklisted = req.body ? req.body.blacklisted : undefined;
    var id = req.params.providerId;
    var lang = dict.getLang(req);
    if (blacklisted == null || typeof(blacklisted) != "boolean") {
        console.warn("New PATCH request to /providers/id/blacklist without correct attribute blacklisted, sending 422...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) });
    } else {
        Providers.findOneAndUpdate({"_id": id}, { "blacklisted": blacklisted }, { new: true }, function(err, provider) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
            } else {
                if (provider) {
                    RestAPIs.find({ "provider_id": id }, async (err2, restApis) => {
                        if(err2) {
                            console.error('Error getting data from DB');
                            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
                        } else {
                            await restApis.forEach(async (restApi) => {
                                restApi.versions.forEach(version => version.blacklisted = blacklisted);
                                restApi.blacklisted = blacklisted;
                                await restApi.save();
                            });
                            res.send(provider);
                        }
                    });
                } else {
                    console.warn(dict.get('RessourceNotFound', lang, 'provider', id));
                    res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'provider', id) });
                }
            }
        });
    }
}

/**
 * @swagger
 * path:
 *  '/providers/{providerId}':
 *    delete:
 *      tags:
 *        - Provider
 *      description: >-
 *        Delete a specific provider
 *      operationId: deleteProvider
 *      parameters:
 *         - name: providerId
 *           in: path
 *           description: id of the provider you want to delete
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
exports.delete_a_provider = function(req, res) {
    var id = req.params.providerId;
    var lang = dict.getLang(req);
    Providers.findOneAndDelete({"_id": id}, null, async function (err, provider) {
      if (err) {
        console.error('Error removing data from DB');
        res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
      } else {
        if(provider) {
            var userId = await auth.getUserId(req.headers['authorization']);
            contributionsHistory.create_a_contributionHistory(provider._id, userId, 'DELETE', 'Provider', provider.name);
        }
        res.sendStatus(204);
      }
    });
}