/* versionController.js 
* 
* Version API service
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
Versions = mongoose.model('Versions');
var oas2SchemaOrg = require('oas2schema.org');
var NodeCache = require( "node-cache" );
var versionsCache = new NodeCache( { stdTTL: 60, checkperiod: 10, useClones: true } );

var contributionsHistory = require('./contributionHistoryController');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

function generateMetadata(version) {
    if(version.originalDocumentation) {
        return oas2SchemaOrg.oasConverter.convertToOASv3(version.originalDocumentation, oas2SchemaOrg.oasConverter.extractFormat(version.originalDocumentation)).then(oasDoc => {
            version.oasDocumentation = JSON.stringify(oasDoc, null, '\t');
            return oas2SchemaOrg.convertToMetadata(oasDoc, 'OASv3', { urlAPI: version.urlAPI, urlDoc: version.urlDoc }).then(metadata => {
                version.metadata = metadata;
                delete version.urlAPI;
                delete version.urlDoc;
                return version;
            });
        });
    }
}

 /**
 * @swagger
 * path:
 *  '/restApis/{restApiId}/versions':
 *    get:
 *      tags:
 *        - Version
 *      description: >-
 *        Retrieve all the versions of a rest API
 *      operationId: getVersions
 *      parameters:
 *        - name: restApiId
 *          in: path
 *          description: id of the rest API you wanna retrieve versions from
 *          required: true
 *          schema:
 *            type: string
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
 *                    $ref: '#/components/schemas/version'
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.list_all_restApi_versions = function(req, res) {
    var id = req.params.versionId;
    var api_id = req.params.restApiId;
    var lang = dict.getLang(req);
    if((cachedResponsed = versionsCache.get('list_all_restApi_versions:' + id)) != null) res.json(cachedResponsed);
    else {
        RestApis.findById(api_id, function(err, restApi) {
            if(err) {
                console.error(dict.get('ErrorGetDB', lang))
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
            } else if (restApi) {
                restApi.versions.filter(version => version.blacklisted != false).forEach(version => {
                    delete version.originalDocumentation;
                    delete version.oasDocumentation;
                    delete version.metadata;
                })
                res.json(restApi.versions);
                versionsCache.set('list_all_restApi_versions:' + id, restApi.versions);
            } else {
                console.warn(dict.get('RessourceNotFound', lang, 'restApi', api_id));
                res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', api_id) });
            }
        });
    }
}

/**
 * @swagger
 * path:
 *  '/restApis/{restApiId}/versions':
 *    post:
 *      tags:
 *        - Version
 *      description: >-
 *        Create a new version of a rest API
 *      operationId: postVersions
 *      parameters:
 *        - name: restApiId
 *          in: path
 *          description: id of the rest API you wanna retrieve versions from
 *          required: true
 *          schema:
 *            type: string
 *        - $ref: '#/components/parameters/language'
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - number
 *                - originalDocumentation
 *                - description
 *              properties:
 *                number:
 *                  type: string
 *                  description: Number of release of the version. Advised to respect semver specification
 *                  example: 'v1.0.0'
 *                originalDocumentation:
 *                  type: string
 *                  description: The valid RESTfull API description made in any of the supported languages (OASv2, OASv3, RAMLv1, API Blueprint)
 *                description:
 *                  type: string
 *                  description: A description of this version specificities (compared to the other versions)
 *                urlAPI:
 *                  type: string
 *                  pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *                urlDoc:
 *                  type: string
 *                  pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *      responses:
 *        '201':
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/version'
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.create_a_restApi_version = function(req, res) {
    var api_id = req.params.restApiId;
    var lang = dict.getLang(req);
    RestApis.findById(api_id, async function (err, restApi) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            if (restApi) {
                if (!restApi.versions.find(version => version.number == req.body.number)) {
                    var newVersion = new Versions(req.body);
                    try {
                        newVersion = await generateMetadata(newVersion);
                        newVersion.save((err2, version) => {
                            if(err2) {
                                if(err2.name=='ValidationError') {
                                    res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                                } else {
                                    console.error(dict.get('ErrorCreateDB', lang));
                                    res.status(500).send({ err: dict.get('ErrorCreateDB', lang) });
                                }
                            } else {
                                restApi.metadata = version.metadata;
                                restApi.versions.push(version);
                                restApi.save(function(err3, newRestApi) {
                                    if(err3) {
                                        if(err3.name=='ValidationError') {
                                            res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                                        }
                                        else{
                                            console.error('Error create data in DB');
                                            res.status(500).send({ err: dict.get('ErrorCreateDB', lang) });
                                        }
                                    } else {
                                        contributionsHistory.create_a_contributionHistory(version._id, version._id, 'ADD', 'Version'); // TODO
                                        res.status(201).send(version);
                                    }
                                });
                            }
                        });
                    } catch(errGenerate) {
                        if(errGenerate.name == "InvalidFormat") res.status(422).send(dict.get('ErrorDocumentationInvalid', lang, errGenerate.message));
                        else res.status(422).send(dict.get('ErrorConvertToMetadataFailed', lang, errGenerate.message));
                    }
                } else {
                    res.status(422).send({ err: dict.get('ErrorVersionNumberAlreadyUsed', lang, req.body.number) });
                }
            } else {
                console.warn(dict.get('RessourceNotFound', lang, 'restApi', api_id));
                res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', api_id) });
            }
        }
    });
}

/**
 * @swagger
 * path:
 *  '/restApis/{restApiId}/versions/{versionId}':
 *    get:
 *      tags:
 *        - Version
 *      description: >-
 *        Retrieve details from a specific rest API
 *      operationId: getVersion
 *      parameters:
 *        - name: restApiId
 *          in: path
 *          description: id of the rest API you wanna retrieve versions from
 *          required: true
 *          schema:
 *            type: string
 *        - name: versionId
 *          in: path
 *          description: id of the version of the rest API you want to get details from
 *          required: true
 *          schema:
 *            type: string
 *        - $ref: '#/components/parameters/language'
 *      responses:
 *        '200':
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/version'
 *        '404':
 *           description: Version not found
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.read_a_restApi_version = function(req, res) {
    var api_id = req.params.restApiId;
    var id = req.params.versionId;
    var lang = dict.getLang(req);

    RestApis.findById(api_id, function (err, restApi) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
        } else {
          if (restApi) {
            var version = restApi.versions.find(_version => _version._id == id);
            if(version) {
                res.send(version);
            } else {
                console.warn(dict.get('RessourceNotFound', lang, 'version', id));
                res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'version', id) }); // not found
            }
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
 *  '/restApis/{restApiId}/versions/{versionId}':
 *    put:
 *      tags:
 *        - Version
 *      description: >-
 *        Update a specific rest API
 *      operationId: putVersion
 *      parameters:
 *        - name: restApiId
 *          in: path
 *          description: id of the rest API you wanna retrieve versions from
 *          required: true
 *          schema:
 *            type: string
 *        - name: versionId
 *          in: path
 *          description: id of the version of the rest API you want to update
 *          required: true
 *          schema:
 *            type: string
 *        - $ref: '#/components/parameters/language'
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              allOf:
 *                - $ref: '#/components/schemas/version'
 *      responses:
 *        '200':
 *          description: Updated version of the rest API
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/version'
 *        '404':
 *           description: Version not found
 *           content: {}
 *        '422':
 *           description: Unprocesable entity
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.edit_a_restApi_version = function(req, res) {
    var updatedVersion = req.body;
    var api_id = req.params.restApiId;
    var id = req.params.versionId;
    var lang = dict.getLang(req);
    if (!updatedVersion) {
        console.warn("New PUT request to /versions/ without version, sending 400...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) }); // bad request
    } else {
        RestApis.findById(api_id, async function(err, restApi) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
              } else {
                if (restApi) {
                    var version = restApi.versions.find(_version => _version._id == id);
                    if(version) {
                        if(updatedVersion.originalDocumentation && version.originalDocumentation != updatedVersion.originalDocumentation) {
                            version.originalDocumentation = updatedVersion.originalDocumentation;
                            delete version.oasDocumentation;
                            delete version.metadata;
                            version = await generateMetadata(version);
                            if(restApi.versions.sort((a, b) => b.createdAt - a.createdAt)[0]._id == id) { // if last version we reaffect metadata of API
                                restApi.metadata = newVersion.metadata;
                            }
                        }
                        if(updatedVersion.number && version.number != updatedVersion.number) {
                            if(!restApi.versions.find(_version => _version.number == updatedVersion.number)) {
                                version.number = updatedVersion.number;
                            } else {
                                res.status(422).send({ err: dict.get('ErrorVersionNumberAlreadyUsed', lang, version.number) }); //TODO
                            }
                        }
                        if(updatedVersion.description) version.description = updatedVersion.description;
                        restApi.save(function(err3, newRestApi) {
                            if(err3) {
                                if(err3.name=='ValidationError') {
                                    res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                                } else {
                                    console.error(dict.get('ErrorUpdateDB', lang));
                                    res.status(500).send({ err: dict.get('ErrorUpdateDB', lang) });
                                }
                            } else {
                                contributionsHistory.create_a_contributionHistory(id, id, 'EDIT', 'Version'); // TODO
                                res.status(200).send(newRestApi.versions.find(_version => _version.number == req.body.number));
                            }
                        });                         
                    } else {
                        console.warn(dict.get('RessourceNotFound', lang, 'version', id));
                        res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'version', id) }); // not found
                    }
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
 *  '/restApis/{restApiId}/versions/{versionId}/blacklist':
 *    patch:
 *      tags:
 *        - Version
 *      description: >-
 *        Blacklist or remove from blacklist a version of a rest API
 *      operationId: patchVersionBlacklist
 *      parameters:
 *        - name: restApiId
 *          in: path
 *          description: id of the rest API you wanna blacklist a version from
 *          required: true
 *          schema:
 *            type: string
 *        - name: versionId
 *          in: path
 *          description: id of the version of a rest API you want to blacklist or remove from blacklist
 *          required: true
 *          schema:
 *            type: string
 *        - $ref: '#/components/parameters/language'
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
 *          description: Updated version
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                - $ref: '#/components/schemas/version'
 *        '404':
 *           description: Version not found
 *           content: Not Found
 *        '422':
 *           description: Incorrect body
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.handle_restApi_version_blacklist = function(req, res) {
    var blacklisted = req.body ? req.body.blacklisted : undefined;
    var api_id = req.params.restApiId;
    var id = req.params.versionId;
    var lang = dict.getLang(req);
    if (blacklisted == null || typeof(blacklisted) != "boolean") {
        console.warn("New PATCH request to /versions/id/blacklist without correct attribute blacklisted, sending 422...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) });
    } else {
        RestApis.findById(api_id, function(err, restApi) {
            if (err) {
                console.error('Error getting data from DB');
                res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
              } else {
                if (restApi) {
                    var version = restApi.versions.find(_version => _version._id == id);
                    if(version) {
                        version.blacklisted = blacklisted;
                        restApi.save(function(err2, newRestApi) {
                            if(err2) {
                                if(err2.name=='ValidationError') {
                                    res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                                }
                                else{
                                    console.error(dict.get('ErrorUpdateDB', lang));
                                    res.status(500).send({ err: dict.get('ErrorUpdateDB', lang) });
                                }
                            } else {
                                res.status(200).send(newRestApi.versions.find(_version => _version.number ==version.number));
                            }
                        });
                    } else {
                        console.warn(dict.get('RessourceNotFound', lang, 'version', id));
                        res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'version', id) }); // not found
                    }
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
 *  '/restApis/{restApiId}/versions/{versionId}':
 *    delete:
 *      tags:
 *        - Version
 *      description: >-
 *        Delete a specific version of a rest API
 *      operationId: deleteVersion
 *      parameters:
 *         - name: versionId
 *           in: path
 *           description: id of the version of a rest API you want to delete
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
exports.delete_a_restApi_version = function(req, res) {
    var api_id = req.params.restApiId;
    var id = req.params.versionId;
    var lang = dict.getLang(req);
    RestApis.findById(api_id, function(err, restApi) {
        if (err) {
            console.error('Error getting data from DB');
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
          } else {
            if (restApi) {
                if(restApi.versions.find(_version => _version._id == id))
                    contributionsHistory.create_a_contributionHistory(id, id, 'DELETE', 'Version', restApi.name); // TODO
                restApi.versions = restApi.versions.filter(_version => _version._id != id);
                restApi.save(function(err2, _) {
                    if(err2) {
                        console.error('Error removing data from DB');
                        res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
                    } else {
                        Versions.findByIdAndDelete(id);
                        res.sendStatus(204);
                    }
                });
            } else {
                console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
                res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', id) }); // not found
            }
        }
    });
}