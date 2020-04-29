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
 *          contributor_id:
 *            type: array
 *            items:
 *              type: string
 *          date:
 *            type: string
 *            format: date
 *          action:
 *            type: boolean
 *            enum: ['ADD', 'EDIT', 'DELETE']
 *          typeContribution:
 *            type: boolean
 *            enum: ['Provider', 'RestAPI', 'Version']
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
    }, name:{
        type: String
    }
}, { strict: true });

module.exports = mongoose.model('HistoryContributions', historyContributionSchema);