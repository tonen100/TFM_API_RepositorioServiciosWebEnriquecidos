var mongoose = require('mongoose');
var mongodb = require('mongodb');
var Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      historyContribution:
 *        type: object
 *        required:
 *          - contribution_id
 *          - contributor_id
 *          - action
 *          - typeContribution
 *        properties:
 *          id:
 *            type: string
 *          contribution_id:
 *            type: string
 *            description: Id of the ressource (or contribution) on which the action has been performed
 *          contributor_id:
 *            type: array
 *            description: Id of the user (or contributor) that performed the action
 *            items:
 *              type: string
 *          date:
 *            type: string
 *            format: date
 *            description: Date on which the action has been performed
 *          action:
 *            type: boolean
 *            enum: ['ADD', 'EDIT', 'DELETE']
 *            description: Type of action performed
 *          typeContribution:
 *            type: boolean
 *            enum: ['Provider', 'RestAPI', 'Version']
 *          name:
 *            type: string
 *            description: Name of the ressource (or contribution) on which the action has been performed
 */
var historyContributionSchema = new Schema({
    contribution_id: {
        type: mongodb.ObjectID,
        required: 'Enter the id of the contribution'
    }, contributor_id: {
        type: mongodb.ObjectId,
        required: 'Enter the id of the contributor'
    }, date: {
        type:Date,
        default: Date.now
    }, action: {
        type: String,
        enum: ['ADD', 'EDIT', 'DELETE'],
        required: 'Enter the action realised'
    }, typeContribution: {
        type: String,
        enum: [
            'Provider',
            'RestAPI',
            'Version'
        ],
        required: 'Enter the type of the contribution realised'
    }, name: {
        type: String
    }, number: {
        type: String
    }
}, { strict: true });

historyContributionSchema.index({ 'contributor_id': 1 });
historyContributionSchema.index({ 'contribution_id': 1 });

module.exports = mongoose.model('HistoryContributions', historyContributionSchema);