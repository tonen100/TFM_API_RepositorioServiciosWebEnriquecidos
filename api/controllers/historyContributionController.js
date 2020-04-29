/* historyContributionController.js 
* 
* HistoryContribution API service
* 
* Authors: 
* Pierre-François Giraud
* 
* Universidad de Sevilla 
* 2019-20
* 
*/

var mongoose = require('mongoose')
HistoryContributions = mongoose.model('HistoryContributions');
Providers = mongoose.model('Providers');
RestApis = mongoose.model('RestApis');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

async function getContributionNames (historyContributions) {
    await historyContributions
      .filter(historyContribution => !historyContribution.name)
      .forEach(async (historyContribution) => {
        switch(historyContribution.typeContribution) {
            case 'Provider':
              await Providers.findById(historyContribution.contribution_id, (err, res) => {
                if(err) throw err;
                else if(res) historyContribution.name = res.name;
              });
              break;
            case 'RestAPI':
              await RestApis.findById(historyContribution.contribution_id, (err, res) => {
                if(err) throw err;
                else if(res) historyContribution.name = res.name;
              });
              break;
            case 'Version':
              await RestApis.find({ "versions": { "_id": historyContribution.contribution_id } }, (err, res) => {
                if(err) throw err;
                else if(res) historyContribution.name = res.name;
              });
              break;
        }
    });
}

 /**
 * @swagger
 * path:
 *  '/historyContributions':
 *    get:
 *      tags:
 *        - HistoryContribution
 *      description: >-
 *        Retrieve the contributions history
 *      operationId: getHistoryContributions
 *      parameters:
 *        - name: contributionId
 *          in: query
 *          description: The id of the contribution to retrieve the history for
 *          required: false
 *        - name: contributorId
 *          in: query
 *          description: The id of the contributor to retrieve the history for
 *          required: false
 *        - name: typeContribution
 *          in: query
 *          description: The beginning of the name of the API to retrieve
 *          schema:
 *            type: string
 *            enum: [RestAPI, Version, Provider]
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
 *                    $ref: '#/components/schemas/historyContribution'
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.list_all_historyContributions = function(req, res) {
    var lang = dict.getLang(req);
    var filters = {};
    if(req.query.contributionId) filters.contribution_id = req.query.contributionId;
    if(req.query.contributorId) filters.contributor_id = req.query.contributorId;
    if(req.query.typeContribution) filters.typeContribution = req.query.typeContribution;
    HistoryContributions.find(filters, function(err, historyContributions) {
        if(err) {
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            if(filters.contributor_id) {
              getContributionNames(historyContributions).then(() => res.json(historyContributions))
            } else res.json(historyContributions);
        }
    });
}

exports.create_a_historyContribution = function(contribution_id, contributor_id, action, typeContribution, name) {
    var new_historyContribution = new HistoryContributions({
        contribution_id: contribution_id,
        contributor_id: contributor_id,
        action: action,
        typeContribution: typeContribution
    });
    if(name) { //In that case the contribution has been deleted and we just keep tracked of the name
        new_historyContribution.name = name;
        HistoryContributions.updateMany({ "contribution_id": contribution_id, "typeContribution": typeContribution }, { "name": name });
    }
    new_historyContribution.save();
}

/**
 * @swagger
 * path:
 *  '/historyContributions/{historyContributionId}':
 *    get:
 *      tags:
 *        - HistoryContribution
 *      description: >-
 *        Retrieve details from a specific contribution history row
 *      operationId: getHistoryContribution
 *      parameters:
 *         - name: historyContributionId
 *           in: path
 *           description: id of the contribution history row you want to get details from
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
 *                - $ref: '#/components/schemas/historyContribution'
 *        '404':
 *           description: Contribution history row not found
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.read_a_historyContribution = function(req, res) {
    var id = req.params.historyContributionId;
    var lang = dict.getLang(req);
    HistoryContributions.findById(id, function (err, historyContribution) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
        } else {
          if (historyContribution) {
            res.send(historyContribution);
          } else {
            console.warn(dict.get('RessourceNotFound', lang, 'historyContribution', id));
            res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'historyContribution', id) }); // not found
          }
        }
      });
}