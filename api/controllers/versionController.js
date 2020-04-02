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
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

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
exports.list_all_versions = function(req, res) {
    var lang = dict.getLang(req);
    var api_id = req.params.restApiId;
    RestApis.find({ "_id": api_id }, function(err, restApi) {
        if(err) {
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            res.json(restApi.versions);
        }
    })
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
exports.create_a_version = function(req, res) {
    var api_id = req.params.restApiId;
    var lang = dict.getLang(req);
    RestApis.findById(api_id, function (err, restApi) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            if (restApi) {
                if (!restApi.versions.find(version => version.number == req.body.number)) {
                    restApi.versions.push(req.body);
                    restApi.save(function(err2, newRestApi) {
                        if(err2) {
                            if(err2.name=='ValidationError') {
                                res.status(422).send({ err: dict.get('ErrorSchema', lang) });
                            }
                            else{
                                console.error('Error create data in DB');
                                res.status(500).send({ err: dict.get('ErrorCreateDB', lang) });
                            }
                        } else {
                            res.status(201).send(newRestApi.versions.find(version.number == req.body.number));
                        }
                    });
                } else {
                    res.status(422).send({ err: dict.get('ErrorVersionNumberAlreadyUsed', lang, version.number) }); //TODO
                }
            } else {
                console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
                res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', id) });
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
exports.read_a_version = function(req, res) {
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
exports.edit_a_version = function(req, res) {
    var updatedVersion = req.body;
    var api_id = req.params.restApiId;
    var id = req.params.versionId;
    var lang = dict.getLang(req);
    if (!updatedVersion) {
        console.warn("New PUT request to /versions/ without version, sending 400...");
        res.status(422).send({ err: dict.get('ErrorSchema', lang) }); // bad request
    } else {
        RestApis.findById(api_id, function(err, restApi) {
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
                        }
                        if(updatedVersion.number && version.number != updatedVersion.number) {
                            if(!restApi.versions.find(_version => _version.number == number)) {
                                version.number = updatedVersion.number;
                            } else {
                                res.status(422).send({ err: dict.get('ErrorVersionNumberAlreadyUsed', lang, version.number) }); //TODO
                            }
                        }
                        if(updatedVersion.description) version.description = updatedVersion.description;
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
                                res.status(200).send(newRestApi.versions.find(version.number == req.body.number));
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
exports.handle_version_blacklist = function(req, res) {
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
                        version.blacklisted = updatedVersion.blacklisted;
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
                                res.status(200).send(newRestApi.versions.find(version.number == req.body.number));
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
exports.delete_a_version = function(req, res) {
    var api_id = req.params.restApiId;
    var id = req.params.versionId;
    var lang = dict.getLang(req);
    RestApis.findById(api_id, function(err, restApi) {
        if (err) {
            console.error('Error getting data from DB');
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
          } else {
            if (restApi) {
                restApi.versions = restApi.versions.filter(_version => _version._id == id);
                restApi.save(function(err2, _) {
                    if(err2) {
                        console.error('Error removing data from DB');
                        res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
                    } else {
                        res.sendStatus(204);
                    }
                });
            } else {
                console.warn(dict.get('RessourceNotFound', lang, 'restApi', id));
                res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'restApi', id) }); // not found
            }
        }
    });
    Versions.findOneAndDelete({"_id": id}, null, function (err) {
      if (err) {
        console.error('Error removing data from DB');
        res.status(500).send({ err: dict.get('ErrorDeleteDB', lang) }); // internal server error
      } else {
        res.sendStatus(204);
      }
    });
}