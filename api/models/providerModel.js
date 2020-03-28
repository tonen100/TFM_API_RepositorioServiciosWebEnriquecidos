var mongoose = require('mongoose');
var Schema = mongoose.Schema;
User = require('./userModel');
RestAPIs = require('./restApiModel');
var mongodb = require('mongodb');

/**
 * @swagger
 *  components:
 *    schemas:
 *      RestAPI:
 *        type: object
 *        required:
 *          - name
 *        properties:
 *          name:
 *            type: string
 *            description: API name
 *            example: 'Twitter API'
 *          logo:
 *            type: array
 *            items:
 *              type: string
 *          description:
 *            type: string
 *            description: Provider description
 *            example: 'descTrip'
 *          externalLinks:
 *            type: array
 *            items:
 *              type: string
 *              pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *            external references (websites) to the provider (main website for example, or urls of distincts projects that are relevant in the topic of Web APIs)
 *          restAPI_ids:
 *            type: array
 *            items:
 *              type: string
 *            description: lists of the APIs referenced in this API that this providers own
 *          contributor_ids:
 *            type: string
 *            description: The user who added or edit 
 */
var providerSchema = new Schema({
    name: {
        type: String,
        required: 'Enter the name of the provider please'
    }, logo: {
        data: Buffer,
        contentType: String
    }, description: {
        type: String,
    }, externalLinks: [{
        type: String,
    }], restAPI_ids: [{
        type: mongodb.ObjectId
    }], contributor_id: {
        type: mongodb.ObjectId
    }
}, { strict: true });

providerSchema.pre('deleteOne', async function(callback){
    //Delete all object associated with this trip
    var providerId = this._conditions._id;
    await Providers.findById(providerId, (err, res => {
        if(err) throw err;
        res.restAPI_ids.foreach(api => RestAPIs.deleteById(api._id))
    }))
    callback();
});

module.exports = mongoose.model('Providers', providerSchema);