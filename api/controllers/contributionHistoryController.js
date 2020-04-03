/* contributionHistoryController.js 
* 
* ContributionHistory API service
* 
* Authors: 
* Pierre-François Giraud
* 
* Universidad de Sevilla 
* 2019-20
* 
*/

var mongoose = require('mongoose')
ContributionsHistory = mongoose.model('ContributionsHistory');
Providers = mongoose.model('Providers');
RestApis = mongoose.model('RestApis');
var LangDictionnary = require('../langDictionnary');
var dict = new LangDictionnary();

async function getContributionNames (contributionsHistory) {
    await contributionsHistory
      .filter(contributionHistory => !contributionHistory.name)
      .forEach(async (contributionHistory) => {
        switch(contributionHistory.typeContribution) {
            case 'Provider':
              await Providers.findById(contributionHistory.contribution_id, (err, res) => {
                if(err) throw err;
                else if(res) contributionHistory.name = res.name;
              });
              break;
            case 'RestAPI':
              await RestApis.findById(contributionHistory.contribution_id, (err, res) => {
                if(err) throw err;
                else if(res) contributionHistory.name = res.name;
              });
              break;
            case 'Version':
              await RestApis.find({ "versions": { "_id": contributionHistory.contribution_id } }, (err, res) => {
                if(err) throw err;
                else if(res) contributionHistory.name = res.name;
              });
              break;
        }
    });
}

 /**
 * @swagger
 * path:
 *  '/contributionsHistory':
 *    get:
 *      tags:
 *        - ContributionHistory
 *      description: >-
 *        Retrieve the contributions history
 *      operationId: getContributionsHistory
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
 *                    $ref: '#/components/schemas/contributionHistory'
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.list_all_contributionsHistory = function(req, res) {
    var lang = dict.getLang(req);
    var filters = {};
    if(req.query.contributionId) filters.contribution_id = req.query.contributionId;
    if(req.query.contributorId) filters.contributor_id = req.query.contributorId;
    if(req.query.typeContribution) filters.typeContribution = req.query.typeContribution;
    ContributionsHistory.find(filters, function(err, contributionsHistory) {
        if(err) {
            res.status(500).send({ err: dict.get('ErrorGetDB', lang) });
        } else {
            if(filters.contributor_id) {
              getContributionNames(contributionsHistory).then(() => res.json(contributionsHistory))
            } else res.json(contributionsHistory);
        }
    });
}

exports.create_a_contributionHistory = function(contribution_id, contributor_id, action, typeContribution, name) {
    var new_contributionHistory = new ContributionsHistory({
        contribution_id: contribution_id,
        contributor_id: contributor_id,
        action: action,
        typeContribution: typeContribution
    });
    if(name) { //In that case the contribution has been deleted and we just keep tracked of the name
        new_contributionHistory.name = name;
        ContributionsHistory.updateMany({ "contribution_id": contribution_id, "typeContribution": typeContribution }, { "name": name });
    }
    new_contributionHistory.save();
}

/**
 * @swagger
 * path:
 *  '/contributionsHistory/{contributionHistoryId}':
 *    get:
 *      tags:
 *        - ContributionHistory
 *      description: >-
 *        Retrieve details from a specific contribution history row
 *      operationId: getContributionHistory
 *      parameters:
 *         - name: contributionHistoryId
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
 *                - $ref: '#/components/schemas/contributionHistory'
 *        '404':
 *           description: Contribution history row not found
 *           content: {}
 *        '500':
 *           description: Internal server error
 *           content: {}
 */
exports.read_a_contributionHistory = function(req, res) {
    var id = req.params.contributionHistoryId;
    var lang = dict.getLang(req);
    ContributionsHistory.findById(id, function (err, contributionHistory) {
        if (err) {
          console.error('Error getting data from DB');
          res.status(500).send({ err: dict.get('ErrorGetDB', lang) }); // internal server error
        } else {
          if (contributionHistory) {
            res.send(contributionHistory);
          } else {
            console.warn(dict.get('RessourceNotFound', lang, 'contributionHistory', id));
            res.status(404).send({ err: dict.get('RessourceNotFound', lang, 'contributionHistory', id) }); // not found
          }
        }
      });
}